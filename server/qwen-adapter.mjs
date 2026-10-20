import { answerWithFallback, validateAssistantResponse } from '../src/domain/assistant.mjs';
import { getSources } from '../src/domain/sources.mjs';
import { resolveLanguage } from '../src/domain/i18n.mjs';
import { inspectQwenConfig, QWEN_MODEL } from './qwen-config.mjs';

export const MAX_QUESTION_LENGTH = 500;
export const MAX_PROVIDER_RESPONSE_BYTES = 64 * 1024;
export const DEFAULT_TIMEOUT_MS = 8000;

export const PROVIDER_DIAGNOSTICS = Object.freeze({
  NETWORK_DNS_TLS: 'network-dns-tls',
  TIMEOUT: 'timeout',
  AUTHENTICATION: 'authentication',
  ENDPOINT_OR_MODEL_NOT_FOUND: 'endpoint-or-model-not-found',
  RATE_LIMIT: 'rate-limit',
  PROVIDER_HTTP: 'provider-http',
  INVALID_JSON: 'invalid-json',
  INCOMPATIBLE_RESPONSE_SCHEMA: 'incompatible-response-schema'
});

// QWEN_ENDPOINT is the complete OpenAI-compatible chat-completions URL. The
// adapter deliberately does not append /v1/chat/completions or any other path.
const SENSITIVE_INPUT = /(?:password|passcode|otp|one[- ]time\s+(?:password|code)|aadhaar|\bpan\b|ifsc|cvv|card\s*(?:number|no\.?\b)|account\s*(?:number|no\.?\b)|banking\s+credential|document\s+(?:number|contents?))/i;
const UNSUPPORTED_MODEL_CLAIMS = /(?:you\s+(?:own|have|are entitled to)|belongs?\s+to\s+you|we\s+(?:found|confirmed)|(?:claim|asset|holding)\s+(?:is\s+)?(?:approved|confirmed|verified)|(?:you are|you're)\s+eligible|recovered\s+(?:amount|money)|exact\s+(?:amount|deadline)|guarantee(?:d)?)/i;

function fallback(question, language, reason) {
  return { ...answerWithFallback(question, { language }), reason };
}

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function sanitizeDiagnosticMessage(value, secrets = []) {
  let message = String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length > 0) message = message.split(secret).join('[redacted]');
  }
  message = message
    .replace(/Bearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/https?:\/\/[^\s)]+/gi, '[redacted-url]')
    .replace(/(?:api[_-]?key|token|authorization|password|secret)\s*[:=]\s*[^,;\s}]+/gi, '[redacted-secret]')
    .slice(0, 240);
  return message || 'no provider diagnostic message';
}

function responseDiagnosticMessage(body, secrets) {
  try {
    const parsed = JSON.parse(body);
    const error = parsed?.error;
    if (typeof error === 'string') return sanitizeDiagnosticMessage(error, secrets);
    if (error && typeof error === 'object') {
      return sanitizeDiagnosticMessage(error.message || error.code || error.type, secrets);
    }
    return sanitizeDiagnosticMessage(parsed?.message || parsed?.detail || parsed?.code, secrets);
  } catch {
    return sanitizeDiagnosticMessage(body, secrets);
  }
}

