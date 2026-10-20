import assert from 'node:assert/strict';
import test from 'node:test';
import { answerWithQwen, classifyProviderError, containsSensitiveAssistantInput, PROVIDER_DIAGNOSTICS } from '../server/qwen-adapter.mjs';
import { QWEN_MODEL } from '../server/qwen-config.mjs';

const configuredEnv = {
  QWEN_MODEL,
  QWEN_ENDPOINT: 'https://provider.example.invalid/v1/chat/completions',
  QWEN_API_KEY: 'test-secret-must-not-escape'
};

function diagnosticLogger() {
  const entries = [];
  return { entries, warn(message) { entries.push(message); } };
}

function providerResponse(candidate, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify({ choices: [{ message: { content: JSON.stringify(candidate) } }] });
    }
  };
}

test('adapter sends the complete endpoint, exact model, bounded payload, and server-only authorization', async () => {
  let called;
  const result = await answerWithQwen('How does UDGAM help with old deposits?', {
    env: configuredEnv,
    fetchImpl: async (url, options) => {
      called = { url, options };
      return providerResponse({
        answer: 'UDGAM is a search facility; the respective bank handles a claim.',
        status: 'grounded',
        sourceIds: ['SRC-RBI-UDGAM-FAQ']
      });
    }
  });

  assert.equal(result.provider, 'qwen');
  assert.equal(result.status, 'grounded');
  assert.equal(called.url, configuredEnv.QWEN_ENDPOINT);
  assert.equal(called.options.headers.authorization, `Bearer ${configuredEnv.QWEN_API_KEY}`);
  const payload = JSON.parse(called.options.body);
  assert.equal(payload.model, QWEN_MODEL);
  assert.equal(payload.temperature, 0);
  assert.ok(payload.max_tokens <= 350);
  assert.equal(payload.messages[1].content, 'How does UDGAM help with old deposits?');
  assert.match(payload.messages[0].content, /SRC-RBI-UDGAM-FAQ/);
});

test('successful Hindi response preserves the requested language and approved source references', async () => {
  const result = await answerWithQwen('पुराने बैंक जमा के लिए UDGAM क्या है?', {
    language: 'hi',
    env: configuredEnv,
    fetchImpl: async (_url, options) => {
      const payload = JSON.parse(options.body);
      assert.match(payload.messages[0].content, /language code hi/);
      return providerResponse({
        answer: 'UDGAM खोज की सुविधा है; दावा संबंधित बैंक के साथ किया जाता है।',
        status: 'grounded',
        sourceIds: ['SRC-RBI-UDGAM-FAQ']
      });
    }
  });
  assert.equal(result.provider, 'qwen');
  assert.equal(result.status, 'grounded');
});

test('missing configuration, incompatible model, provider errors, network failures, and timeout use the deterministic fallback', async () => {
  const cases = [
    [{ QWEN_MODEL }, 'provider-not-configured'],
    [{ ...configuredEnv, QWEN_MODEL: 'Qwen/Qwen3-8B:latest' }, 'model-incompatible'],
    [configuredEnv, 'provider-failed'],
    [configuredEnv, 'provider-failed'],
    [configuredEnv, 'provider-failed']
  ];
  const fetchers = [
    undefined,
    undefined,
    async () => providerResponse({}, 503),
    async () => { throw new Error('network contains test-secret-must-not-escape'); },
    () => new Promise(() => {})
  ];
  for (let index = 0; index < cases.length; index += 1) {
    const [env, reason] = cases[index];
    const result = await answerWithQwen('How does UDGAM work?', {
      env,
      fetchImpl: fetchers[index],
      timeoutMs: index === 4 ? 1 : 10
    });
    assert.equal(result.provider, 'deterministic-fallback');
    assert.equal(result.reason, reason);
    assert.doesNotMatch(JSON.stringify(result), /test-secret-must-not-escape/);
  }
  const incompatible = await answerWithQwen('How does UDGAM work?', {
    env: configuredEnv,
    fetchImpl: async () => providerResponse({ error: { message: 'model not available' } }, 422)
  });
  assert.equal(incompatible.provider, 'deterministic-fallback');
  assert.equal(incompatible.reason, 'provider-failed');
});

test('diagnostic classification distinguishes network, timeout, auth, not-found, rate-limit, HTTP, JSON, and schema failures', () => {
  assert.equal(classifyProviderError({ code: 'ENOTFOUND' }), PROVIDER_DIAGNOSTICS.NETWORK_DNS_TLS);
  assert.equal(classifyProviderError({ code: 'CERT_HAS_EXPIRED' }), PROVIDER_DIAGNOSTICS.NETWORK_DNS_TLS);
  assert.equal(classifyProviderError({ code: 'QWEN_TIMEOUT' }), PROVIDER_DIAGNOSTICS.TIMEOUT);
  assert.equal(classifyProviderError(null, { status: 401 }), PROVIDER_DIAGNOSTICS.AUTHENTICATION);
  assert.equal(classifyProviderError(null, { status: 403 }), PROVIDER_DIAGNOSTICS.AUTHENTICATION);
  assert.equal(classifyProviderError(null, { status: 404 }), PROVIDER_DIAGNOSTICS.ENDPOINT_OR_MODEL_NOT_FOUND);
  assert.equal(classifyProviderError(null, { status: 429 }), PROVIDER_DIAGNOSTICS.RATE_LIMIT);
  assert.equal(classifyProviderError(null, { status: 500 }), PROVIDER_DIAGNOSTICS.PROVIDER_HTTP);
  assert.equal(classifyProviderError({ code: 'QWEN_INVALID_JSON' }), PROVIDER_DIAGNOSTICS.INVALID_JSON);
  assert.equal(classifyProviderError({ code: 'QWEN_RESPONSE_SCHEMA' }), PROVIDER_DIAGNOSTICS.INCOMPATIBLE_RESPONSE_SCHEMA);
});

