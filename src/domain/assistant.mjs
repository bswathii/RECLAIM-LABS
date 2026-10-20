import { hasOnlyKnownSources } from './sources.mjs';
import { resolveLanguage, translate } from './i18n.mjs';

const UNSUPPORTED_LANGUAGE = /(guarantee|guaranteed|you are owed|claim approved|officially confirmed|exact amount|deadline date)/i;

function fallbackResponse(answer, sourceIds, reason = 'provider-not-configured', status = 'fallback') {
  return { answer, sourceIds, status, reason, provider: 'deterministic-fallback' };
}

export function answerWithFallback(question, { language = 'en' } = {}) {
  const selectedLanguage = resolveLanguage(language);
  const normalized = String(question || '').trim().toLowerCase();
  if (!normalized) {
    return fallbackResponse(translate('assistant.emptyQuestion', selectedLanguage), []);
  }

  if (normalized.includes('udgam') || normalized.includes('bank deposit') || normalized.includes('bank')) {
    return fallbackResponse(
      translate('assistant.udgamFallback', selectedLanguage),
      ['SRC-RBI-UDGAM-FAQ']
    );
  }

  if (normalized.includes('iepf') || normalized.includes('share') || normalized.includes('dividend') || normalized.includes('heir')) {
    return fallbackResponse(
      translate('assistant.iepfFallback', selectedLanguage),
      ['SRC-IEPFA-HOME', 'SRC-MCA-HOME']
    );
  }

  return fallbackResponse(
    translate('assistant.unsupported', selectedLanguage),
    [],
    'out-of-corpus',
    'refused'
  );
}

export function validateAssistantResponse(response) {
  if (!response || typeof response.answer !== 'string' || !response.answer.trim()) {
    return { ok: false, error: 'missing-answer' };
  }
  if (!['grounded', 'fallback', 'refused'].includes(response.status)) {
    return { ok: false, error: 'invalid-status' };
  }
  if (!Array.isArray(response.sourceIds) || !hasOnlyKnownSources(response.sourceIds)) {
    return { ok: false, error: 'invalid-source-id' };
  }
  if (response.status !== 'refused' && response.sourceIds.length === 0) {
    return { ok: false, error: 'factual-answer-without-source' };
  }
  if (UNSUPPORTED_LANGUAGE.test(response.answer)) {
    return { ok: false, error: 'unsupported-claim-language' };
  }
  return { ok: true };
}