export function classifyProviderError(error, { status, phase = 'request' } = {}) {
  if (error?.code === 'QWEN_TIMEOUT' || error?.name === 'AbortError') {
    return PROVIDER_DIAGNOSTICS.TIMEOUT;
  }
  if (typeof status === 'number') {
    if (status === 401 || status === 403) return PROVIDER_DIAGNOSTICS.AUTHENTICATION;
    if (status === 404) return PROVIDER_DIAGNOSTICS.ENDPOINT_OR_MODEL_NOT_FOUND;
    if (status === 429) return PROVIDER_DIAGNOSTICS.RATE_LIMIT;
    if (status >= 400) return PROVIDER_DIAGNOSTICS.PROVIDER_HTTP;
  }
  if (error?.code === 'QWEN_INVALID_JSON') return PROVIDER_DIAGNOSTICS.INVALID_JSON;
  if (error?.code === 'QWEN_RESPONSE_SCHEMA') return PROVIDER_DIAGNOSTICS.INCOMPATIBLE_RESPONSE_SCHEMA;
  if (phase === 'invalid-json' || error?.code === 'QWEN_INVALID_JSON') return PROVIDER_DIAGNOSTICS.INVALID_JSON;
  if (phase === 'response-schema' || error?.code === 'QWEN_RESPONSE_SCHEMA') return PROVIDER_DIAGNOSTICS.INCOMPATIBLE_RESPONSE_SCHEMA;
  const code = String(error?.code || error?.cause?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  if (code === 'QWEN_TIMEOUT' || code === 'ETIMEDOUT') return PROVIDER_DIAGNOSTICS.TIMEOUT;
  if (code.startsWith('EAI_') || ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH', 'EHOSTUNREACH'].includes(code) || code.includes('TLS') || message.includes('tls') || message.includes('certificate')) {
    return PROVIDER_DIAGNOSTICS.NETWORK_DNS_TLS;
  }
  return PROVIDER_DIAGNOSTICS.NETWORK_DNS_TLS;
}

function logProviderDiagnostic(logger, diagnostic) {
  if (typeof logger?.warn !== 'function') return;
  const status = diagnostic.status ? ` status=${diagnostic.status}` : '';
  logger.warn(`[qwen] provider diagnostic category=${diagnostic.category}${status} message=${diagnostic.message}`);
}

function topicSourceIds(question) {
  const normalized = String(question || '').toLowerCase();
  if (/(udgam|bank|deposit|account|बैंक|जमा|खाता)/i.test(normalized)) {
    return ['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-DEA-FAQ', 'SRC-RBI-UDGAM-PORTAL'];
  }
  if (/(iepf|share|dividend|heir|mca|rta|शेयर|लाभांश|वारिस|उत्तराधिकारी)/i.test(normalized)) {
    return ['SRC-IEPFA-HOME', 'SRC-MCA-HOME', 'SRC-NSDL-IEPF-GUIDE'];
  }
  return [];
}

function sourceContext(sourceIds) {
  return getSources(sourceIds).map((source) => ({
    id: source.id,
    institution: source.institution,
    title: source.title,
    supports: source.supports
  }));
}

function systemPrompt(language, sources) {
  return [
    'You are a constrained Reclaim Labs source-grounded assistant.',
    `Answer only in language code ${language}.`,
    'Use only the supplied approved source excerpts. Do not browse, infer missing facts, or cite any source ID not supplied.',
    'Do not state that an asset belongs to the user, that a claim or eligibility is approved, that a result was found, that money was recovered, or that an amount or deadline is known.',
    'Explain preparation and official handoff only. Preserve uncertainty and say when the institution must confirm the result.',
    'Return JSON only with exactly these useful fields: answer (string), status (grounded), sourceIds (array of supplied source IDs).',
    `Approved source excerpts: ${JSON.stringify(sources)}`
  ].join('\n');
}

function providerPayload(question, language, sourceIds) {
  return {
    model: QWEN_MODEL,
    messages: [
      { role: 'system', content: systemPrompt(language, sourceContext(sourceIds)) },
      { role: 'user', content: question }
    ],
    temperature: 0,
    max_tokens: 350
  };
}

function parseEndpoint(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const endpoint = new URL(value);
    if (!['http:', 'https:'].includes(endpoint.protocol)) return null;
    return endpoint.toString();
  } catch {
    return null;
  }
}

async function readResponseText(response, maxBytes = MAX_PROVIDER_RESPONSE_BYTES) {
  if (response?.body?.getReader) {
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error('provider-response-too-large');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock?.();
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');
  }
  const text = await response.text();
  if (Buffer.byteLength(text, 'utf8') > maxBytes) throw new Error('provider-response-too-large');
  return text;
}

function parseModelContent(content) {
  if (typeof content !== 'string') throw codedError('QWEN_RESPONSE_SCHEMA', 'provider-content-invalid');
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  if (!trimmed) throw codedError('QWEN_RESPONSE_SCHEMA', 'provider-content-empty');
  try {
    return JSON.parse(trimmed);
  } catch {
    throw codedError('QWEN_INVALID_JSON', 'provider-json-invalid');
  }
}

function parseProviderResponse(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'undefined') throw codedError('QWEN_RESPONSE_SCHEMA', 'provider-chat-response-schema-invalid');
  return parseModelContent(content);
}

function validateGroundedResponse(candidate, allowedSourceIds, forbiddenStrings = []) {
  if (!candidate || candidate.status !== 'grounded') return { ok: false, error: 'provider-status-invalid' };
  if (!Array.isArray(candidate.sourceIds) || candidate.sourceIds.length === 0) {
    return { ok: false, error: 'provider-source-missing' };
  }
  if (!candidate.sourceIds.every((id) => allowedSourceIds.includes(id))) {
    return { ok: false, error: 'provider-source-not-approved' };
  }
  if (forbiddenStrings.some((value) => value && candidate.answer?.includes(value))) {
    return { ok: false, error: 'provider-secret-leak' };
  }
  if (UNSUPPORTED_MODEL_CLAIMS.test(candidate.answer)) {
    return { ok: false, error: 'provider-unsupported-claim' };
  }
  return validateAssistantResponse(candidate);
}