test('HTTP diagnostics are server-side, length-limited, sanitized, and fallback remains safe', async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const logger = diagnosticLogger();
    const result = await answerWithQwen('How does UDGAM work?', {
      env: configuredEnv,
      logger,
      fetchImpl: async () => ({
        ok: false,
        status,
        async text() {
          return JSON.stringify({ error: { message: `provider failure ${configuredEnv.QWEN_API_KEY} ${configuredEnv.QWEN_ENDPOINT} ${'x'.repeat(600)}` } });
        }
      })
    });
    assert.equal(result.provider, 'deterministic-fallback');
    assert.equal(result.reason, 'provider-failed');
    assert.equal(logger.entries.length, 1);
    assert.match(logger.entries[0], /\[qwen\] provider diagnostic category=/);
    assert.doesNotMatch(logger.entries[0], /test-secret-must-not-escape|Bearer|provider\.example\.invalid/);
    assert.ok(logger.entries[0].length < 420);
    assert.doesNotMatch(JSON.stringify(result), /test-secret-must-not-escape|provider\.example\.invalid/);
  }
});

test('invalid JSON, incompatible schema, and network failures log a safe category and fallback', async () => {
  const cases = [
    { response: { ok: true, async text() { return '{invalid'; } }, category: PROVIDER_DIAGNOSTICS.INVALID_JSON },
    { response: { ok: true, async text() { return JSON.stringify({ choices: [] }); } }, category: PROVIDER_DIAGNOSTICS.INCOMPATIBLE_RESPONSE_SCHEMA },
    { error: Object.assign(new Error('getaddrinfo ENOTFOUND provider.example.invalid'), { code: 'ENOTFOUND' }), category: PROVIDER_DIAGNOSTICS.NETWORK_DNS_TLS }
  ];
  for (const item of cases) {
    const logger = diagnosticLogger();
    const result = await answerWithQwen('How does UDGAM work?', {
      env: configuredEnv,
      logger,
      fetchImpl: async () => {
        if (item.error) throw item.error;
        return item.response;
      }
    });
    assert.equal(result.provider, 'deterministic-fallback');
    assert.equal(logger.entries.length, 1);
    assert.match(logger.entries[0], new RegExp(`category=${item.category}`));
  }
});

test('malformed, oversized, unsafe, invented-source, unsupported-claim, and non-JSON outputs fall back', async () => {
  const outputs = [
    { answer: '', status: 'grounded', sourceIds: ['SRC-RBI-UDGAM-FAQ'] },
    { answer: 'The record belongs to you and the claim is approved.', status: 'grounded', sourceIds: ['SRC-RBI-UDGAM-FAQ'] },
    { answer: 'The official source says this is ready.', status: 'grounded', sourceIds: ['SRC-NOT-APPROVED'] },
    { answer: 'A supported preparation answer.', status: 'fallback', sourceIds: ['SRC-RBI-UDGAM-FAQ'] },
    { answer: 'A supported answer that repeats test-secret-must-not-escape.', status: 'grounded', sourceIds: ['SRC-RBI-UDGAM-FAQ'] }
  ];
  for (const candidate of outputs) {
    const result = await answerWithQwen('How does UDGAM work?', {
      env: configuredEnv,
      fetchImpl: async () => providerResponse(candidate)
    });
    assert.equal(result.provider, 'deterministic-fallback');
    assert.equal(result.status, 'fallback');
  }
  const malformed = await answerWithQwen('How does UDGAM work?', {
    env: configuredEnv,
    fetchImpl: async () => ({ ok: true, async text() { return '{not-json'; } })
  });
  assert.equal(malformed.provider, 'deterministic-fallback');
  assert.equal(containsSensitiveAssistantInput('I forgot my bank account number'), true);
});

test('sensitive questions and unsupported topics never call the provider', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return providerResponse({}); };
  const sensitive = await answerWithQwen('Can I send my OTP and bank account number?', { env: configuredEnv, fetchImpl });
  const unsupported = await answerWithQwen('What is the weather today?', { env: configuredEnv, fetchImpl });
  assert.equal(calls, 0);
  assert.equal(sensitive.provider, 'deterministic-fallback');
  assert.equal(sensitive.reason, 'sensitive-input-refused');
  assert.equal(unsupported.reason, 'out-of-corpus');
});
