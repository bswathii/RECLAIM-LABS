import { answerWithFallback, validateAssistantResponse } from '../src/domain/assistant.mjs';
import { getSources, SOURCE_BY_ID, SOURCES } from '../src/domain/sources.mjs';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, resolveLanguage, translate } from '../src/domain/i18n.mjs';
import { displayOpportunity } from '../src/domain/opportunity-copy.mjs';
import { appendCaseEvent, setFollowUp, casesForMode } from '../src/domain/case-events.mjs';
import {
  OPPORTUNITY_STATE,
  OPPORTUNITIES,
  getOpportunityById,
  scoreOpportunityRelevance,
  searchOpportunities
} from '../src/domain/opportunities.mjs';
import {
  CASE_STATUS,
  IEPF_CUSTODY,
  assessIepf,
  buildIepfChecklist,
  buildUdgumChecklist,
  buildUdgumPlan,
  canTransitionCaseStatus,
  caseDeduplicationKey,
  getAllowedNextStatuses,
  getCaseProgress
} from '../src/domain/rules.mjs';

const STORAGE_KEY = 'reclaim-labs-demo-v1';
const LOCAL_STORAGE_KEY = 'reclaim-labs-local-v2';
let activeMode = 'real';
const app = document.querySelector('#app');
let toastTimer;

function t(key, values = {}) {
  const localCopy = {
    'common.demoData': ['Your local records', 'आपके स्थानीय रिकॉर्ड'],
    'ui.cases.demo': ['User-reported local data', 'उपयोगकर्ता द्वारा बताया स्थानीय डेटा'],
    'ui.cases.created': ['Preparation case created', 'तैयारी केस बनाया गया'],
    'ui.workflow.trackedBody': ['Saved in this browser only. Not a filing receipt or institutional confirmation.', 'केवल इस ब्राउज़र में सहेजा गया। फाइलिंग रसीद या संस्था की पुष्टि नहीं।'],
    'ui.workflow.createCase': ['Save local preparation case', 'स्थानीय तैयारी केस सहेजें'],
    'workflow.caseCreated': ['Preparation case saved', 'तैयारी केस सहेजा गया'],
    'workflow.caseCount': [`${values.count ?? 0} local case(s)`, `${values.count ?? 0} स्थानीय केस`],
    'ui.settings.description': ['Language, local storage, source guidance, export and deletion controls.', 'भाषा, स्थानीय स्टोरेज, स्रोत मार्गदर्शन, निर्यात और हटाने के नियंत्रण।'],
    'ui.settings.storageDescription': ['Your preparation records stay in this browser, are not cloud-synchronized, and may be lost if browser data is cleared.', 'आपके तैयारी रिकॉर्ड इसी ब्राउज़र में हैं, क्लाउड-सिंक नहीं हैं, और ब्राउज़र डेटा साफ़ होने पर खो सकते हैं।'],
    'ui.settings.storedTitle': ['What is stored locally', 'स्थानीय रूप से क्या सहेजा जाता है'],
    'ui.settings.storedBody': ['Non-sensitive discovery clues, confirmed evidence availability, cases, reviewed items, chosen follow-up dates and local user reports.', 'गैर-संवेदनशील खोज संकेत, प्रमाण उपलब्धता की पुष्टि, केस, देखे गए आइटम, चुनी समीक्षा तिथियाँ और स्थानीय रिपोर्ट।'],
    'ui.settings.notStoredTitle': ['Do not enter sensitive records', 'संवेदनशील रिकॉर्ड दर्ज न करें'],
    'ui.settings.exportTitle': ['Export local records', 'स्थानीय रिकॉर्ड निर्यात करें'],
    'ui.settings.exportBody': ['Download your local preparation state. This is not an official record.', 'अपनी स्थानीय तैयारी स्थिति डाउनलोड करें। यह आधिकारिक रिकॉर्ड नहीं है।'],
    'ui.settings.exportAction': ['Download local JSON', 'स्थानीय JSON डाउनलोड करें'],
    'ui.settings.resetTitle': ['Delete local preparation records', 'स्थानीय तैयारी रिकॉर्ड हटाएँ'],
    'ui.settings.resetBody': ['Deletes only the active local workspace. Isolated demo records and official institutions are unaffected.', 'केवल सक्रिय स्थानीय कार्यक्षेत्र हटाता है। अलग डेमो रिकॉर्ड और आधिकारिक संस्थाओं पर असर नहीं पड़ता।'],
    'ui.settings.resetAction': ['Delete local records', 'स्थानीय रिकॉर्ड हटाएँ'],
    'reset.action': ['Clear local workspace', 'स्थानीय कार्यक्षेत्र साफ़ करें']
  };
  if (activeMode === 'real' && localCopy[key]) return state.language === 'hi' ? localCopy[key][1] : localCopy[key][0];
  return translate(key, { language: state.language, ...values });
}

function bilingual(english, hindi) {
  return state.language === 'hi' ? hindi : english;
}

function switchMode() {
  persist();
  activeMode = activeMode === 'demo' ? 'real' : 'demo';
  Object.assign(state, loadState());
  render();
}

function modeNotice() {
  return activeMode === 'demo'
    ? 'DEMO DATA — NOT A REAL FINANCIAL MATCH'
    : bilingual('Real catalogue · Your own local preparation records · No individual database search', 'वास्तविक कैटलॉग · आपके स्थानीय तैयारी रिकॉर्ड · व्यक्तिगत डेटाबेस खोज नहीं');
}

function statusLabel(status) {
  return translate(`statuses.${status}`, state.language);
}

function statusAction(status, language = (typeof state === 'undefined' ? DEFAULT_LANGUAGE : state.language)) {
  const key = {
    [CASE_STATUS.PREPARING]: 'statuses.preparingAction',
    [CASE_STATUS.ACTION_REPORTED]: 'statuses.actionReportedAction',
    [CASE_STATUS.SUBMISSION_REPORTED]: 'statuses.submissionReportedAction',
    [CASE_STATUS.USER_REPORTED_RESOLVED]: 'statuses.userReportedResolvedAction',
    [CASE_STATUS.INSTITUTION_CONFIRMED]: 'workflow.noInstitutionConfirmation'
  }[status] || 'workflow.noOutcome';
  return translate(key, language);
}

const state = loadState();
if (typeof location !== 'undefined') {
  const destination = location.hash.slice(1);
  if (['home', 'discover', 'cases', 'assistant', 'settings'].includes(destination)) {
    state.view = destination;
    if (destination === 'discover') state.wizardSuspended = true;
  }
}

function defaultState() {
  return {
    view: 'home',
    language: DEFAULT_LANGUAGE,
    wizard: null,
    wizardSuspended: false,
    discovery: {
      query: '',
      category: '',
      institution: '',
      product: '',
      clues: '',
      evidenceKind: '',
      evidenceConfirmed: false,
      conflictingEvidence: false,
      verification: '',
      selectedId: '',
      results: searchOpportunities('').map((item) => item.id)
    },
    cases: [],
    study: null,
    studyResults: [],
    assistantAnswer: null,
    toast: '',
    storageWarning: false,
    mode: activeMode
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(activeMode === 'demo' ? STORAGE_KEY : LOCAL_STORAGE_KEY) || 'null');
    if (!saved) return { ...defaultState(), demoMode: activeMode === 'demo' };
    const legacyViewMap = { tracker: 'cases', sources: 'settings', privacy: 'settings', workflow: 'discover' };
    const savedView = legacyViewMap[saved.view] || saved.view;
    return {
      ...defaultState(),
      ...saved,
      view: ['home', 'discover', 'cases', 'assistant', 'settings'].includes(savedView) ? savedView : 'home',
      language: resolveLanguage(saved.language),
      discovery: {
        ...defaultState().discovery,
        ...(saved.discovery || {}),
        results: Array.isArray(saved.discovery?.results) ? saved.discovery.results : defaultState().discovery.results
      },
      mode: activeMode,
      demoMode: activeMode === 'demo',
      cases: Array.isArray(saved.cases)
        ? casesForMode(saved.cases, activeMode).map((item) => normalizeCase(item, saved.language))
        : []
    };
  } catch {
    return { ...defaultState(), demoMode: activeMode === 'demo', storageWarning: true };
  }
}

