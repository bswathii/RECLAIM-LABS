import { hasOnlyKnownSources } from './sources.mjs';

const UNSUPPORTED_LANGUAGE = /(guarantee|guaranteed|you are owed|claim approved|officially confirmed|exact amount|deadline date)/i;

function fallbackResponse(answer, sourceIds, reason = 'provider-not-configured', status = 'fallback') {
  return { answer, sourceIds, status, reason, provider: 'deterministic-fallback' };
}

export function answerWithFallback(question, { language = 'en' } = {}) {
  const normalized = String(question || '').trim().toLowerCase();
  if (!normalized) {
    return fallbackResponse('Ask about the IEPF route, UDGAM search preparation, or what Reclaim Labs does not verify.', []);
  }

  if (normalized.includes('udgam') || normalized.includes('bank deposit') || normalized.includes('bank')) {
    if (language === 'hi') {
      return fallbackResponse(
        'RBI के अनुसार UDGAM कई भाग लेने वाले बैंकों में लावारिस जमा या खातों की खोज की सुविधा देता है। दावा UDGAM से नहीं, संबंधित बैंक से किया जाता है।',
        ['SRC-RBI-UDGAM-FAQ']
      );
    }
    return fallbackResponse(
      'RBI describes UDGAM as a search facility for unclaimed deposits/accounts across participating banks. UDGAM does not settle the claim; the claim is made with the respective bank.',
      ['SRC-RBI-UDGAM-FAQ']
    );
  }

  if (normalized.includes('iepf') || normalized.includes('share') || normalized.includes('dividend') || normalized.includes('heir')) {
    if (language === 'hi') {
      return fallbackResponse(
        'IEPF/MCA की वर्तमान प्रक्रिया को आधिकारिक वेबसाइट पर स्वयं जाँचें। Reclaim Labs संभावित अगला कदम समझाता है, पात्रता या आधिकारिक परिणाम की पुष्टि नहीं करता।',
        ['SRC-IEPFA-HOME', 'SRC-MCA-HOME']
      );
    }
    return fallbackResponse(
      'Check the current IEPF Authority and MCA instructions yourself. Reclaim Labs can explain a possible next step, but it cannot confirm eligibility, the existence of shares, or an official outcome.',
      ['SRC-IEPFA-HOME', 'SRC-MCA-HOME']
    );
  }

  return fallbackResponse(
    'I can explain the verified UDGAM search guidance or the IEPF handoff. I cannot determine whether an asset exists, approve a claim, provide an amount, or give legal advice.',
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

export function createQwenAdapter({ endpoint = '', apiKey = '', model = 'Qwen/Qwen3-8B' } = {}) {
  return {
    model,
    configured: Boolean(endpoint && apiKey),
    async answer() {
      throw new Error('Qwen adapter is a server-side boundary and is not connected in this static demo.');
    }
  };
}
