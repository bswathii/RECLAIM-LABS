import { answerWithFallback, validateAssistantResponse } from '../src/domain/assistant.mjs';
import { getSources, SOURCE_BY_ID, SOURCES } from '../src/domain/sources.mjs';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, resolveLanguage, translate } from '../src/domain/i18n.mjs';
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
const app = document.querySelector('#app');
let toastTimer;

function t(key, values = {}) {
  return translate(key, { language: state.language, ...values });
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

function defaultState() {
  return {
    view: 'home',
    language: DEFAULT_LANGUAGE,
    wizard: null,
    cases: [],
    assistantAnswer: null,
    toast: '',
    storageWarning: false
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || saved.demoMode !== true) return { ...defaultState(), demoMode: true };
    const legacyViewMap = { tracker: 'cases', sources: 'settings', privacy: 'settings', workflow: 'discover' };
    const savedView = legacyViewMap[saved.view] || saved.view;
    return {
      ...defaultState(),
      ...saved,
      view: ['home', 'discover', 'cases', 'assistant', 'settings'].includes(savedView) ? savedView : 'home',
      language: resolveLanguage(saved.language),
      demoMode: true,
      cases: Array.isArray(saved.cases)
        ? saved.cases.filter((item) => item?.demo === true).map((item) => normalizeCase(item, saved.language))
        : []
    };
  } catch {
    return { ...defaultState(), demoMode: true, storageWarning: true };
  }
}

function persist() {
  const snapshot = { ...state, demoMode: true, toast: '' };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    state.storageWarning = false;
    return true;
  } catch {
    state.storageWarning = true;
    state.toast = t('errors.saveFailed');
    return false;
  }
}