function persist() {
  const snapshot = { ...state, mode: activeMode, demoMode: activeMode === 'demo', toast: '' };
  try {
    localStorage.setItem(activeMode === 'demo' ? STORAGE_KEY : LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    state.storageWarning = false;
    return true;
  } catch {
    state.storageWarning = true;
    state.toast = t('errors.saveFailed');
    return false;
  }
}

function resetDemo() {
  const prompt = activeMode === 'demo' ? t('reset.confirm') : bilingual('Delete all your local cases and unfinished answers in this browser? The isolated demo is not affected.', 'इस ब्राउज़र के आपके स्थानीय केस और अधूरे उत्तर हटाएँ? अलग डेमो पर असर नहीं होगा।');
  if (!window.confirm(prompt)) {
    showToast(t('reset.cancelled'));
    render();
    return;
  }
  try {
    localStorage.removeItem(activeMode === 'demo' ? STORAGE_KEY : LOCAL_STORAGE_KEY);
  } catch {
    state.storageWarning = true;
    showToast(t('reset.failed'));
    render();
    return;
  }
  Object.assign(state, defaultState(), { demoMode: activeMode === 'demo' });
  showToast(activeMode === 'demo' ? t('reset.completed') : bilingual('Local records cleared.', 'स्थानीय रिकॉर्ड हटा दिए गए।'));
  render();
}

function normalizeCase(record, language = DEFAULT_LANGUAGE) {
  const checklist = Array.isArray(record?.checklist)
    ? record.checklist.map((item) => ({ ...item, reviewed: item.reviewed === true || item.checked === true }))
    : [];
  const legacyStatus = {
    'official-search': CASE_STATUS.ACTION_REPORTED,
    'waiting-on-institution': CASE_STATUS.SUBMISSION_REPORTED
  };
  const candidateStatus = legacyStatus[record?.status] || record?.status;
  const status = [CASE_STATUS.PREPARING, CASE_STATUS.ACTION_REPORTED, CASE_STATUS.SUBMISSION_REPORTED, CASE_STATUS.USER_REPORTED_RESOLVED].includes(candidateStatus) ? candidateStatus : CASE_STATUS.PREPARING;
  return {
    ...record,
    status,
    checklist,
      nextAction: statusAction(status, resolveLanguage(language))
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  try {
    return new Intl.DateTimeFormat(state.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return 'Not recorded';
  }
}

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  try {
    return new Intl.DateTimeFormat(state.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return 'Not recorded';
  }
}

function showToast(message) {
  state.toast = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    state.toast = '';
    render();
  }, 4200);
}

function sourceChips(sourceIds = []) {
  return getSources(sourceIds).map((source) => (
    `<a class="source-chip" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(source.status === 'verified' ? t('ui.source.verified') : source.status === 'access-blocked' ? t('ui.source.accessBlocked') : t('ui.source.official'))}">${escapeHtml(sourceChipLabel(source))}</a>`
  )).join('');
}

function sourceChipLabel(source) {
  const labels = {
    'SRC-RBI-UDGAM-FAQ': 'source.rbiUdgumFaq',
    'SRC-RBI-DEA-FAQ': 'source.rbiDeaFaq',
    'SRC-RBI-UDGAM-PORTAL': 'source.udgamPortal',
    'SRC-IEPFA-HOME': 'source.iepfAuthority',
    'SRC-MCA-HOME': 'source.mca',
    'SRC-NSDL-IEPF-GUIDE': 'source.nsdlGuide',
    'SRC-DFS-UNCLAIMED-GATEWAY': 'source.dfsGateway'
  };
  return labels[source.id] ? t(`ui.${labels[source.id]}`) : source.institution;
}

function sourceStatusPill(source) {
  const warning = source.status !== 'verified';
  const label = source.status === 'verified' ? t('ui.source.verified') : source.status === 'access-blocked' ? t('ui.source.accessBlocked') : t('ui.source.official');
  return `<span class="pill ${warning ? 'warning' : ''}">${escapeHtml(label)}</span>`;
}

const ROUTE_COPY_KEYS = Object.freeze({
  'iepf-form-5': { title: 'iepf.routeIepf', shortTitle: 'iepf.routeIepfShort', nextAction: 'iepf.routeIepfNextAction', rationale: 'iepf.routeIepfRationale' },
  'company-rta': { title: 'iepf.routeCompany', shortTitle: 'iepf.routeCompanyShort', nextAction: 'iepf.routeCompanyNextAction', rationale: 'iepf.routeCompanyRationale' },
  'verify-custody': { title: 'iepf.routeVerify', shortTitle: 'iepf.routeVerifyShort', nextAction: 'iepf.routeVerifyNextAction', rationale: 'iepf.routeVerifyRationale' },
  'udgam-search': { title: 'udgam.preparation', shortTitle: 'udgam.shortTitle', nextAction: 'udgam.nextAction', rationale: 'udgam.description' }
});

function localizedRoute(routeId, field) {
  const key = ROUTE_COPY_KEYS[routeId]?.[field];
  return key ? t(key) : routeId;
}

function caseOpportunity(record) {
  return record?.opportunityId ? getOpportunityById(record.opportunityId) : null;
}

function caseTitle(record) {
  const opportunity = caseOpportunity(record);
  return opportunity ? displayOpportunity(opportunity, state.language).title : localizedRoute(record.routeId, 'title');
}

function caseNextAction(record, progress = null) {
  const opportunity = caseOpportunity(record);
  if (record?.status === CASE_STATUS.PREPARING && opportunity) return t('ui.opportunity.nextActionBody');
  if (record?.status === CASE_STATUS.PREPARING) return localizedRoute(record.routeId, 'nextAction');
  return statusAction(record.status);
}

function localizedMissing(item, workflow) {
  const keyMap = workflow === 'udgam'
    ? {
        'Account-holder name': ['ui.workflow.udgamMissingHolder', 'ui.workflow.udgamMissingHolderReason'],
        'Bank name': ['ui.workflow.udgamMissingBank', 'ui.workflow.udgamMissingBankReason'],
        'Additional identifier or address': ['ui.workflow.udgamMissingIdentifier', 'ui.workflow.udgamMissingIdentifierReason']
      }
    : {
        'Where the holding is recorded': ['ui.workflow.missingCustody', 'ui.workflow.missingCustodyReason'],
        'Death-related evidence availability': ['ui.workflow.missingDeathEvidence', 'ui.workflow.missingDeathEvidenceReason'],
        'Heir authority evidence availability': ['ui.workflow.missingHeirAuthority', 'ui.workflow.missingHeirAuthorityReason'],
        'Company or RTA name': ['ui.workflow.missingIssuer', 'ui.workflow.missingIssuerReason']
      };
  const keys = keyMap[item.label];
  return keys ? { label: t(keys[0]), reason: t(keys[1]) } : item;
}

function localizedChecklistItem(item, context = {}) {
  if (item.id?.startsWith('opportunity-') && context.opportunity) {
    const opportunity = displayOpportunity(context.opportunity, state.language);
    const prompt = opportunity.eligibilityEvidencePrompts.find((entry) => `opportunity-${entry.id}` === item.id);
    if (prompt) return { ...item, title: prompt.label, detail: `${prompt.question} ${prompt.evidenceHint}`, label: bilingual('Preparation prompt — not a verified document requirement', 'तैयारी का संकेत — सत्यापित आवश्यक दस्तावेज़ नहीं') };
  }
  const assessment = context.assessment || context.plan || {};
  const titleKeys = {
    'confirm-route': 'iepf.checklistRoute',
    'heir-evidence': 'iepf.checklistHeirEvidence',
    'issuer-reference': assessment.companyName ? 'iepf.checklistIssuer' : 'iepf.checklistFindIssuer',
    'official-handoff': 'iepf.checklistOfficial',
    'udgam-holder-name': 'udgam.checklistHolderName',
    'udgam-bank': 'udgam.checklistBank',
    'udgam-extra': 'udgam.checklistAdditional',
    'udgam-handoff': 'udgam.checklistOfficial'
  };
  const detailKeys = {
    'confirm-route': assessment.routeId === 'company-rta' ? 'iepf.checklistCompanyDetail' : 'iepf.checklistRouteDetail',
    'heir-evidence': 'iepf.checklistHeirDetail',
    'issuer-reference': assessment.companyName ? 'iepf.checklistIssuerDetail' : 'iepf.checklistFindIssuerDetail',
    'official-handoff': 'iepf.checklistOfficialDetail',
    'udgam-holder-name': 'udgam.checklistHolderDetail',
    'udgam-bank': 'udgam.checklistBankDetail',
    'udgam-extra': 'udgam.checklistAdditionalDetail',
    'udgam-handoff': 'udgam.checklistOfficialDetail'
  };
  const labelKey = item.id.startsWith('udgam-') ? 'common.officialProcedure' : item.id === 'official-handoff' ? 'workflow.officialHandoff' : item.id === 'heir-evidence' || item.id === 'issuer-reference' ? 'ui.common.userReportedNotVerified' : 'common.officialProcedure';
  return {
    ...item,
    title: titleKeys[item.id] ? t(titleKeys[item.id]) : item.title,
    detail: detailKeys[item.id] ? t(detailKeys[item.id], { companyName: assessment.companyName || '' }) : item.detail,
    label: t(labelKey)
  };
}

function navButton(view, label) {
  const current = state.view === view ? ' aria-current="page"' : '';
  return `<button type="button" data-action="navigate" data-view="${view}"${current}>${escapeHtml(label)}</button>`;
}

function languageSelector(id = '') {
  return `<label class="language-control"><span class="sr-only">${escapeHtml(t('accessibility.languageSelector'))}</span><select ${id ? `id="${escapeHtml(id)}"` : ''} data-action="language" aria-label="${escapeHtml(t('accessibility.languageSelector'))}">${SUPPORTED_LANGUAGES.map((language) => `<option value="${language.code}" ${state.language === language.code ? 'selected' : ''}>${escapeHtml(language.nativeName)}</option>`).join('')}</select></label>`;
}

function render() {
  document.documentElement.lang = state.language;
  if (typeof history !== 'undefined' && typeof location !== 'undefined' && location.hash !== `#${state.view}`) history.replaceState(null, '', `#${state.view}`);
  const body = state.view === 'home'
    ? renderHome()
    : state.view === 'discover'
      ? renderDiscover()
      : state.view === 'cases'
        ? renderCases()
        : state.view === 'assistant'
          ? renderAssistant()
          : renderSettings();

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="topbar-inner">
          <button class="brand" type="button" data-action="navigate" data-view="home" aria-label="Reclaim Labs home">
            <span class="brand-mark" aria-hidden="true">R</span>
            <span>${escapeHtml(t('common.appName'))}<small>${escapeHtml(t('common.tagline'))}</small></span>
          </button>
          <nav class="nav" aria-label="${escapeHtml(t('navigation.primary'))}">
            ${navButton('home', t('navigation.home'))}
            ${navButton('discover', t('navigation.discover'))}
            ${navButton('cases', t('navigation.cases') + (state.cases.length ? ` (${state.cases.length})` : ''))}
            ${navButton('assistant', t('navigation.assistant'))}
            ${navButton('settings', t('navigation.settings'))}
          </nav>
          ${languageSelector()}
        </div>
      </header>
      <div class="demo-banner">
        <div class="topbar-inner demo-banner-inner">
          <span><strong>${escapeHtml(modeNotice())}</strong></span>
          <button type="button" data-action="switch-mode">${escapeHtml(activeMode === 'demo' ? bilingual('Use real catalogue', 'वास्तविक कैटलॉग खोलें') : bilingual('Try isolated demo', 'अलग डेमो आज़माएँ'))}</button>
          <button type="button" data-action="reset-demo">${escapeHtml(t('reset.action'))}</button>
        </div>
      </div>
      ${state.storageWarning ? `<div class="storage-warning" role="alert"><div class="topbar-inner">${escapeHtml(t('errors.saveFailed'))} ${escapeHtml(t('ui.settings.storageDescription'))}</div></div>` : ''}
      <main class="page" id="main-content" tabindex="-1">${body}</main>
      <nav class="bottom-nav" aria-label="${escapeHtml(t('navigation.primary'))}">
        ${navButton('home', t('navigation.home'))}
        ${navButton('discover', t('navigation.discover'))}
        ${navButton('cases', t('navigation.cases'))}
        ${navButton('assistant', t('navigation.assistant'))}
        ${navButton('settings', t('navigation.settings'))}
      </nav>
      <footer class="footer">
        <div class="footer-inner">
          <span>${escapeHtml(t('trust.guidanceLayer'))}</span>
          <span>${escapeHtml(t('workflow.caseCount', { count: state.cases.length }))} · ${escapeHtml(bilingual('Source check dates are shown per record', 'हर रिकॉर्ड की स्रोत जाँच तिथि दिखाई गई है'))}</span>
        </div>
      </footer>
      ${state.toast ? `<div class="toast" role="status">${escapeHtml(state.toast)}</div>` : ''}
    </div>
  `;
}

function renderHome() {
  return `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(t('ui.home.eyebrow'))}</p>
        <h1 id="hero-title">${escapeHtml(t('ui.home.title'))}</h1>
        <p>${escapeHtml(t('ui.home.description'))}</p>
        <div class="hero-actions">
          <button class="button" type="button" data-action="navigate" data-view="discover">${escapeHtml(t('navigation.discover'))}</button>
          <button class="button secondary" type="button" data-action="navigate" data-view="cases">${escapeHtml(t('navigation.cases'))}</button>
        </div>
      </div>
      <aside class="hero-note" aria-label="Trust boundary">
        <div>
          <p class="eyebrow" style="color:#d9b46c">${escapeHtml(t('ui.home.trustTitle'))}</p>
          <h2>${escapeHtml(t('ui.home.trustHeading'))}</h2>
          <p>${escapeHtml(t('ui.home.trustBody'))}</p>
        </div>
        <ul>
          <li>${escapeHtml(t('ui.common.noAmount'))}</li>
          <li>${escapeHtml(t('ui.common.noCredentials'))}</li>
          <li>${escapeHtml(t('ui.common.noMiddleman'))}</li>
        </ul>
      </aside>
    </section>

    <section class="trust-strip" aria-label="Product principles">
      <div class="trust-item"><span class="trust-icon">1</span><span><strong>${escapeHtml(t('ui.source.verified'))}</strong><span>${escapeHtml(t('workflow.userReportedInput'))}</span></span></div>
      <div class="trust-item"><span class="trust-icon">2</span><span><strong>${escapeHtml(t('workflow.assess'))}</strong><span>${escapeHtml(t('ui.home.assessBody'))}</span></span></div>
      <div class="trust-item"><span class="trust-icon">3</span><span><strong>${escapeHtml(t('ui.home.prepare'))}</strong><span>${escapeHtml(t('ui.home.prepareBody'))}</span></span></div>
    </section>

    <div class="section-heading"><div><p class="eyebrow">${escapeHtml(t('ui.home.categoriesEyebrow'))}</p><h2>${escapeHtml(t('ui.home.categoriesTitle'))}</h2></div><p>${escapeHtml(t('ui.home.categoriesDescription'))}</p></div>
    ${renderCategoryCards()}

    ${renderHomeCaseSummary()}

    <section class="panel" style="margin-top:1.2rem" aria-labelledby="how-title">
      <div class="section-heading" style="margin-top:0">
        <div><p class="eyebrow">${escapeHtml(t('ui.home.return'))}</p><h2 id="how-title">${escapeHtml(t('ui.home.returnTitle'))}</h2></div>
        <p>${escapeHtml(t('ui.home.returnBody'))}</p>
      </div>
      <div class="trust-strip" style="margin:0">
        <div class="trust-item"><span class="trust-icon">01</span><span><strong>${escapeHtml(t('ui.home.assess'))}</strong><span>${escapeHtml(t('ui.home.assessBody'))}</span></span></div>
        <div class="trust-item"><span class="trust-icon">02</span><span><strong>${escapeHtml(t('ui.home.prepare'))}</strong><span>${escapeHtml(t('ui.home.prepareBody'))}</span></span></div>
        <div class="trust-item"><span class="trust-icon">03</span><span><strong>${escapeHtml(t('ui.home.return'))}</strong><span>${escapeHtml(t('ui.home.returnBodyShort'))}</span></span></div>
      </div>
    </section>
  `;
}

function renderCategoryCards() {
  return `<section class="category-grid" aria-label="${escapeHtml(t('ui.home.categoriesTitle'))}">
    <article class="card category-card">
      <div class="card-top"><span class="category-mark" aria-hidden="true">₹↗</span><span class="pill">IEPF</span></div>
      <div><h3>${escapeHtml(t('ui.home.iepfCardTitle'))}</h3><p>${escapeHtml(t('ui.home.iepfCardBody'))}</p></div>
        <div class="pill-row"><span class="pill muted">${escapeHtml(t('ui.home.possibleOnly'))}</span><span class="pill muted">${escapeHtml(t('ui.home.noAmount'))}</span></div>
      <div class="button-row"><button class="button" type="button" data-action="start-workflow" data-workflow="iepf">${escapeHtml(t('iepf.start'))}</button></div>
    </article>
    <article class="card category-card udgam">
      <div class="card-top"><span class="category-mark" aria-hidden="true">⌕</span><span class="pill">RBI · UDGAM</span></div>
      <div><h3>${escapeHtml(t('ui.home.udgamCardTitle'))}</h3><p>${escapeHtml(t('ui.home.udgamCardBody'))}</p></div>
      <div class="pill-row"><span class="pill muted">${escapeHtml(t('ui.home.searchPreparation'))}</span><span class="pill muted">${escapeHtml(t('ui.home.claimStaysWithBank'))}</span></div>
      <div class="button-row"><button class="button" type="button" data-action="start-workflow" data-workflow="udgam">${escapeHtml(t('udgam.start'))}</button></div>
    </article>
  </section>`;
}

function renderHomeCaseSummary() {
  if (!state.cases.length) return '';
  return `<section class="panel home-cases" aria-labelledby="home-cases-title">
    <div class="section-heading" style="margin-top:0"><div><p class="eyebrow">${escapeHtml(t('ui.cases.eyebrow'))}</p><h2 id="home-cases-title">${escapeHtml(t('ui.cases.title'))}</h2></div><button class="button secondary small" type="button" data-action="navigate" data-view="cases">${escapeHtml(t('navigation.cases'))}</button></div>
    <div class="home-case-list">${state.cases.slice(0, 3).map((record) => {
      const progress = getCaseProgress(record);
      const nextAction = caseNextAction(record, progress);
      return `<article class="home-case"><div><strong>${escapeHtml(caseTitle(record))}</strong><span>${escapeHtml(statusLabel(record.status))}</span></div><div><strong>${escapeHtml(t('ui.cases.nextAction'))}</strong><span>${escapeHtml(nextAction)}</span>${record.followUpDate ? `<span>${escapeHtml(bilingual('Your review date', 'आपकी समीक्षा तिथि'))}: ${escapeHtml(record.followUpDate)}</span>` : ''}</div><button class="button ghost small" type="button" data-action="navigate" data-view="cases">${escapeHtml(t('ui.cases.title'))}</button></article>`;
    }).join('')}</div>
  </section>`;
}

function renderDiscover() {
  if (state.wizard && !state.wizardSuspended) return renderWorkflow();
  return `<section aria-labelledby="discover-title">
    <div class="section-heading"><div><p class="eyebrow">${escapeHtml(t('ui.discover.eyebrow'))}</p><h1 id="discover-title">${escapeHtml(t('ui.discover.title'))}</h1></div><p>${escapeHtml(t('ui.discover.description'))}</p></div>
    <div class="info-box"><p>${escapeHtml(t('ui.discover.privacy'))}</p><p class="microcopy">${escapeHtml(t('ui.discover.catalogueNotice'))}</p></div>
    ${renderOpportunityDiscovery()}
    <div class="section-heading" style="margin-top:2rem"><div><p class="eyebrow">${escapeHtml(t('ui.discover.guidedEyebrow'))}</p><h2>${escapeHtml(t('ui.discover.guidedTitle'))}</h2></div><p>${escapeHtml(t('ui.discover.guidedDescription'))}</p></div>
    <div style="margin-top:1rem">${renderCategoryCards()}</div>
  </section>`;
}

function opportunityStatusLabel(opportunity) {
  if (opportunity.status === 'official-destination') return t('ui.opportunity.officialDestination');
  if (opportunity.status === 'verified-guidance') return t('ui.opportunity.verifiedGuidance');
  if (opportunity.status === 'verified') return t('ui.opportunity.verifiedRoute');
  return t('ui.opportunity.guidedJourney');
}

function opportunityCategoryLabel(category) {
  if (category === 'unclaimed-bank-deposits') return t('ui.opportunity.bankCategory');
  if (category === 'unclaimed-shares-dividends') return t('ui.opportunity.sharesCategory');
  return t('ui.opportunity.assetsCategory');
}

function opportunityAccessLabel(record) {
  return record.accessClass === 'D'
    ? bilingual('D · User-assisted official portal search', 'D · आधिकारिक पोर्टल पर उपयोगकर्ता की खोज')
    : record.accessClass === 'C' ? bilingual('C · Curated official public information', 'C · संकलित आधिकारिक सार्वजनिक जानकारी') : bilingual('E · Not sufficiently verified', 'E · पर्याप्त सत्यापन नहीं');
}

function opportunityStateLabel(result) {
  if (result.state === OPPORTUNITY_STATE.NO_MATCH_IN_SOURCES_CHECKED) return bilingual('No match in this catalogue — official databases not searched', 'इस कैटलॉग में मिलान नहीं — आधिकारिक डेटाबेस नहीं खोजे गए');
  const labels = {
    [OPPORTUNITY_STATE.RELEVANT]: 'ui.opportunity.relevant',
    [OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH]: 'ui.opportunity.potentialMatch',
    [OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION]: 'ui.opportunity.insufficient',
    [OPPORTUNITY_STATE.NO_MATCH_IN_SOURCES_CHECKED]: 'ui.opportunity.noMatchChecked'
  };
  return t(labels[result.state] || 'ui.opportunity.relevant');
}

function opportunityEvidenceInput() {
  const discovery = state.discovery || {};
  return {
    institution: discovery.institution,
    product: discovery.product,
    clues: discovery.clues,
    confirmed: discovery.evidenceConfirmed === true,
    personalEvidence: {
      confirmed: discovery.evidenceConfirmed === true,
      kind: discovery.evidenceKind,
      institutionMatches: discovery.evidenceConfirmed === true,
      productMatches: discovery.evidenceConfirmed === true
    },
    conflictingEvidence: discovery.conflictingEvidence === true
  };
}

function renderOpportunityDiscovery() {
  const discovery = state.discovery || defaultState().discovery;
  const selected = discovery.selectedId ? getOpportunityById(discovery.selectedId) : null;
  if (selected?.publicationStatus === 'published') return renderOpportunityDetails(selected);
  const results = (discovery.results || []).map((id) => getOpportunityById(id)).filter((item) => item?.publicationStatus === 'published' && (!discovery.verification || item.status === discovery.verification));
  return `<section class="opportunity-discovery panel" aria-labelledby="catalogue-title">
    <div class="panel-header"><div><p class="eyebrow">${escapeHtml(t('ui.opportunity.eyebrow'))}</p><h2 id="catalogue-title">${escapeHtml(t('ui.opportunity.title'))}</h2><p>${escapeHtml(t('ui.opportunity.description'))}</p></div><span class="pill">${escapeHtml(t('ui.opportunity.catalogueBadge'))}</span></div>
    <form data-form="opportunity-search" class="form-grid">
      <div class="field"><label for="opportunity-query">${escapeHtml(t('ui.opportunity.searchLabel'))}</label><input id="opportunity-query" name="query" value="${escapeHtml(discovery.query)}" placeholder="${escapeHtml(t('ui.opportunity.searchPlaceholder'))}" autocomplete="off" /></div>
      <div class="field"><label for="opportunity-category">${escapeHtml(t('ui.opportunity.categoryLabel'))}</label><select id="opportunity-category" name="category"><option value="">${escapeHtml(t('ui.opportunity.allCategories'))}</option><option value="unclaimed-shares-dividends" ${discovery.category === 'unclaimed-shares-dividends' ? 'selected' : ''}>${escapeHtml(t('ui.opportunity.sharesCategory'))}</option><option value="unclaimed-bank-deposits" ${discovery.category === 'unclaimed-bank-deposits' ? 'selected' : ''}>${escapeHtml(t('ui.opportunity.bankCategory'))}</option><option value="unclaimed-assets" ${discovery.category === 'unclaimed-assets' ? 'selected' : ''}>${escapeHtml(t('ui.opportunity.assetsCategory'))}</option></select></div>
      <div class="field"><label for="opportunity-institution">${escapeHtml(t('ui.opportunity.institutionLabel'))}</label><input id="opportunity-institution" name="institution" value="${escapeHtml(discovery.institution)}" placeholder="${escapeHtml(t('ui.opportunity.institutionPlaceholder'))}" autocomplete="off" /></div>
      <div class="field"><label for="opportunity-product">${escapeHtml(t('ui.opportunity.productLabel'))}</label><input id="opportunity-product" name="product" value="${escapeHtml(discovery.product)}" placeholder="${escapeHtml(t('ui.opportunity.productPlaceholder'))}" autocomplete="off" /></div>
      <div class="field full"><label for="opportunity-clues">${escapeHtml(t('ui.opportunity.cluesLabel'))}</label><input id="opportunity-clues" name="clues" value="${escapeHtml(discovery.clues)}" placeholder="${escapeHtml(t('ui.opportunity.cluesPlaceholder'))}" autocomplete="off" /><small>${escapeHtml(t('ui.opportunity.cluesHint'))}</small></div>
      <div class="field"><label for="catalogue-verification">${escapeHtml(bilingual('Verification status', 'सत्यापन स्थिति'))}</label><select id="catalogue-verification" name="verification">${[['', bilingual('All published routes', 'सभी प्रकाशित मार्ग')], ['verified', t('ui.opportunity.verifiedRoute')], ['verified-guidance', t('ui.opportunity.verifiedGuidance')]].map(([value, label]) => `<option value="${value}" ${discovery.verification === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></div>
      <div class="field"><label for="evidence-kind">${escapeHtml(bilingual('Personal evidence available (do not upload)', 'व्यक्तिगत संकेत उपलब्ध (अपलोड न करें)'))}</label><select id="evidence-kind" name="evidenceKind">${[['', bilingual('No evidence yet', 'अभी प्रमाण नहीं')], ['old-statement', bilingual('Old statement', 'पुराना विवरण')], ['share-certificate', bilingual('Share certificate', 'शेयर प्रमाणपत्र')], ['bank-correspondence', bilingual('Bank correspondence', 'बैंक का पत्र')], ['official-search-result', bilingual('My official search result', 'मेरा आधिकारिक खोज परिणाम')]].map(([value, label]) => `<option value="${value}" ${discovery.evidenceKind === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></div>
      <label class="choice"><input type="checkbox" name="evidenceConfirmed" ${discovery.evidenceConfirmed ? 'checked' : ''}><span>${escapeHtml(bilingual('I checked the record myself: the institution and product relate to me or the family member I am helping. This is my report, not official verification.', 'मैंने रिकॉर्ड स्वयं देखा: संस्था और उत्पाद मेरे या जिस परिवार सदस्य की मदद कर रहा/रही हूँ उनसे जुड़े हैं। यह मेरी रिपोर्ट है, आधिकारिक पुष्टि नहीं।'))}</span></label>
      <label class="choice"><input type="checkbox" name="conflictingEvidence" ${discovery.conflictingEvidence ? 'checked' : ''}><span>${escapeHtml(bilingual('Some evidence conflicts or I am unsure it relates to this person.', 'कुछ संकेत परस्पर विरोधी हैं या व्यक्ति से संबंध निश्चित नहीं है।'))}</span></label>
      <div class="button-row full"><button class="button" type="submit">${escapeHtml(t('ui.opportunity.searchAction'))}</button><button class="button secondary" type="button" data-action="clear-opportunity-search">${escapeHtml(t('ui.opportunity.clearAction'))}</button></div>
    </form>
    <div class="opportunity-results" style="margin-top:1rem">${results.length ? results.map((opportunity) => renderOpportunityCard(opportunity, scoreOpportunityRelevance(opportunity, opportunityEvidenceInput()))).join('') : `<div class="empty-state"><h3>${escapeHtml(t('ui.opportunity.noResults'))}</h3><p>${escapeHtml(t('ui.opportunity.noResultsBody'))}</p></div>`}</div>
  </section>`;
}

function renderOpportunityCard(opportunity, relevance) {
  opportunity = displayOpportunity(opportunity, state.language);
  return `<article class="opportunity-card card" aria-labelledby="opportunity-${escapeHtml(opportunity.id)}">
    <div class="card-top"><span class="pill">${escapeHtml(opportunityCategoryLabel(opportunity.category))}</span><span class="pill ${relevance.state === OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH ? 'warning' : ''}">${escapeHtml(opportunityStateLabel(relevance))}</span></div>
    <h3 id="opportunity-${escapeHtml(opportunity.id)}">${escapeHtml(opportunity.title)}</h3>
    <p>${escapeHtml(opportunity.description)}</p>
    <p class="microcopy"><strong>${escapeHtml(t('ui.opportunity.whyRelevant'))}:</strong> ${escapeHtml(relevance.matchedFields.length ? relevance.evidence.join(', ') : t('ui.opportunity.catalogueRelevance'))}</p>
    <div class="pill-row"><span class="pill muted">${escapeHtml(opportunityStatusLabel(opportunity))}</span><span class="pill muted">${escapeHtml(t('ui.opportunity.checkedOn'))} ${escapeHtml(opportunity.verifiedOn)}</span></div>
    <div class="button-row" style="margin-top:.8rem"><button class="button small" type="button" data-action="view-opportunity" data-opportunity-id="${escapeHtml(opportunity.id)}">${escapeHtml(t('ui.opportunity.viewDetails'))}</button></div>
  </article>`;
}

function renderOpportunityDetails(opportunity) {
  const relevance = scoreOpportunityRelevance(opportunity, opportunityEvidenceInput());
  opportunity = displayOpportunity(opportunity, state.language);
  const explanation = relevance.reasonCodes.includes('conflicting-evidence')
    ? bilingual('Your evidence conflicts. Resolve which person, product and institution the record concerns before relying on this route.', 'आपके संकेतों में विरोध है। इस मार्ग पर भरोसा करने से पहले व्यक्ति, उत्पाद और संस्था का संबंध स्पष्ट करें।')
    : relevance.state === OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH
      ? bilingual('You explicitly reported checking personal evidence. We have not read the document or verified the result. This remains a lead for an official search.', 'आपने व्यक्तिगत संकेत स्वयं देखने की स्पष्ट सूचना दी। हमने दस्तावेज़ नहीं पढ़ा और परिणाम सत्यापित नहीं किया। यह आधिकारिक खोज के लिए केवल एक संकेत है।')
      : bilingual('Institution and product words only establish topical relevance. A selected bank or company is not ownership evidence.', 'संस्था और उत्पाद के शब्द केवल विषय संबंधी प्रासंगिकता बताते हैं। चुनी गई बैंक या कंपनी स्वामित्व का प्रमाण नहीं है।');
  return `<section class="panel opportunity-details" aria-labelledby="opportunity-detail-title">
    <div class="panel-header"><div><button class="button ghost small" type="button" data-action="back-opportunities">← ${escapeHtml(t('ui.opportunity.backToResults'))}</button><p class="eyebrow">${escapeHtml(t('ui.opportunity.detailEyebrow'))}</p><h2 id="opportunity-detail-title">${escapeHtml(opportunity.title)}</h2><p>${escapeHtml(opportunity.description)}</p></div><span class="status-chip ${relevance.state === OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH ? 'warning' : ''}">${escapeHtml(opportunityStateLabel(relevance))}</span></div>
    <div class="assessment-grid"><div class="assessment-card"><p class="eyebrow">${escapeHtml(t('ui.opportunity.whatItIs'))}</p><p>${escapeHtml(opportunity.description)}</p><p><strong>${escapeHtml(t('ui.opportunity.institutionLabel'))}:</strong> ${escapeHtml(opportunity.institution)}</p><p><strong>${escapeHtml(t('ui.opportunity.accessMode'))}:</strong> ${escapeHtml(opportunityAccessLabel(opportunity))}</p></div><div class="assessment-card"><p class="eyebrow">${escapeHtml(t('ui.opportunity.whyRecommended'))}</p><p>${escapeHtml(relevance.matchedFields.length ? relevance.evidence.join(', ') : t('ui.opportunity.catalogueReason'))}</p><p>${escapeHtml(explanation)}</p><p class="microcopy">${escapeHtml(t('ui.opportunity.personalMatchBoundary'))}</p></div></div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none"><h3>${escapeHtml(t('ui.opportunity.eligibilityTitle'))}</h3><ul>${opportunity.eligibilityEvidencePrompts.map((prompt) => `<li><strong>${escapeHtml(prompt.label)}:</strong> ${escapeHtml(prompt.question)}<br><span class="microcopy">${escapeHtml(prompt.evidenceHint)}</span></li>`).join('')}</ul></div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none"><h3>${escapeHtml(t('ui.opportunity.provenanceTitle'))}</h3><p><strong>${escapeHtml(t('ui.opportunity.checkedOn'))}:</strong> ${escapeHtml(opportunity.verifiedOn)} · <strong>${escapeHtml(t('ui.opportunity.dataDate'))}:</strong> ${escapeHtml(opportunity.recordDate || t('common.notRecorded'))}</p><p>${escapeHtml(opportunity.provenance.basis)}</p><div class="pill-row">${sourceChips(opportunity.sourceIds)}</div><ul>${opportunity.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none"><h3>${escapeHtml(t('ui.opportunity.nextActionTitle'))}</h3><p>${escapeHtml(t('ui.opportunity.nextActionBody'))}</p><div class="button-row"><a class="button" href="${escapeHtml(opportunity.officialUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t('ui.opportunity.openOfficial'))}</a><button class="button secondary" type="button" data-action="save-opportunity-case" data-opportunity-id="${escapeHtml(opportunity.id)}">${escapeHtml(t('ui.opportunity.saveCase'))}</button>${opportunity.category !== 'unclaimed-assets' ? `<button class="button secondary" type="button" data-action="start-workflow" data-workflow="${opportunity.category === 'unclaimed-bank-deposits' ? 'udgam' : 'iepf'}">${escapeHtml(t('ui.discover.openJourney'))}</button>` : ''}</div></div>
    ${state.study ? renderStudyCompletion(opportunity.id) : ''}
  </section>`;
}

function renderStudyCompletion(opportunityId) {
  return `<form class="panel" style="margin-top:1rem" data-form="study-result" data-opportunity-id="${escapeHtml(opportunityId)}"><h3>${escapeHtml(bilingual('Discovery test — your assessment', 'खोज परीक्षण — आपका आकलन'))}</h3><p>${escapeHtml(bilingual('This measures your experience, not an asset match or a population success rate.', 'यह आपके अनुभव को मापता है, संपत्ति मिलान या सभी उपयोगकर्ताओं की सफलता दर नहीं।'))}</p><label class="choice"><input type="checkbox" name="relevant"><span>${escapeHtml(bilingual('I found a route relevant to my situation.', 'मुझे अपनी स्थिति से जुड़ा मार्ग मिला।'))}</span></label><label class="choice"><input type="checkbox" name="understood"><span>${escapeHtml(bilingual('I can explain the next official action and what remains unverified.', 'मैं अगला आधिकारिक कदम और क्या असत्यापित है समझा सकता/सकती हूँ।'))}</span></label><button class="button" type="submit">${escapeHtml(bilingual('Finish timed test', 'समय परीक्षण समाप्त करें'))}</button></form>`;
}

function renderStudySettings() {
  const results = state.studyResults || [];
  const reportCounts = ['evidence-collected', 'portal-opened', 'submission-reported', 'response-reported', 'recovery-reported'].map((type) => `<li>${escapeHtml(eventLabel(type))}: ${state.cases.filter((record) => (record.events || []).some((event) => event.type === type)).length}</li>`).join('');
  return `<article class="panel"><h2>${escapeHtml(bilingual('Measure discovery before monetization', 'कमाई से पहले खोज को मापें'))}</h2><p>${escapeHtml(bilingual('Optional local timed test. Start, find a route, and report whether it is relevant and understandable. No analytics is sent to a server. Compare with an official-portal-only task using the manual test plan.', 'वैकल्पिक स्थानीय समय परीक्षण। शुरू करें, मार्ग खोजें और बताएँ कि वह प्रासंगिक और समझने योग्य है या नहीं। सर्वर पर विश्लेषण नहीं भेजा जाता। मैनुअल परीक्षण योजना से केवल आधिकारिक पोर्टल वाले कार्य से तुलना करें।'))}</p><button class="button secondary" type="button" data-action="start-study">${escapeHtml(bilingual('Start timed discovery task', 'समयबद्ध खोज शुरू करें'))}</button><ul>${results.map((result) => `<li>${Math.round(result.elapsedMs / 1000)} ${escapeHtml(bilingual('seconds', 'सेकंड'))} · ${escapeHtml(bilingual('Relevant / understood next action', 'प्रासंगिक / अगला कदम समझा'))}: ${result.relevant ? '✓' : '—'} / ${result.understood ? '✓' : '—'} · ${escapeHtml(result.at.slice(0, 10))}</li>`).join('')}</ul><ul>${reportCounts}</ul><p class="microcopy">${escapeHtml(bilingual('Counts are local cases, not users. No user-study improvement has been demonstrated yet. Local observations are not independently verified outcomes. Recovery amounts are not inferred.', 'संख्याएँ स्थानीय केस हैं, उपयोगकर्ता नहीं। अभी उपयोगकर्ता अध्ययन में सुधार सिद्ध नहीं हुआ। स्थानीय अवलोकन स्वतंत्र रूप से सत्यापित परिणाम नहीं हैं। वापसी राशि का अनुमान नहीं लगाया जाता।'))}</p></article>`;
}

function renderStepper(active, labels) {
  return `<div class="stepper" aria-label="Journey progress">
    ${labels.map((label, index) => {
      const step = index + 1;
      const status = step === active ? 'active' : step < active ? 'done' : '';
      return `<div class="step ${status}"><span class="step-number">${step < active ? '✓' : step}</span><span>${escapeHtml(label)}</span></div>`;
    }).join('')}
  </div>`;
}

function choice(name, value, current, title, detail) {
  return `<label class="choice">
    <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${current === value ? 'checked' : ''} required />
    <span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></span>
  </label>`;
}

function yesNoChoice(name, current, title, detail) {
  return `<fieldset class="fieldset">
    <legend>${escapeHtml(title)}</legend>
    <p class="field-hint">${escapeHtml(detail)}</p>
    <div class="choice-grid">
      ${choice(name, 'yes', current, t('common.yes'), t('ui.workflow.yesDetail'))}
      ${choice(name, 'no', current, t('iepf.unknown'), t('ui.workflow.noDetail'))}
    </div>
  </fieldset>`;
}

function renderWorkflow() {
  if (!state.wizard) {
    return `<section class="empty-state"><h1>${escapeHtml(t('ui.discover.noJourney'))}</h1><p>${escapeHtml(t('ui.discover.noJourneyBody'))}</p><button class="button" type="button" data-action="navigate" data-view="discover">${escapeHtml(t('ui.discover.backToDiscover'))}</button></section>`;
  }
  return state.wizard.workflow === 'iepf' ? renderIepfWizard() : renderUdgumWizard();
}

function renderIepfWizard() {
  const wizard = state.wizard;
  const inputs = wizard.inputs;
  const assessment = wizard.assessment || assessIepf(inputs);
  const checklist = wizard.checklist || [];
  const active = Math.min(wizard.step, 5);

  let content = '';
  if (active === 1) {
    content = `
      <form data-form="wizard" class="panel" aria-labelledby="iepf-step-1">
        <div class="panel-header"><div><p class="eyebrow">${escapeHtml(t('ui.workflow.iepfStep', { step: 1 }))}</p><h2 id="iepf-step-1">${escapeHtml(t('ui.workflow.contextHeading'))}</h2><p>${escapeHtml(t('ui.workflow.contextBody'))}</p></div><span class="pill warning">${escapeHtml(t('ui.common.userReportedNotVerified'))}</span></div>
        <fieldset class="fieldset">
          <legend>${escapeHtml(t('ui.workflow.claimantLegend'))}</legend>
          <div class="choice-grid">
            ${choice('claimantType', 'heir', inputs.claimantType, t('iepf.heir'), t('ui.workflow.heirDetail'))}
            ${choice('claimantType', 'holder', inputs.claimantType, t('iepf.holder'), t('ui.workflow.holderDetail'))}
          </div>
        </fieldset>
        <div class="info-box" style="margin-top:1rem"><p><strong>${escapeHtml(t('common.trustBoundary'))}:</strong> ${escapeHtml(t('iepf.noCredentials'))} ${escapeHtml(t('iepf.noDocuments'))}</p></div>
        <div class="button-row" style="margin-top:1.2rem"><button class="button" type="submit">${escapeHtml(t('ui.workflow.continueRoute'))}</button><button class="button secondary" type="button" data-action="navigate" data-view="discover">${escapeHtml(t('common.cancel'))}</button></div>
      </form>`;
  } else if (active === 2) {
    content = `
      <form data-form="wizard" class="panel" aria-labelledby="iepf-step-2">
        <div class="panel-header"><div><p class="eyebrow">${escapeHtml(t('ui.workflow.iepfStep', { step: 2 }))}</p><h2 id="iepf-step-2">${escapeHtml(t('ui.workflow.routeHeading'))}</h2><p>${escapeHtml(t('ui.workflow.routeBody'))}</p></div><span class="pill warning">${escapeHtml(t('ui.common.userReportedNotVerified'))}</span></div>
        <div class="form-grid">
          <div class="field full">
            <fieldset class="fieldset"><legend>${escapeHtml(t('ui.workflow.custodyLegend'))}</legend>
              <div class="choice-grid">
                ${choice('custody', IEPF_CUSTODY.IEPF, inputs.custody, t('iepf.iepf'), t('ui.workflow.custodyIepfDetail'))}
                ${choice('custody', IEPF_CUSTODY.COMPANY_SUSPENSE, inputs.custody, t('iepf.companySuspense'), t('ui.workflow.custodyCompanyDetail'))}
                ${choice('custody', IEPF_CUSTODY.UNKNOWN, inputs.custody, t('iepf.unknown'), t('ui.workflow.custodyUnknownDetail'))}
              </div>
            </fieldset>
          </div>
          <div class="field">
            <label for="company-name">${escapeHtml(t('iepf.companyName'))} (${escapeHtml(t('common.optional'))})</label>
            <input id="company-name" name="companyName" maxlength="120" value="${escapeHtml(inputs.companyName)}" placeholder="${escapeHtml(t('iepf.companyNameHint'))}" autocomplete="off" />
            <small>${escapeHtml(t('iepf.companyNameHint'))}. ${escapeHtml(t('workflow.userReportedInput'))}</small>
          </div>
          ${inputs.claimantType === 'heir' ? `<div class="field"><div class="info-box"><p><strong>${escapeHtml(t('iepf.heir'))}:</strong> ${escapeHtml(t('ui.workflow.heirContext'))}</p></div></div>` : ''}
          ${inputs.claimantType === 'heir' ? `<div class="field full">${yesNoChoice('deathCertificate', inputs.deathCertificate, t('ui.workflow.deathEvidenceTitle'), t('ui.workflow.evidenceHint'))}</div>` : ''}
          ${inputs.claimantType === 'heir' ? `<div class="field full">${yesNoChoice('heirAuthority', inputs.heirAuthority, t('ui.workflow.heirAuthorityTitle'), t('ui.workflow.authorityHint'))}</div>` : ''}
        </div>
        <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">${escapeHtml(t('common.back'))}</button><button class="button" type="submit">${escapeHtml(t('common.review'))}</button></div>
      </form>`;
  } else if (active === 3) {
    content = renderAssessmentStep(assessment);
  } else if (active === 4) {
    content = renderIepfChecklistStep(assessment, checklist);
  } else {
    content = renderCreatedStep(wizard.caseId, 'IEPF');
  }

  return `<section aria-labelledby="workflow-title">
    <div class="wizard-header">
      <p class="eyebrow">Guided recovery preparation</p>
      <h1 id="workflow-title">${escapeHtml(t('iepf.title'))}</h1>
      ${renderStepper(active, [t('ui.workflow.context'), t('ui.workflow.routeQuestions'), t('ui.workflow.assessmentStep'), t('ui.workflow.prepareStep'), t('ui.workflow.tracked')])}
    </div>
    ${content}
  </section>`;
}

function renderAssessmentStep(assessment) {
  const missing = assessment.missingInformation || [];
  return `<section class="panel" aria-labelledby="assessment-title">
    <div class="panel-header"><div><p class="eyebrow">${escapeHtml(t('ui.workflow.iepfStep', { step: 3 }))}</p><h2 id="assessment-title">${escapeHtml(t('ui.workflow.assessmentHeading'))}</h2><p>${escapeHtml(t('ui.workflow.assessmentBody'))}</p></div><span class="status-chip warning">${escapeHtml(assessment.confidence === 'suggested-route' ? t('ui.common.possibleRouteOnly') : t('ui.common.userReportedNotVerified'))}</span></div>
    <div class="assessment-grid">
      <div class="assessment-card">
        <p class="eyebrow">${escapeHtml(t('ui.workflow.whatYouTold'))}</p>
        <ul>
          <li><strong>${escapeHtml(t('iepf.claimantType'))}:</strong> ${escapeHtml(assessment.claimantType === 'heir' ? t('iepf.heir') : t('iepf.holder'))}</li>
          <li><strong>${escapeHtml(t('iepf.custody'))}:</strong> ${escapeHtml(assessment.custody === IEPF_CUSTODY.IEPF ? t('iepf.iepf') : assessment.custody === IEPF_CUSTODY.COMPANY_SUSPENSE ? t('iepf.companySuspense') : t('iepf.unknown'))}</li>
          <li><strong>${escapeHtml(t('iepf.companyName'))}:</strong> ${escapeHtml(assessment.companyName || t('common.notRecorded'))}</li>
        </ul>
      </div>
      <div class="assessment-card">
        <p class="eyebrow">${escapeHtml(t('ui.workflow.whatSuggests'))}</p>
        <h3>${escapeHtml(localizedRoute(assessment.routeId, 'title'))}</h3>
        <p>${escapeHtml(localizedRoute(assessment.routeId, 'rationale'))}</p>
        <div class="pill-row" style="margin-top:0.8rem"><span class="pill">${escapeHtml(t('ui.common.userReportedNotVerified'))}</span><span class="pill">${escapeHtml(t('workflow.noOutcome'))}</span></div>
      </div>
      <div class="assessment-card">
        <p class="eyebrow">${escapeHtml(t('ui.workflow.notChecked'))}</p>
        ${missing.length ? `<ul>${missing.map((item) => { const localized = localizedMissing(item, 'iepf'); return `<li><strong>${escapeHtml(localized.label)}:</strong> ${escapeHtml(localized.reason)}</li>`; }).join('')}</ul>` : `<p>${escapeHtml(t('workflow.confidenceNote'))}</p>`}
        <p class="microcopy" style="margin-top:0.8rem">${escapeHtml(t('ui.workflow.ruleUsed'))}: ${escapeHtml(assessment.routeRule)}.</p>
      </div>
      <div class="assessment-card">
        <p class="eyebrow">${escapeHtml(t('ui.workflow.doNext'))}</p>
        <h3>${escapeHtml(localizedRoute(assessment.routeId, 'title'))}</h3>
        <div class="info-box"><p><strong>${escapeHtml(t('workflow.nextAction'))}:</strong> ${escapeHtml(localizedRoute(assessment.routeId, 'nextAction'))}</p></div>
      </div>
    </div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none">
      <div class="panel-header"><div><h3>${escapeHtml(t('ui.workflow.officialDestinations'))}</h3><p>${escapeHtml(t('ui.workflow.officialDestinationsBody'))}</p></div><div class="pill-row">${sourceChips(assessment.sourceIds)}</div></div>
      ${renderOfficialLinks(assessment.routeId)}
    </div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">${escapeHtml(t('common.back'))}</button><button class="button" type="button" data-action="wizard-next">${escapeHtml(t('ui.workflow.buildChecklist'))}</button></div>
  </section>`;
}

function renderOfficialLinks(routeId) {
  const iepf = SOURCE_BY_ID['SRC-IEPFA-HOME'];
  const mca = SOURCE_BY_ID['SRC-MCA-HOME'];
  if (routeId === 'company-rta') {
    return `<div class="info-box warning"><p>${escapeHtml(t('iepf.routeCompanyNextAction'))}</p><p class="microcopy">${escapeHtml(t('iepf.companyNameHint'))}. ${escapeHtml(t('workflow.userReportedInput'))}</p></div>`;
  }
  const links = [iepf, mca];
  return `<div class="button-row">${links.map((source) => `<a class="button secondary small" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(t('navigation.openExternal'))}: ${escapeHtml(source.institution)}">${escapeHtml(t('common.open'))} ${escapeHtml(source.institution)}</a>`).join('')}</div>`;
}

function renderIepfChecklistStep(assessment, checklist) {
  return `<section class="panel" aria-labelledby="checklist-title">
    <div class="panel-header"><div><p class="eyebrow">${escapeHtml(t('ui.workflow.iepfStep', { step: 4 }))}</p><h2 id="checklist-title">${escapeHtml(t('ui.workflow.prepareHeading'))}</h2><p>${escapeHtml(t('ui.workflow.prepareBody'))}</p></div><span class="status-chip warning">${escapeHtml(t('ui.common.acknowledgmentOnly'))}</span></div>
    <div class="info-box warning"><p><strong>${escapeHtml(t('common.trustBoundary'))}:</strong> ${escapeHtml(t('ui.workflow.currentSourceCaution'))}</p></div>
    <div class="checklist" style="margin-top:1rem">${checklist.map((item, index) => renderChecklistItem(item, index, '', { assessment })).join('')}</div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none"><div class="panel-header"><div><h3>${escapeHtml(t('ui.workflow.openNext'))}</h3><p>${escapeHtml(localizedRoute(assessment.routeId, 'nextAction'))}</p></div><div class="pill-row">${sourceChips(assessment.sourceIds)}</div></div>${renderOfficialLinks(assessment.routeId)}</div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">${escapeHtml(t('common.back'))}</button><button class="button" type="button" data-action="create-case">${escapeHtml(t('ui.workflow.createCase'))}</button></div>
  </section>`;
}

function renderChecklistItem(item, index, caseId = '', context = {}) {
  const checkboxAction = caseId ? 'case-check' : 'wizard-check';
  const identifier = caseId ? `data-case-id="${escapeHtml(caseId)}"` : '';
  const reviewed = item.reviewed === true || item.checked === true;
  const displayItem = localizedChecklistItem(item, context);
  return `<label class="checklist-item ${reviewed ? 'checked' : ''}">
    <input type="checkbox" data-action="${checkboxAction}" data-item-index="${index}" ${identifier} ${reviewed ? 'checked' : ''} aria-label="${escapeHtml(reviewed ? t('workflow.markNotReviewed') : t('workflow.markReviewed'))}" />
    <span><h3>${escapeHtml(displayItem.title)}</h3><p>${escapeHtml(displayItem.detail)}</p><span class="pill-row">${displayItem.sourceIds?.length ? sourceChips(displayItem.sourceIds) : ''}<span class="pill muted">${escapeHtml(displayItem.label)}</span></span></span>
    <span class="microcopy">${escapeHtml(reviewed ? t('ui.workflow.acknowledged') : t('ui.workflow.notYetReviewed'))}</span>
  </label>`;
}

function renderUdgumWizard() {
  const wizard = state.wizard;
  const inputs = wizard.inputs;
  const plan = wizard.plan || buildUdgumPlan(inputs);
  const checklist = wizard.checklist || [];
  const active = Math.min(wizard.step, 3);
  let content = '';

  if (active === 1) {
    content = `<form data-form="wizard" class="panel" aria-labelledby="udgam-step-1">
      <div class="panel-header"><div><p class="eyebrow">${escapeHtml(t('ui.workflow.udgamStep', { step: 1 }))}</p><h2 id="udgam-step-1">${escapeHtml(t('ui.workflow.searchHeading'))}</h2><p>${escapeHtml(t('ui.workflow.searchBody'))}</p></div><span class="pill">${escapeHtml(t('ui.workflow.verifiedRbi'))}</span></div>
      <div class="form-grid">
        <div class="field full">${yesNoChoice('hasHolderName', inputs.hasHolderName, t('ui.workflow.accountNameQuestion'), t('ui.workflow.accountNameHint'))}</div>
        <div class="field full">${yesNoChoice('hasBank', inputs.hasBank, t('ui.workflow.bankQuestion'), t('ui.workflow.bankHint'))}</div>
        <div class="field full">${yesNoChoice('hasAdditionalIdentifier', inputs.hasAdditionalIdentifier, t('ui.workflow.identifierQuestion'), t('ui.workflow.identifierHint'))}</div>
      </div>
      <div class="info-box" style="margin-top:1rem"><p><strong>${escapeHtml(t('common.trustBoundary'))}:</strong> ${escapeHtml(t('udgam.notClaim'))} ${escapeHtml(t('udgam.noValues'))}</p><div class="pill-row" style="margin-top:0.55rem">${sourceChips(['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-DEA-FAQ'])}</div></div>
      <div class="button-row" style="margin-top:1.2rem"><button class="button" type="submit">${escapeHtml(t('ui.workflow.reviewSearch'))}</button><button class="button secondary" type="button" data-action="navigate" data-view="discover">${escapeHtml(t('common.cancel'))}</button></div>
    </form>`;
  } else if (active === 2) {
    content = renderUdgumPlanStep(plan, checklist);
  } else {
    content = renderCreatedStep(wizard.caseId, 'UDGAM');
  }

  return `<section aria-labelledby="workflow-title"><div class="wizard-header"><p class="eyebrow">${escapeHtml(t('udgam.preparation'))}</p><h1 id="workflow-title">${escapeHtml(t('udgam.title'))}</h1>${renderStepper(active, [t('ui.workflow.searchInputs'), t('ui.workflow.preparation'), t('ui.workflow.tracked')])}</div>${content}</section>`;
}

function renderUdgumPlanStep(plan, checklist) {
  const missing = plan.missingInformation || [];
  return `<section class="panel" aria-labelledby="udgam-plan-title">
    <div class="panel-header"><div><p class="eyebrow">${escapeHtml(t('ui.workflow.udgamStep', { step: 2 }))}</p><h2 id="udgam-plan-title">${escapeHtml(t('ui.workflow.searchPlanHeading'))}</h2><p>${escapeHtml(t('ui.workflow.searchPlanBody'))}</p></div><span class="status-chip ${plan.confidence === 'ready-to-search' ? 'blue' : 'warning'}">${escapeHtml(plan.confidence === 'ready-to-search' ? t('ui.common.claimNotConfirmed') : t('ui.common.userReportedNotVerified'))}</span></div>
    ${missing.length ? `<div class="info-box warning"><p><strong>${escapeHtml(t('ui.workflow.stillArrange'))}:</strong></p><ul>${missing.map((item) => { const localized = localizedMissing(item, 'udgam'); return `<li><strong>${escapeHtml(localized.label)}:</strong> ${escapeHtml(localized.reason)}</li>`; }).join('')}</ul></div>` : `<div class="info-box"><p><strong>${escapeHtml(t('ui.workflow.readyPrepare'))}</strong></p></div>`}
    <div class="checklist" style="margin-top:1rem">${checklist.map((item, index) => renderChecklistItem(item, index, '', { plan })).join('')}</div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none"><div class="panel-header"><div><h3>${escapeHtml(t('ui.workflow.openNext'))}</h3><p>${escapeHtml(localizedRoute('udgam-search', 'nextAction'))}</p></div><div class="pill-row">${sourceChips(plan.sourceIds)}</div></div><div class="button-row"><a class="button" href="${escapeHtml(SOURCE_BY_ID['SRC-RBI-UDGAM-PORTAL'].url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(t('navigation.openExternal'))}: UDGAM">${escapeHtml(t('ui.workflow.openUdgum'))}</a></div></div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">${escapeHtml(t('common.back'))}</button><button class="button" type="button" data-action="create-case">${escapeHtml(t('ui.workflow.createCase'))}</button></div>
  </section>`;
}

function renderCreatedStep(caseId, label) {
  const record = state.cases.find((item) => item.id === caseId);
  return `<section class="panel" aria-labelledby="created-title">
    <div class="panel-header"><div><p class="eyebrow">${escapeHtml(label)} · ${escapeHtml(t('ui.cases.demo'))}</p><h2 id="created-title">${escapeHtml(t('ui.workflow.trackedHeading'))}</h2><p>${escapeHtml(t('ui.workflow.trackedBody'))}</p></div><span class="status-chip">${escapeHtml(t('workflow.caseCreated'))}</span></div>
    <div class="assessment-grid"><div class="assessment-card"><p class="eyebrow">${escapeHtml(t('workflow.nextAction'))}</p><h3>${escapeHtml(record ? localizedRoute(record.routeId, 'nextAction') : t('ui.cases.nextAction'))}</h3><p>${escapeHtml(t('workflow.userReportedInput'))}</p></div><div class="assessment-card"><p class="eyebrow">${escapeHtml(t('ui.workflow.notChecked'))}</p><ul><li>${escapeHtml(t('ui.workflow.notApproved'))}</li><li>${escapeHtml(t('ui.workflow.notProof'))}</li><li>${escapeHtml(t('ui.workflow.notOfficialStatus'))}</li></ul></div></div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button" type="button" data-action="navigate" data-view="cases">${escapeHtml(t('workflow.viewCase'))}</button><button class="button secondary" type="button" data-action="navigate" data-view="discover">${escapeHtml(t('ui.workflow.exploreAnother'))}</button></div>
  </section>`;
}

function renderCases() {
  return `<section aria-labelledby="cases-title">
    <div class="section-heading"><div><p class="eyebrow">${escapeHtml(t('ui.cases.eyebrow'))}</p><h1 id="cases-title">${escapeHtml(t('ui.cases.title'))}</h1></div><button class="button small" type="button" data-action="start-workflow" data-workflow="iepf">${escapeHtml(t('ui.cases.newIepf'))}</button></div>
    <div class="info-box"><p><strong>${escapeHtml(t('ui.cases.itemsReviewed'))}:</strong> ${escapeHtml(t('workflow.confidenceNote'))} ${escapeHtml(t('workflow.noOutcome'))}</p></div>
    ${state.cases.length ? `<div class="case-list" style="margin-top:1rem">${state.cases.map(renderCaseCard).join('')}</div>` : `<div class="empty-state" style="margin-top:1rem"><h2>${escapeHtml(t('ui.cases.noCases'))}</h2><p>${escapeHtml(t('ui.cases.noCasesBody'))}</p><div class="button-row" style="justify-content:center"><button class="button" type="button" data-action="start-workflow" data-workflow="iepf">${escapeHtml(t('ui.cases.startIepf'))}</button><button class="button secondary" type="button" data-action="start-workflow" data-workflow="udgam">${escapeHtml(t('ui.cases.startUdgum'))}</button></div></div>`}
  </section>`;
}

function renderCaseCard(record) {
  const progress = getCaseProgress(record);
  const workflowLabel = record.workflow === 'iepf' ? t('iepf.title') : t('udgam.title');
  const nextStatuses = getAllowedNextStatuses(record.status);
  return `<article class="case-card" aria-labelledby="case-${escapeHtml(record.id)}">
    <div class="case-card-header"><div><p class="eyebrow">${escapeHtml(workflowLabel)} · ${escapeHtml(t('ui.cases.demo'))}</p><h3 id="case-${escapeHtml(record.id)}">${escapeHtml(caseTitle(record))}</h3><p>${escapeHtml(t('ui.cases.created'))}: ${escapeHtml(formatDate(record.createdAt))} · ${escapeHtml(record.claimantType === 'heir' ? t('ui.cases.familyHeir') : record.claimantType === 'holder' ? t('ui.cases.namedHolder') : t('ui.cases.searchPrep'))}</p></div><span class="status-chip ${record.status === CASE_STATUS.USER_REPORTED_RESOLVED ? 'warning' : ''}">${escapeHtml(statusLabel(record.status))}</span></div>
    <div class="case-meta"><div class="metric"><strong>${escapeHtml(t('ui.cases.stepsReviewed', { reviewed: progress.itemsReviewed, total: progress.total }))}</strong><span>${escapeHtml(t('ui.cases.itemsReviewed'))}</span></div><div class="metric"><strong>${progress.percentage}%</strong><span>${escapeHtml(t('ui.cases.itemsReviewed'))}</span></div><div class="metric"><strong>${escapeHtml(formatDate(record.updatedAt || record.createdAt))}</strong><span>${escapeHtml(t('ui.cases.localUpdated'))}</span></div></div>
    <div class="progress-track" aria-label="${escapeHtml(translate('accessibility.progress', { language: state.language, percentage: progress.percentage }))}"><div class="progress-bar" style="width:${progress.percentage}%"></div></div>
    <div class="info-box" style="margin-top:1rem"><p><strong>${escapeHtml(t('ui.cases.nextAction'))}:</strong> ${escapeHtml(caseNextAction(record, progress))}</p></div>
    <div class="checklist" style="margin-top:1rem">${(record.checklist || []).map((item, index) => renderChecklistItem(item, index, record.id, { assessment: record.assessment, opportunity: caseOpportunity(record) })).join('')}</div>
    ${renderCaseFollowThrough(record)}
    <div class="timeline" aria-label="${escapeHtml(t('ui.cases.timeline'))}">${(record.timeline || []).map((item, index) => `<div class="timeline-item"><strong>${escapeHtml(item.type ? eventLabel(item.type) : index === 0 ? t('ui.cases.created') : statusLabel(item.status))}</strong><span>${escapeHtml(formatDateTime(item.at))} · ${escapeHtml(t('workflow.userReportedInput'))}</span></div>`).join('')}</div>
    <div class="button-row" style="margin-top:1rem">
      ${nextStatuses.map((status) => `<button class="button ${status === CASE_STATUS.SUBMISSION_REPORTED || status === CASE_STATUS.PREPARING ? 'secondary' : ''} small" type="button" data-action="update-case-status" data-case-id="${escapeHtml(record.id)}" data-to-status="${escapeHtml(status)}">${escapeHtml(status === CASE_STATUS.ACTION_REPORTED ? t('ui.cases.reportAction') : status === CASE_STATUS.SUBMISSION_REPORTED ? t('ui.cases.reportSubmission') : status === CASE_STATUS.PREPARING ? t('ui.cases.returnToPreparation') : t('ui.cases.markResolved'))}</button>`).join('')}
      ${record.status === CASE_STATUS.USER_REPORTED_RESOLVED ? `<span class="microcopy">${escapeHtml(t('ui.cases.resolvedNote'))}</span>` : ''}
    </div>
  </article>`;
}

function eventLabel(type) {
  const labels = {
    'evidence-collected': ['Evidence collected — reported by you', 'प्रमाण व्यवस्थित — आपके द्वारा बताया गया'],
    'portal-opened': ['Official link clicked — page load not verified', 'आधिकारिक लिंक क्लिक — पृष्ठ खुलना सत्यापित नहीं'],
    'submission-reported': ['Submission reported by you', 'जमा करना आपके द्वारा बताया गया'],
    'response-reported': ['Institution response reported by you', 'संस्था का उत्तर आपके द्वारा बताया गया'],
    'recovery-reported': ['Recovery reported by you — not independently verified', 'वापसी आपके द्वारा बताई गई — स्वतंत्र सत्यापन नहीं']
  };
  return labels[type] ? bilingual(...labels[type]) : type;
}

function renderCaseFollowThrough(record) {
  const opportunity = caseOpportunity(record);
  const url = opportunity?.officialUrl || record.officialUrl;
  return `<div class="panel" style="margin-top:1rem;box-shadow:none">
    <h3>${escapeHtml(bilingual('Your follow-through record', 'आपके अगले कदम का रिकॉर्ड'))}</h3>
    <p class="microcopy">${escapeHtml(bilingual('These are separate reports, not official status or proof of recovery. Opening a link never reports a submission.', 'ये अलग रिपोर्ट हैं, आधिकारिक स्थिति या वापसी का प्रमाण नहीं। लिंक खोलना जमा करने की रिपोर्ट नहीं है।'))}</p>
    <div class="button-row">${url ? `<a class="button secondary small" href="${escapeHtml(url)}" target="_blank" rel="noreferrer" data-action="record-portal" data-case-id="${escapeHtml(record.id)}">${escapeHtml(t('ui.opportunity.openOfficial'))}</a>` : ''}${['evidence-collected', 'submission-reported', 'response-reported', 'recovery-reported'].map((type) => `<button type="button" class="button secondary small" data-action="case-event" data-event-type="${type}" data-case-id="${escapeHtml(record.id)}">${escapeHtml(eventLabel(type))}</button>`).join('')}</div>
    <ul>${(record.events || []).map((event) => `<li>${escapeHtml(eventLabel(event.type))} · ${escapeHtml(formatDateTime(event.at))}</li>`).join('')}</ul>
    <form data-form="case-followup" data-case-id="${escapeHtml(record.id)}" class="form-grid">
      <div class="field"><label for="followup-${escapeHtml(record.id)}">${escapeHtml(bilingual('Your chosen next-review date (in-app only)', 'आपकी चुनी अगली समीक्षा तिथि (केवल ऐप में)'))}</label><input type="date" id="followup-${escapeHtml(record.id)}" name="followUpDate" value="${escapeHtml(record.followUpDate || '')}"><small>${escapeHtml(bilingual('Not a statutory deadline. No email, push, or automatic monitoring.', 'यह कानूनी अंतिम तिथि नहीं। ईमेल, पुश या स्वतः निगरानी नहीं।'))}</small></div>
      <div class="field"><label for="family-${escapeHtml(record.id)}">${escapeHtml(bilingual('Family organizer label — no names', 'परिवार व्यवस्था लेबल — नाम नहीं'))}</label><select name="familyRole" id="family-${escapeHtml(record.id)}">${[['self', bilingual('Self', 'स्वयं')], ['parent', bilingual('Parent', 'माता/पिता')], ['grandparent', bilingual('Grandparent', 'दादा/दादी/नाना/नानी')], ['family', bilingual('Family member', 'परिवार सदस्य')]].map(([value, label]) => `<option value="${value}" ${(record.familyRole || 'self') === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></div>
      <button class="button small" type="submit">${escapeHtml(t('common.save'))}</button>
    </form>
  </div>`;
}

function renderSourceDirectory() {
  return `<section aria-labelledby="sources-title"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(t('ui.settings.sourcesTitle'))}</p><h2 id="sources-title">${escapeHtml(t('ui.settings.sourcesTitle'))}</h2></div><p>${escapeHtml(t('ui.settings.sourcesDescription'))}</p></div>
    <div class="source-list">${SOURCES.map((source) => `<article class="source-card"><div class="source-card-header"><div><p class="eyebrow">${escapeHtml(source.institution)}</p><h3>${escapeHtml(source.title)}</h3></div>${sourceStatusPill(source)}</div><p>${escapeHtml(t('ui.settings.sourceId'))}: <strong>${escapeHtml(source.id)}</strong> · ${escapeHtml(t('ui.settings.checked'))} ${escapeHtml(formatDate(source.accessedOn))}</p><a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(t('navigation.openExternal'))}: ${escapeHtml(source.title)}">${escapeHtml(source.url)} <span class="sr-only">(${escapeHtml(t('navigation.externalLink'))})</span></a><details><summary>${escapeHtml(t('ui.settings.supports'))}</summary><ul>${source.supports.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>${source.openQuestions.length ? `<p class="microcopy" style="margin-top:0.6rem"><strong>${escapeHtml(t('ui.settings.openQuestions'))}:</strong> ${escapeHtml(source.openQuestions.join(' '))}</p>` : ''}</details></article>`).join('')}</div>
  </section>`;
}

function renderAssistant() {
  const answer = state.assistantAnswer;
  return `<section aria-labelledby="assistant-title">
    <div class="section-heading"><div><p class="eyebrow">${escapeHtml(t('assistant.fallbackLabel'))}</p><h1 id="assistant-title">${escapeHtml(t('assistant.title'))}</h1></div><p>${escapeHtml(t('assistant.fallbackNotice'))} ${escapeHtml(t('assistant.intro'))}</p></div>
    <div class="assistant-card">
      <div class="panel-header"><div><h2>${escapeHtml(t('assistant.title'))}</h2><p>${escapeHtml(t('assistant.supportedTopics'))}</p></div><span class="status-chip blue">${escapeHtml(t('assistant.deterministic'))}</span></div>
      <form data-form="assistant" class="form-grid">
        <div class="field full"><label for="assistant-question">${escapeHtml(t('assistant.questionLabel'))}</label><textarea id="assistant-question" name="question" rows="3" maxlength="500" placeholder="${escapeHtml(t('assistant.questionPlaceholder'))}"></textarea></div>
        <div class="field" style="justify-content:end"><span class="field-hint">${escapeHtml(t('assistant.languageLabel'))}: ${escapeHtml(SUPPORTED_LANGUAGES.find((language) => language.code === state.language)?.nativeName || state.language)}</span><button class="button" type="submit">${escapeHtml(t('assistant.send'))}</button></div>
      </form>
      ${answer ? `<div class="assistant-answer" role="status"><div class="pill-row"><span class="pill ${answer.status === 'refused' ? 'warning' : ''}">${escapeHtml(answer.status === 'refused' ? t('assistant.refused') : t('assistant.deterministic'))}</span><span class="pill muted">${escapeHtml(answer.status === 'refused' ? t('assistant.outOfCorpus') : t('assistant.fallbackNotice'))}</span></div><p style="margin-top:0.8rem">${escapeHtml(answer.answer)}</p><div class="pill-row">${answer.sourceIds?.length ? sourceChips(answer.sourceIds) : `<span class="microcopy">${escapeHtml(t('assistant.noSources'))}</span>`}</div></div>` : ''}
    </div>
    <div class="panel" style="margin-top:1rem"><div class="panel-header"><div><h2>${escapeHtml(t('assistant.cannotConfirm'))}</h2><p>${escapeHtml(t('workflow.noOutcome'))}</p></div></div><div class="trust-strip" style="margin:0"><div class="trust-item"><span class="trust-icon">×</span><span><strong>${escapeHtml(t('iepf.route'))}</strong><span>${escapeHtml(t('workflow.officialInstruction'))}</span></span></div><div class="trust-item"><span class="trust-icon">×</span><span><strong>${escapeHtml(t('statuses.title'))}</strong><span>${escapeHtml(t('workflow.noOutcome'))}</span></span></div><div class="trust-item"><span class="trust-icon">×</span><span><strong>${escapeHtml(t('common.trustBoundary'))}</strong><span>${escapeHtml(t('trust.notConfirmation'))}</span></span></div></div></div>
  </section>`;
}

function renderSettings() {
  return `<section aria-labelledby="settings-title">
    <div class="section-heading"><div><p class="eyebrow">${escapeHtml(t('ui.settings.eyebrow'))}</p><h1 id="settings-title">${escapeHtml(t('ui.settings.title'))}</h1></div><p>${escapeHtml(t('ui.settings.description'))}</p></div>
    <div class="form-grid">
      <article class="panel"><h2>${escapeHtml(t('ui.settings.languageTitle'))}</h2><p class="muted">${escapeHtml(t('ui.settings.languageDescription'))}</p><div class="field"><span class="field-hint">${escapeHtml(t('accessibility.languageSelector'))}</span>${languageSelector('settings-language')}</div></article>
      <article class="panel"><h2>${escapeHtml(t('ui.settings.storageTitle'))}</h2><p class="muted">${escapeHtml(t('ui.settings.storageDescription'))}</p><div class="pill-row"><span class="pill">${escapeHtml(t('storage.localOnly'))}</span><span class="pill muted">${escapeHtml(t('storage.noServerDatabase'))}</span></div></article>
      <article class="panel"><h2>${escapeHtml(t('ui.settings.storedTitle'))}</h2><p class="muted">${escapeHtml(t('ui.settings.storedBody'))}</p></article>
      <article class="panel"><h2>${escapeHtml(t('ui.settings.notStoredTitle'))}</h2><p class="muted">${escapeHtml(t('ui.settings.notStoredBody'))}</p></article>
      <article class="panel"><h2>${escapeHtml(t('ui.settings.exportTitle'))}</h2><p class="muted">${escapeHtml(t('ui.settings.exportBody'))}</p><button class="button secondary" type="button" data-action="export-demo">${escapeHtml(t('ui.settings.exportAction'))}</button></article>
      <article class="panel"><h2>${escapeHtml(t('ui.settings.resetTitle'))}</h2><p class="muted">${escapeHtml(t('ui.settings.resetBody'))}</p><button class="button" type="button" data-action="reset-demo">${escapeHtml(t('ui.settings.resetAction'))}</button></article>
      ${renderStudySettings()}
      <article class="panel"><h2>${escapeHtml(bilingual('Free now · Premium hypothesis', 'अभी नि:शुल्क · प्रीमियम परिकल्पना'))}</h2><p>${escapeHtml(bilingual('Catalogue, official links, preparation, family role labels, and in-app review dates are free in this prototype. Premium family workspace and richer document organization are not sold or unlocked here. No purchase, entitlement, or RevenueCat connection is configured.', 'इस प्रोटोटाइप में कैटलॉग, आधिकारिक लिंक, तैयारी, परिवार लेबल और ऐप समीक्षा तिथियाँ नि:शुल्क हैं। प्रीमियम परिवार कार्यक्षेत्र और दस्तावेज़ व्यवस्था यहाँ बेची या अनलॉक नहीं होती। खरीद, अधिकार या RevenueCat जुड़ा नहीं है।'))}</p><p class="microcopy">${escapeHtml(bilingual('No percentage-of-recovery fee. Official destinations are never paywalled.', 'वापसी राशि का प्रतिशत शुल्क नहीं। आधिकारिक गंतव्य कभी भुगतान के पीछे नहीं।'))}</p></article>
    </div>
    <div class="panel" style="margin-top:1rem">${renderSourceDirectory()}</div>
  </section>`;
}

function readForm(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function beginWorkflow(workflow) {
  state.view = 'discover';
  state.wizardSuspended = false;
  state.assistantAnswer = null;
  if (state.wizard?.workflow === workflow) {
    persist(); render(); return;
  }
  state.wizard = workflow === 'iepf'
    ? {
        workflow,
        step: 1,
        inputs: {
          claimantType: '',
          custody: IEPF_CUSTODY.UNKNOWN,
          companyName: '',
          deathCertificate: 'no',
          heirAuthority: 'no'
        },
        assessment: null,
        checklist: null,
        caseId: null
      }
    : {
        workflow,
        step: 1,
        inputs: { hasHolderName: 'no', hasBank: 'no', hasAdditionalIdentifier: 'no' },
        plan: null,
        checklist: null,
        caseId: null
      };
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleWizardSubmit(form) {
  const values = readForm(form);
  const wizard = state.wizard;
  if (!wizard) return;
  wizard.inputs = { ...wizard.inputs, ...values };
  if (wizard.workflow === 'iepf') {
    if (wizard.step === 1) {
      wizard.step = 2;
    } else if (wizard.step === 2) {
      wizard.assessment = assessIepf(wizard.inputs);
      wizard.step = 3;
    }
  } else if (wizard.step === 1) {
    wizard.plan = buildUdgumPlan(wizard.inputs);
    wizard.checklist = buildUdgumChecklist();
    wizard.step = 2;
  }
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wizardNext() {
  const wizard = state.wizard;
  if (!wizard) return;
  if (wizard.workflow === 'iepf' && wizard.step === 3) {
    const previous = wizard.checklist || [];
    wizard.checklist = buildIepfChecklist(wizard.assessment || assessIepf(wizard.inputs)).map((item) => ({ ...item, reviewed: previous.find((old) => old.id === item.id)?.reviewed === true }));
    wizard.step = 4;
  }
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wizardBack() {
  if (!state.wizard) return;
  if (state.wizard.step > 1) state.wizard.step -= 1;
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createCaseFromWizard() {
  const wizard = state.wizard;
  const expectedStep = wizard?.workflow === 'iepf' ? 4 : 2;
  if (!wizard || wizard.step !== expectedStep) return;
  const isIepf = wizard.workflow === 'iepf';
  const assessment = isIepf ? (wizard.assessment || assessIepf(wizard.inputs)) : (wizard.plan || buildUdgumPlan(wizard.inputs));
  const checklist = isIepf ? (wizard.checklist || buildIepfChecklist(assessment)) : (wizard.checklist || buildUdgumChecklist());
  const dedupKey = caseDeduplicationKey({
    workflow: wizard.workflow,
    routeId: assessment.routeId,
    claimantType: assessment.claimantType,
    companyName: assessment.companyName
  });
  const existing = state.cases.find((item) => item.dedupKey === dedupKey);
  if (existing) {
    wizard.caseId = existing.id;
    wizard.step = isIepf ? 5 : 3;
    showToast(t('errors.duplicateCase'));
    persist();
    render();
    return;
  }

  const now = new Date().toISOString();
  const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    demo: activeMode === 'demo',
    workflow: wizard.workflow,
    routeId: assessment.routeId,
    routeTitle: localizedRoute(assessment.routeId, 'title'),
    claimantType: assessment.claimantType || 'search-preparation',
    companyName: assessment.companyName || '',
    status: CASE_STATUS.PREPARING,
    nextAction: statusAction(CASE_STATUS.PREPARING),
    assessment,
    checklist: checklist.map((item) => ({ ...item, reviewed: item.reviewed === true || item.checked === true })),
    timeline: [{ label: t('ui.cases.created'), status: CASE_STATUS.PREPARING, at: now, source: t('ui.cases.demo') }],
    createdAt: now,
    updatedAt: now,
    dedupKey
  };
  state.cases.unshift(record);
  wizard.caseId = id;
  wizard.step = isIepf ? 5 : 3;
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveOpportunityCase(opportunityId) {
  const opportunity = getOpportunityById(opportunityId);
  if (!opportunity || opportunity.publicationStatus !== 'published') return;
  const dedupKey = `opportunity|${opportunity.id}`;
  const existing = state.cases.find((record) => record.dedupKey === dedupKey);
  if (existing) {
    state.view = 'cases';
    showToast(t('errors.duplicateCase'));
    persist();
    render();
    return;
  }
  const now = new Date().toISOString();
  const relevance = scoreOpportunityRelevance(opportunity, opportunityEvidenceInput());
  const checklist = opportunity.eligibilityEvidencePrompts.map((prompt) => ({
    id: `opportunity-${prompt.id}`,
    title: prompt.label,
    detail: `${prompt.question} ${prompt.evidenceHint}`,
    sourceIds: [...opportunity.sourceIds],
    label: t('ui.common.userReportedNotVerified'),
    reviewed: false
  }));
  state.cases.unshift({
    id: `demo-opportunity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    demo: activeMode === 'demo',
    workflow: opportunity.category === 'unclaimed-bank-deposits' ? 'udgam' : 'iepf',
    opportunityId: opportunity.id,
    routeId: opportunity.id,
    routeTitle: opportunity.title,
    claimantType: 'search-preparation',
    companyName: '',
    status: CASE_STATUS.PREPARING,
    nextAction: t('ui.opportunity.nextActionBody'),
    assessment: { ...relevance, sourceIds: [...opportunity.sourceIds], isOfficiallyConfirmed: false },
    checklist,
    sourceIds: [...opportunity.sourceIds],
    officialUrl: opportunity.officialUrl,
    timeline: [{ label: t('ui.cases.created'), status: CASE_STATUS.PREPARING, at: now, source: t('ui.cases.demo') }],
    createdAt: now,
    updatedAt: now,
    dedupKey
  });
  state.view = 'cases';
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function searchOpportunityForm(form) {
  const values = readForm(form);
  const previous = state.discovery || defaultState().discovery;
  const next = {
    ...previous,
    query: String(values.query || '').trim().slice(0, 160),
    category: String(values.category || ''),
    institution: String(values.institution || '').trim().slice(0, 120),
    product: String(values.product || '').trim().slice(0, 120),
    clues: String(values.clues || '').trim().slice(0, 240),
    verification: String(values.verification || ''),
    evidenceKind: String(values.evidenceKind || ''),
    evidenceConfirmed: values.evidenceConfirmed === 'on',
    conflictingEvidence: values.conflictingEvidence === 'on',
    selectedId: ''
  };
  next.results = searchOpportunities({ query: next.query, category: next.category }).map((item) => item.id);
  state.discovery = next;
  persist();
  render();
}

function toggleWizardChecklist(index, checked) {
  const item = state.wizard?.checklist?.[index];
  if (!item) return;
  item.reviewed = checked;
  delete item.checked;
  persist();
  render();
}

function toggleCaseChecklist(caseId, index, checked) {
  const record = state.cases.find((item) => item.id === caseId);
  if (!record?.checklist?.[index]) return;
  record.checklist[index].reviewed = checked;
  delete record.checklist[index].checked;
  record.updatedAt = new Date().toISOString();
  persist();
  render();
}

function updateCaseStatus(caseId, toStatus) {
  const record = state.cases.find((item) => item.id === caseId);
  if (!record || !canTransitionCaseStatus(record.status, toStatus)) {
    showToast(t('statuses.transitionNotAllowed'));
    render();
    return;
  }
  const now = new Date().toISOString();
  record.status = toStatus;
  record.nextAction = statusAction(toStatus);
  record.updatedAt = now;
  record.timeline = Array.isArray(record.timeline) ? record.timeline : [];
  record.timeline.push({ label: statusLabel(toStatus), status: toStatus, at: now, source: t('workflow.userReportedInput') });
  persist();
  render();
}

function exportDemo() {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    demoMode: activeMode === 'demo',
    note: 'Local Reclaim Labs preparation state. Not an official record.',
    cases: state.cases
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'reclaim-labs-demo.json';
  link.click();
  URL.revokeObjectURL(url);
  showToast(t('ui.settings.exportAction'));
  render();
}

function openOfficial(url) {
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) showToast('The browser blocked the new tab. Use the source link again to open the official destination.');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'navigate') {
    state.view = target.dataset.view || 'home';
    if (state.view === 'discover') state.wizardSuspended = true;
    persist();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (action === 'switch-mode') {
    switchMode();
  } else if (action === 'start-study') {
    state.study = { startedAt: Date.now() };
    state.view = 'discover'; state.wizardSuspended = true; state.discovery.selectedId = '';
    persist(); render();
  } else if (action === 'case-event' || action === 'record-portal') {
    const record = state.cases.find((item) => item.id === target.dataset.caseId);
    if (!record) return;
    const type = action === 'record-portal' ? 'portal-opened' : target.dataset.eventType;
    if (type === 'recovery-reported' && !window.confirm(bilingual('Record your own report of recovery? This does not verify an amount or an institutional outcome.', 'वापसी की आपकी रिपोर्ट दर्ज करें? इससे राशि या संस्था का परिणाम सत्यापित नहीं होता।'))) return;
    Object.assign(record, appendCaseEvent(record, type, { provenance: action === 'record-portal' ? 'browser-click' : 'user-reported' }));
    persist();
    // Keep native link navigation intact; do not replace the anchor before its default action.
    if (action !== 'record-portal') render();
  } else if (action === 'start-workflow') {
    beginWorkflow(target.dataset.workflow);
  } else if (action === 'view-opportunity') {
    state.discovery.selectedId = target.dataset.opportunityId || '';
    persist();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (action === 'back-opportunities') {
    state.discovery.selectedId = '';
    persist();
    render();
  } else if (action === 'clear-opportunity-search') {
    state.discovery = defaultState().discovery;
    persist();
    render();
  } else if (action === 'save-opportunity-case') {
    saveOpportunityCase(target.dataset.opportunityId);
  } else if (action === 'reset-demo') {
    resetDemo();
  } else if (action === 'wizard-back') {
    wizardBack();
  } else if (action === 'wizard-next') {
    wizardNext();
  } else if (action === 'create-case') {
    createCaseFromWizard();
  } else if (action === 'update-case-status') {
    updateCaseStatus(target.dataset.caseId, target.dataset.toStatus);
  } else if (action === 'export-demo') {
    exportDemo();
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.dataset.action === 'language') {
    state.language = resolveLanguage(target.value);
    state.cases.forEach((record) => {
      record.nextAction = statusAction(record.status);
      record.timeline = (record.timeline || []).map((item) => ({ ...item, label: item.status ? statusLabel(item.status) : item.label, source: item.source === 'Reclaim Labs local demo' || item.source === 'User-reported local update' ? t('workflow.userReportedInput') : item.source }));
    });
    if (state.wizard?.assessment?.confidenceLabel) {
      state.wizard.assessment.confidenceLabel = state.wizard.assessment.confidence === 'suggested-route'
        ? t('ui.common.possibleRouteOnly')
        : t('ui.common.userReportedNotVerified');
    }
    persist();
    render();
  } else if (target.dataset.action === 'wizard-check') {
    toggleWizardChecklist(Number(target.dataset.itemIndex), target.checked);
  } else if (target.dataset.action === 'case-check') {
    toggleCaseChecklist(target.dataset.caseId, Number(target.dataset.itemIndex), target.checked);
  }
});

// Save unfinished answers without replacing the focused control or requiring
// submission; navigation and language switches must not discard typed clues.
document.addEventListener('input', (event) => {
  const target = event.target;
  const form = target.closest?.('form');
  if (form?.dataset.form === 'wizard' && state.wizard && target.name) {
    state.wizard.inputs[target.name] = String(target.value || '').slice(0, 120);
    persist();
  } else if (form?.dataset.form === 'opportunity-search' && target.name) {
    state.discovery[target.name] = target.type === 'checkbox' ? target.checked : String(target.value || '').slice(0, 240);
    persist();
  }
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.dataset.form === 'wizard') {
    handleWizardSubmit(form);
  } else if (form.dataset.form === 'study-result' && state.study) {
    const values = readForm(form);
    state.studyResults = [...(state.studyResults || []), {
      opportunityId: form.dataset.opportunityId,
      elapsedMs: Math.max(0, Date.now() - state.study.startedAt),
      relevant: values.relevant === 'on', understood: values.understood === 'on',
      at: new Date().toISOString(), provenance: 'user-reported', demo: activeMode === 'demo'
    }];
    state.study = null; state.view = 'settings'; persist(); render();
  } else if (form.dataset.form === 'case-followup') {
    const record = state.cases.find((item) => item.id === form.dataset.caseId);
    if (!record) return;
    const values = readForm(form);
    try {
      Object.assign(record, setFollowUp(record, String(values.followUpDate || '')));
      record.familyRole = ['self', 'parent', 'grandparent', 'family'].includes(values.familyRole) ? values.familyRole : 'self';
      record.updatedAt = new Date().toISOString();
      persist(); render();
    } catch {
      showToast(bilingual('Choose a valid calendar date.', 'सही कैलेंडर तिथि चुनें।')); render();
    }
  } else if (form.dataset.form === 'opportunity-search') {
    searchOpportunityForm(form);
  } else if (form.dataset.form === 'assistant') {
    const values = readForm(form);
    if (!String(values.question || '').trim()) {
      showToast(t('validation.missingQuestion'));
      render();
      return;
    }
    const response = answerWithFallback(values.question, { language: state.language });
    state.assistantAnswer = validateAssistantResponse(response).ok
      ? response
      : answerWithFallback('Tell me about IEPF or UDGAM.', { language: state.language });
    persist();
    render();
  }
});

window.addEventListener?.('hashchange', () => {
  const destination = location.hash.slice(1);
  if (['home', 'discover', 'cases', 'assistant', 'settings'].includes(destination)) {
    state.view = destination;
    if (destination === 'discover') state.wizardSuspended = true;
    render();
  }
});

render();