async function fetchWithTimeout(fetchImpl, endpoint, options, timeoutMs) {
  const controller = new AbortController();
  let timer;
  try {
    return await new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(codedError('QWEN_TIMEOUT', 'provider-timeout'));
      }, timeoutMs);
      Promise.resolve(fetchImpl(endpoint, { ...options, signal: controller.signal }))
        .then(resolve, reject);
    });
  } finally {
    clearTimeout(timer);
  }
}

export function containsSensitiveAssistantInput(question) {
  return SENSITIVE_INPUT.test(String(question || ''));
}

export async function answerWithQwen(question, {
  language = 'en',
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  logger = null
} = {}) {
  const selectedLanguage = resolveLanguage(language);
  const normalizedQuestion = String(question || '').trim().slice(0, MAX_QUESTION_LENGTH);
  if (!normalizedQuestion) return fallback('', selectedLanguage, 'empty-question');
  if (String(question || '').length > MAX_QUESTION_LENGTH) return fallback(normalizedQuestion, selectedLanguage, 'question-too-long');
  if (containsSensitiveAssistantInput(normalizedQuestion)) return fallback(normalizedQuestion, selectedLanguage, 'sensitive-input-refused');

  const allowedSourceIds = topicSourceIds(normalizedQuestion);
  if (allowedSourceIds.length === 0) return fallback(normalizedQuestion, selectedLanguage, 'out-of-corpus');

  const config = inspectQwenConfig(env);
  if (!config.modelValid) return fallback(normalizedQuestion, selectedLanguage, 'model-incompatible');
  if (!config.endpointConfigured || !config.apiKeyConfigured) return fallback(normalizedQuestion, selectedLanguage, 'provider-not-configured');
  const endpoint = parseEndpoint(env.QWEN_ENDPOINT);
  if (!endpoint || typeof fetchImpl !== 'function') return fallback(normalizedQuestion, selectedLanguage, 'provider-unavailable');

  try {
    const response = await fetchWithTimeout(fetchImpl, endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${env.QWEN_API_KEY}`
      },
      body: JSON.stringify(providerPayload(normalizedQuestion, selectedLanguage, allowedSourceIds))
    }, Math.max(1, Math.min(Number(timeoutMs) || DEFAULT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)));
    if (!response?.ok) {
      const category = classifyProviderError(null, { status: response.status });
      let body = '';
      try {
        body = await readResponseText(response);
      } catch {
        body = 'provider error body unavailable';
      }
      logProviderDiagnostic(logger, {
        category,
        status: response.status,
        message: responseDiagnosticMessage(body, [env.QWEN_API_KEY, env.QWEN_ENDPOINT, normalizedQuestion])
      });
      return fallback(normalizedQuestion, selectedLanguage, 'provider-failed');
    }
    let payload;
    try {
      payload = JSON.parse(await readResponseText(response));
    } catch (error) {
      const category = classifyProviderError(error, { phase: 'invalid-json' });
      logProviderDiagnostic(logger, { category, message: 'provider response was not valid JSON' });
      return fallback(normalizedQuestion, selectedLanguage, 'provider-failed');
    }
    const candidate = parseProviderResponse(payload);
    const validation = validateGroundedResponse(candidate, allowedSourceIds, [env.QWEN_API_KEY, env.QWEN_ENDPOINT]);
    if (!validation.ok) {
      logProviderDiagnostic(logger, { category: PROVIDER_DIAGNOSTICS.INCOMPATIBLE_RESPONSE_SCHEMA, message: validation.error });
      return fallback(normalizedQuestion, selectedLanguage, 'provider-failed');
    }
    return { answer: candidate.answer.trim(), sourceIds: [...candidate.sourceIds], status: 'grounded', reason: 'provider-success', provider: 'qwen' };
  } catch (error) {
    const category = classifyProviderError(error);
    logProviderDiagnostic(logger, { category, message: sanitizeDiagnosticMessage(error?.message, [env.QWEN_API_KEY, env.QWEN_ENDPOINT, normalizedQuestion]) });
    return fallback(normalizedQuestion, selectedLanguage, 'provider-failed');
  }
}