function resetDemo() {
  if (!window.confirm(t('reset.confirm'))) {
    showToast(t('reset.cancelled'));
    render();
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    state.storageWarning = true;
    showToast(t('reset.failed'));
    render();
    return;
  }
  Object.assign(state, defaultState(), { demoMode: true });
  showToast(t('reset.completed'));
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
  const status = legacyStatus[record?.status] || record?.status || CASE_STATUS.PREPARING;
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
  return labels[source.id] ? t(labels[source.id]) : source.institution;
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
  const labelKey = item.id.startsWith('udgam-') ? 'workflow.officialProcedure' : item.id === 'official-handoff' ? 'workflow.officialHandoff' : item.id === 'heir-evidence' || item.id === 'issuer-reference' ? 'ui.common.userReportedNotVerified' : 'workflow.officialProcedure';
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
          <span><strong>${escapeHtml(t('common.demoData'))}.</strong> ${escapeHtml(t('privacy.noRealRecords'))}</span>
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
          <span>${escapeHtml(t('ui.settings.checked'))} 19 Oct 2026 · ${escapeHtml(t('workflow.caseCount', { count: state.cases.length }))}</span>
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
      const nextAction = record.status === CASE_STATUS.PREPARING ? localizedRoute(record.routeId, 'nextAction') : progress.nextAction;
      return `<article class="home-case"><div><strong>${escapeHtml(localizedRoute(record.routeId, 'title'))}</strong><span>${escapeHtml(statusLabel(record.status))}</span></div><div><strong>${escapeHtml(t('ui.cases.nextAction'))}</strong><span>${escapeHtml(nextAction)}</span></div><button class="button ghost small" type="button" data-action="navigate" data-view="cases">${escapeHtml(t('ui.cases.title'))}</button></article>`;
    }).join('')}</div>
  </section>`;
}

function renderDiscover() {
  if (state.wizard) return renderWorkflow();
  return `<section aria-labelledby="discover-title"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(t('ui.discover.eyebrow'))}</p><h1 id="discover-title">${escapeHtml(t('ui.discover.title'))}</h1></div><p>${escapeHtml(t('ui.discover.description'))}</p></div><div class="info-box"><p>${escapeHtml(t('ui.discover.privacy'))}</p></div><div style="margin-top:1rem">${renderCategoryCards()}</div></section>`;
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
      ${choice(name, 'yes', current, 'Yes / I can arrange or confirm this', 'This is still user-reported, not institutionally verified.')}
      ${choice(name, 'no', current, 'No / not sure yet', 'The next step will show this as an information gap.')}
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
    <div class="case-card-header"><div><p class="eyebrow">${escapeHtml(workflowLabel)} · ${escapeHtml(t('ui.cases.demo'))}</p><h3 id="case-${escapeHtml(record.id)}">${escapeHtml(localizedRoute(record.routeId, 'title'))}</h3><p>${escapeHtml(t('ui.cases.created'))}: ${escapeHtml(formatDate(record.createdAt))} · ${escapeHtml(record.claimantType === 'heir' ? t('ui.cases.familyHeir') : record.claimantType === 'holder' ? t('ui.cases.namedHolder') : t('ui.cases.searchPrep'))}</p></div><span class="status-chip ${record.status === CASE_STATUS.USER_REPORTED_RESOLVED ? 'warning' : ''}">${escapeHtml(statusLabel(record.status))}</span></div>
    <div class="case-meta"><div class="metric"><strong>${escapeHtml(t('ui.cases.stepsReviewed', { reviewed: progress.itemsReviewed, total: progress.total }))}</strong><span>${escapeHtml(t('ui.cases.itemsReviewed'))}</span></div><div class="metric"><strong>${progress.percentage}%</strong><span>${escapeHtml(t('ui.cases.itemsReviewed'))}</span></div><div class="metric"><strong>${escapeHtml(formatDate(record.updatedAt || record.createdAt))}</strong><span>${escapeHtml(t('ui.cases.localUpdated'))}</span></div></div>
    <div class="progress-track" aria-label="${escapeHtml(translate('accessibility.progress', { language: state.language, percentage: progress.percentage }))}"><div class="progress-bar" style="width:${progress.percentage}%"></div></div>
    <div class="info-box" style="margin-top:1rem"><p><strong>${escapeHtml(t('ui.cases.nextAction'))}:</strong> ${escapeHtml(record.status === CASE_STATUS.PREPARING ? localizedRoute(record.routeId, 'nextAction') : progress.nextAction)}</p></div>
    <div class="checklist" style="margin-top:1rem">${(record.checklist || []).map((item, index) => renderChecklistItem(item, index, record.id, { assessment: record.assessment })).join('')}</div>
    <div class="timeline" aria-label="${escapeHtml(t('ui.cases.timeline'))}">${(record.timeline || []).map((item) => `<div class="timeline-item"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(formatDateTime(item.at))} · ${escapeHtml(item.source || t('ui.cases.demo'))}</span></div>`).join('')}</div>
    <div class="button-row" style="margin-top:1rem">
      ${nextStatuses.map((status) => `<button class="button ${status === CASE_STATUS.SUBMISSION_REPORTED || status === CASE_STATUS.PREPARING ? 'secondary' : ''} small" type="button" data-action="update-case-status" data-case-id="${escapeHtml(record.id)}" data-to-status="${escapeHtml(status)}">${escapeHtml(status === CASE_STATUS.ACTION_REPORTED ? t('ui.cases.reportAction') : status === CASE_STATUS.SUBMISSION_REPORTED ? t('ui.cases.reportSubmission') : status === CASE_STATUS.PREPARING ? t('ui.cases.returnToPreparation') : t('ui.cases.markResolved'))}</button>`).join('')}
      ${record.status === CASE_STATUS.USER_REPORTED_RESOLVED ? `<span class="microcopy">${escapeHtml(t('ui.cases.resolvedNote'))}</span>` : ''}
    </div>
  </article>`;
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
  state.assistantAnswer = null;
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
    wizard.checklist = buildIepfChecklist(wizard.assessment || assessIepf(wizard.inputs));
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
    demo: true,
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

function toggleWizardChecklist(index, checked) {
  const item = state.wizard?.checklist?.[index];
  if (!item) return;
  item.reviewed = checked;
  persist();
  render();
}

function toggleCaseChecklist(caseId, index, checked) {
  const record = state.cases.find((item) => item.id === caseId);
  if (!record?.checklist?.[index]) return;
  record.checklist[index].reviewed = checked;
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
    demoMode: true,
    note: 'Synthetic Reclaim Labs browser state. Not an official record.',
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
    persist();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (action === 'start-workflow') {
    beginWorkflow(target.dataset.workflow);
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

document.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.dataset.form === 'wizard') {
    handleWizardSubmit(form);
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

render();
