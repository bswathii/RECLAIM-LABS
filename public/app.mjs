import { answerWithFallback, validateAssistantResponse } from '../src/domain/assistant.mjs';
import { getSources, SOURCE_BY_ID, SOURCES } from '../src/domain/sources.mjs';
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

const STATUS_LABELS = Object.freeze({
  [CASE_STATUS.PREPARING]: 'Preparing',
  [CASE_STATUS.OFFICIAL_SEARCH]: 'Official search / handoff',
  [CASE_STATUS.WAITING_ON_INSTITUTION]: 'Waiting on institution',
  [CASE_STATUS.USER_REPORTED_RESOLVED]: 'User-reported resolved'
});

const STATUS_ACTIONS = Object.freeze({
  [CASE_STATUS.PREPARING]: 'Review the checklist and confirm the official next destination.',
  [CASE_STATUS.OFFICIAL_SEARCH]: 'Complete the official search or handoff yourself; do not share credentials here.',
  [CASE_STATUS.WAITING_ON_INSTITUTION]: 'Record the institution response or return to preparation if information is missing.',
  [CASE_STATUS.USER_REPORTED_RESOLVED]: 'Keep this record for your reference. This is not official confirmation.'
});

const state = loadState();

function defaultState() {
  return {
    view: 'home',
    wizard: null,
    cases: [],
    assistantAnswer: null,
    toast: ''
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || saved.demoMode !== true) return { ...defaultState(), demoMode: true };
    return {
      ...defaultState(),
      ...saved,
      demoMode: true,
      cases: Array.isArray(saved.cases) ? saved.cases.filter((item) => item?.demo === true) : []
    };
  } catch {
    return { ...defaultState(), demoMode: true };
  }
}

function persist() {
  const snapshot = { ...state, demoMode: true, toast: '' };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, defaultState(), { demoMode: true });
  showToast('Synthetic demo data reset. No real records were changed.');
  render();
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
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return 'Not recorded';
  }
}

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
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
    `<a class="source-chip" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(source.confidenceLabel)}">${escapeHtml(source.id)}</a>`
  )).join('');
}

function sourceStatusPill(source) {
  const warning = source.status !== 'verified';
  return `<span class="pill ${warning ? 'warning' : ''}">${escapeHtml(source.confidenceLabel)}</span>`;
}

function navButton(view, label) {
  const current = state.view === view ? ' aria-current="page"' : '';
  return `<button type="button" data-action="navigate" data-view="${view}"${current}>${label}</button>`;
}

function render() {
  const body = state.view === 'home'
    ? renderHome()
    : state.view === 'workflow'
      ? renderWorkflow()
      : state.view === 'tracker'
        ? renderTracker()
        : state.view === 'sources'
          ? renderSources()
          : state.view === 'assistant'
            ? renderAssistant()
            : renderPrivacy();

  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="topbar-inner">
          <button class="brand" type="button" data-action="navigate" data-view="home" aria-label="Reclaim Labs home">
            <span class="brand-mark" aria-hidden="true">R</span>
            <span>Reclaim Labs<small>prepare the next official step</small></span>
          </button>
          <nav class="nav" aria-label="Primary navigation">
            ${navButton('home', 'Explore')}
            ${navButton('tracker', `Tracker${state.cases.length ? ` (${state.cases.length})` : ''}`)}
            ${navButton('sources', 'Sources')}
            ${navButton('assistant', 'Assistant')}
            ${navButton('privacy', 'Privacy')}
          </nav>
        </div>
      </header>
      <div class="demo-banner">
        <div class="topbar-inner demo-banner-inner">
          <span><strong>Synthetic demo mode.</strong> No real financial records, documents, credentials, or official confirmations are stored here.</span>
          <button type="button" data-action="reset-demo">Reset demo</button>
        </div>
      </div>
      <main class="page" id="main-content">${body}</main>
      <footer class="footer">
        <div class="footer-inner">
          <span>Reclaim Labs is a guidance layer, not a filing intermediary or financial adviser.</span>
          <span>Source register checked 19 Oct 2026 · ${state.cases.length} local demo case${state.cases.length === 1 ? '' : 's'}</span>
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
        <p class="eyebrow">Discover · assess · prepare · track</p>
        <h1 id="hero-title">Make the next official step clearer.</h1>
        <p>Reclaim Labs helps families organize what they know about possible unclaimed shares, dividends, and bank deposits—then points them back to the institution that can decide.</p>
        <div class="hero-actions">
          <button class="button" type="button" data-action="start-workflow" data-workflow="iepf">Start an IEPF assessment</button>
          <button class="button secondary" type="button" data-action="start-workflow" data-workflow="udgam">Prepare a UDGAM search</button>
        </div>
      </div>
      <aside class="hero-note" aria-label="Trust boundary">
        <div>
          <p class="eyebrow" style="color:#d9b46c">The honest promise</p>
          <h2>Possible match, not proof.</h2>
          <p>Only the official institution can confirm whether an asset exists, whether a route applies, or whether a claim is accepted.</p>
        </div>
        <ul>
          <li>No amount estimates or recovery guarantees.</li>
          <li>No portal passwords, OTPs, or document uploads.</li>
          <li>No middleman, filing, or percentage of recovery.</li>
        </ul>
      </aside>
    </section>

    <section class="trust-strip" aria-label="Product principles">
      <div class="trust-item"><span class="trust-icon">1</span><span><strong>Traceable</strong><span>Guidance carries a source ID and verification label.</span></span></div>
      <div class="trust-item"><span class="trust-icon">2</span><span><strong>Deterministic</strong><span>Rules route the journey; AI cannot change eligibility or status.</span></span></div>
      <div class="trust-item"><span class="trust-icon">3</span><span><strong>Minimal</strong><span>Only workflow choices are needed for this demo.</span></span></div>
    </section>

    <div class="section-heading">
      <div>
        <p class="eyebrow">Two official paths</p>
        <h2>Where should your search start?</h2>
      </div>
      <p>These are preparation journeys, not a private registry. You always open the official destination yourself.</p>
    </div>
    <section class="category-grid" aria-label="Recovery categories">
      <article class="card category-card">
        <div class="card-top"><span class="category-mark" aria-hidden="true">₹↗</span><span class="pill">Flagship · IEPF</span></div>
        <div>
          <h3>Unclaimed shares &amp; dividends</h3>
          <p>For an individual or family/heir scenario. Answer where the holding may be recorded, see the route gap, and prepare an official handoff.</p>
        </div>
        <div class="pill-row"><span class="pill muted">Possible match only</span><span class="pill muted">No amount shown</span></div>
        <div class="button-row"><button class="button" type="button" data-action="start-workflow" data-workflow="iepf">Explore IEPF</button></div>
      </article>
      <article class="card category-card udgam">
        <div class="card-top"><span class="category-mark" aria-hidden="true">⌕</span><span class="pill">RBI · UDGAM</span></div>
        <div>
          <h3>Unclaimed bank deposits</h3>
          <p>Prepare the non-sensitive information RBI lists for an official UDGAM search. A search result is not an approved or paid claim.</p>
        </div>
        <div class="pill-row"><span class="pill muted">Search preparation</span><span class="pill muted">Claim stays with bank</span></div>
        <div class="button-row"><button class="button" type="button" data-action="start-workflow" data-workflow="udgam">Explore UDGAM</button></div>
      </article>
    </section>

    <section class="panel" style="margin-top:1.2rem" aria-labelledby="how-title">
      <div class="section-heading" style="margin-top:0">
        <div><p class="eyebrow">A calm way back</p><h2 id="how-title">A case that remembers the next action.</h2></div>
        <p>When you create a case, the tracker keeps your own preparation notes and acknowledgements in this browser. It does not turn them into institutional proof.</p>
      </div>
      <div class="trust-strip" style="margin:0">
        <div class="trust-item"><span class="trust-icon">01</span><span><strong>Assess</strong><span>Make the uncertainty visible.</span></span></div>
        <div class="trust-item"><span class="trust-icon">02</span><span><strong>Prepare</strong><span>Check what to verify, without uploads.</span></span></div>
        <div class="trust-item"><span class="trust-icon">03</span><span><strong>Return</strong><span>Track your own follow-up.</span></span></div>
      </div>
    </section>
  `;
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
    return `<section class="empty-state"><h1>No journey is open</h1><p>Choose IEPF or UDGAM to begin a guided preparation flow.</p><button class="button" type="button" data-action="navigate" data-view="home">Back to explore</button></section>`;
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
        <div class="panel-header"><div><p class="eyebrow">IEPF · Step 1 of 4</p><h2 id="iepf-step-1">Who are you helping?</h2><p>Choose the situation that best matches what you know today.</p></div><span class="pill warning">User-reported</span></div>
        <fieldset class="fieldset">
          <legend>Claimant context</legend>
          <div class="choice-grid">
            ${choice('claimantType', 'heir', inputs.claimantType, 'Family / heir', 'I am helping with a deceased family member’s possible shares or dividends.')}
            ${choice('claimantType', 'holder', inputs.claimantType, 'The named holder', 'I am checking a possible holding associated with me.')}
          </div>
        </fieldset>
        <div class="info-box" style="margin-top:1rem"><p><strong>Privacy boundary:</strong> no Aadhaar, PAN, account number, password, OTP, or document upload is needed for this assessment.</p></div>
        <div class="button-row" style="margin-top:1.2rem"><button class="button" type="submit">Continue to route questions</button><button class="button secondary" type="button" data-action="navigate" data-view="home">Cancel</button></div>
      </form>`;
  } else if (active === 2) {
    content = `
      <form data-form="wizard" class="panel" aria-labelledby="iepf-step-2">
        <div class="panel-header"><div><p class="eyebrow">IEPF · Step 2 of 4</p><h2 id="iepf-step-2">What is known about the holding?</h2><p>These answers choose a preparation route. They do not prove that a holding exists.</p></div><span class="pill warning">User-reported</span></div>
        <div class="form-grid">
          <div class="field full">
            <fieldset class="fieldset"><legend>Where might the holding be recorded?</legend>
              <div class="choice-grid">
                ${choice('custody', IEPF_CUSTODY.IEPF, inputs.custody, 'Already transferred to IEPF', 'You have a reason to think the holding is already with IEPF.')}
                ${choice('custody', IEPF_CUSTODY.COMPANY_SUSPENSE, inputs.custody, 'Company / RTA suspense account', 'You have a reason to think the company or RTA still records it.')}
                ${choice('custody', IEPF_CUSTODY.UNKNOWN, inputs.custody, 'Not sure yet', 'Reclaim Labs will route you to a custody-verification step.')}
              </div>
            </fieldset>
          </div>
          <div class="field">
            <label for="company-name">Company or RTA label (optional)</label>
            <input id="company-name" name="companyName" maxlength="120" value="${escapeHtml(inputs.companyName)}" placeholder="e.g. a company name" autocomplete="off" />
            <small>Use a non-sensitive label only. This is not verified by Reclaim Labs.</small>
          </div>
          ${inputs.claimantType === 'heir' ? `<div class="field"><div class="info-box"><p><strong>Heir context:</strong> the institution decides what current evidence it accepts. This demo records availability only.</p></div></div>` : ''}
          ${inputs.claimantType === 'heir' ? `<div class="field full">${yesNoChoice('deathCertificate', inputs.deathCertificate, 'Is death-related evidence available to arrange?', 'Do not upload it here. The official institution must confirm what it accepts.')}</div>` : ''}
          ${inputs.claimantType === 'heir' ? `<div class="field full">${yesNoChoice('heirAuthority', inputs.heirAuthority, 'Is heir authority / succession evidence available to arrange?', 'This is a preparation prompt, not a statement of legal eligibility.')}</div>` : ''}
        </div>
        <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">Back</button><button class="button" type="submit">See the deterministic assessment</button></div>
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
      <h1 id="workflow-title">IEPF shares &amp; dividends</h1>
      ${renderStepper(active, ['Context', 'Route questions', 'Assessment', 'Prepare', 'Tracked'])}
    </div>
    ${content}
  </section>`;
}

function renderAssessmentStep(assessment) {
  const missing = assessment.missingInformation || [];
  return `<section class="panel" aria-labelledby="assessment-title">
    <div class="panel-header"><div><p class="eyebrow">IEPF · Step 3 of 4</p><h2 id="assessment-title">Your preparation route</h2><p>This is a deterministic assessment of your answers—not an eligibility decision.</p></div><span class="status-chip ${assessment.confidence === 'possible-match' ? '' : 'warning'}">${escapeHtml(assessment.confidenceLabel)}</span></div>
    <div class="assessment-grid">
      <div class="assessment-card">
        <p class="eyebrow">Suggested next route</p>
        <h3>${escapeHtml(assessment.routeTitle)}</h3>
        <p>${escapeHtml(assessment.rationale)}</p>
        <div class="info-box"><p><strong>Next action:</strong> ${escapeHtml(assessment.nextAction)}</p></div>
        <div class="pill-row" style="margin-top:0.8rem">${assessment.labels.map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join('')}</div>
      </div>
      <div class="assessment-card">
        <p class="eyebrow">Evidence and gaps</p>
        ${missing.length ? `<ul>${missing.map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.reason)}</li>`).join('')}</ul>` : '<p>No gaps in the answers you provided. That still does not confirm eligibility or an asset.</p>'}
        <p class="microcopy" style="margin-top:0.8rem">Rule used: ${escapeHtml(assessment.routeRule)}.</p>
      </div>
    </div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none">
      <div class="panel-header"><div><h3>Official destinations</h3><p>These are links to check yourself. The IEPF/MCA pages were access-blocked during this audit.</p></div><div class="pill-row">${sourceChips(assessment.sourceIds)}</div></div>
      ${renderOfficialLinks(assessment.routeId)}
    </div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">Back</button><button class="button" type="button" data-action="wizard-next">Build preparation checklist</button></div>
  </section>`;
}

function renderOfficialLinks(routeId) {
  const iepf = SOURCE_BY_ID['SRC-IEPFA-HOME'];
  const mca = SOURCE_BY_ID['SRC-MCA-HOME'];
  const links = routeId === 'company-rta'
    ? [iepf]
    : [iepf, mca];
  return `<div class="button-row">${links.map((source) => `<a class="button secondary small" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">Open ${escapeHtml(source.institution)}</a>`).join('')}</div>`;
}

function renderIepfChecklistStep(assessment, checklist) {
  return `<section class="panel" aria-labelledby="checklist-title">
    <div class="panel-header"><div><p class="eyebrow">IEPF · Step 4 of 4</p><h2 id="checklist-title">Prepare without over-collecting</h2><p>Checking an item means you acknowledged it. It does not verify a document, an institution record, or eligibility.</p></div><span class="status-chip warning">Acknowledgement only</span></div>
    <div class="info-box warning"><p><strong>Current-source caution:</strong> the IEPF Authority and MCA destinations are official, but their pages returned HTTP 403 to the current audit. Confirm all current instructions on the official site before acting.</p></div>
    <div class="checklist" style="margin-top:1rem">${checklist.map((item, index) => renderChecklistItem(item, index)).join('')}</div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none"><div class="panel-header"><div><h3>Open the official next step</h3><p>${escapeHtml(assessment.nextAction)}</p></div><div class="pill-row">${sourceChips(assessment.sourceIds)}</div></div>${renderOfficialLinks(assessment.routeId)}</div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">Back</button><button class="button" type="button" data-action="create-case">Create local demo case</button></div>
  </section>`;
}

function renderChecklistItem(item, index, caseId = '') {
  const checkboxAction = caseId ? 'case-check' : 'wizard-check';
  const identifier = caseId ? `data-case-id="${escapeHtml(caseId)}"` : '';
  return `<label class="checklist-item ${item.checked ? 'checked' : ''}">
    <input type="checkbox" data-action="${checkboxAction}" data-item-index="${index}" ${identifier} ${item.checked ? 'checked' : ''} />
    <span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.detail)}</p><span class="pill-row">${item.sourceIds?.length ? sourceChips(item.sourceIds) : ''}<span class="pill muted">${escapeHtml(item.label)}</span></span></span>
    <span class="microcopy">${item.checked ? 'Acknowledged' : 'Not yet checked'}</span>
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
      <div class="panel-header"><div><p class="eyebrow">UDGAM · Step 1 of 2</p><h2 id="udgam-step-1">Prepare a search, not a claim</h2><p>RBI lists these information categories for an individual UDGAM search. We ask only whether you have them.</p></div><span class="pill">Verified RBI guidance</span></div>
      <div class="form-grid">
        <div class="field full">${yesNoChoice('hasHolderName', inputs.hasHolderName, 'Do you know the account-holder name?', 'Do not enter the name into this demo.')}</div>
        <div class="field full">${yesNoChoice('hasBank', inputs.hasBank, 'Do you know the bank name?', 'You can select one or more banks on the official portal.')}</div>
        <div class="field full">${yesNoChoice('hasAdditionalIdentifier', inputs.hasAdditionalIdentifier, 'Do you have an additional identifier or address?', 'RBI lists options such as PAN, driving licence, voter ID, passport, date of birth, or address. Do not enter the value here.')}</div>
      </div>
      <div class="info-box" style="margin-top:1rem"><p><strong>Important:</strong> RBI says UDGAM provides search information. Any claim is made with the respective bank, not through UDGAM or Reclaim Labs.</p><div class="pill-row" style="margin-top:0.55rem">${sourceChips(['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-DEA-FAQ'])}</div></div>
      <div class="button-row" style="margin-top:1.2rem"><button class="button" type="submit">Review search plan</button><button class="button secondary" type="button" data-action="navigate" data-view="home">Cancel</button></div>
    </form>`;
  } else if (active === 2) {
    content = renderUdgumPlanStep(plan, checklist);
  } else {
    content = renderCreatedStep(wizard.caseId, 'UDGAM');
  }

  return `<section aria-labelledby="workflow-title"><div class="wizard-header"><p class="eyebrow">Guided search preparation</p><h1 id="workflow-title">RBI UDGAM</h1>${renderStepper(active, ['Search inputs', 'Prepare', 'Tracked'])}</div>${content}</section>`;
}

function renderUdgumPlanStep(plan, checklist) {
  const missing = plan.missingInformation || [];
  return `<section class="panel" aria-labelledby="udgam-plan-title">
    <div class="panel-header"><div><p class="eyebrow">UDGAM · Step 2 of 2</p><h2 id="udgam-plan-title">Your official search plan</h2><p>This plan helps you arrive at UDGAM prepared. It does not search the portal for you.</p></div><span class="status-chip ${plan.confidence === 'ready-to-search' ? 'blue' : 'warning'}">${escapeHtml(plan.confidenceLabel)}</span></div>
    ${missing.length ? `<div class="info-box warning"><p><strong>Still to arrange:</strong></p><ul>${missing.map((item) => `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.reason)}</li>`).join('')}</ul></div>` : '<div class="info-box"><p><strong>Ready to prepare the search.</strong> The official portal still decides what appears and the bank decides any claim.</p></div>'}
    <div class="checklist" style="margin-top:1rem">${checklist.map((item, index) => renderChecklistItem(item, index)).join('')}</div>
    <div class="panel" style="margin-top:1rem;background:#fbfcfa;box-shadow:none"><div class="panel-header"><div><h3>Official next step</h3><p>${escapeHtml(plan.nextAction)}</p></div><div class="pill-row">${sourceChips(plan.sourceIds)}</div></div><div class="button-row"><a class="button" href="${escapeHtml(SOURCE_BY_ID['SRC-RBI-UDGAM-PORTAL'].url)}" target="_blank" rel="noreferrer">Open official UDGAM</a></div></div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button secondary" type="button" data-action="wizard-back">Back</button><button class="button" type="button" data-action="create-case">Create local demo case</button></div>
  </section>`;
}

function renderCreatedStep(caseId, label) {
  const record = state.cases.find((item) => item.id === caseId);
  return `<section class="panel" aria-labelledby="created-title">
    <div class="panel-header"><div><p class="eyebrow">${escapeHtml(label)} · Tracked locally</p><h2 id="created-title">Your case has a next action.</h2><p>This record is synthetic and stays in this browser. It is not a filing receipt or institutional confirmation.</p></div><span class="status-chip">Demo case created</span></div>
    <div class="assessment-grid"><div class="assessment-card"><p class="eyebrow">Next action</p><h3>${escapeHtml(record?.nextAction || 'Open the tracker to review your case.')}</h3><p>Return here after you take an official step and update only your own record.</p></div><div class="assessment-card"><p class="eyebrow">What this does not mean</p><ul><li>Not an approved claim.</li><li>Not proof an asset exists.</li><li>Not official status.</li></ul></div></div>
    <div class="button-row" style="margin-top:1.2rem"><button class="button" type="button" data-action="navigate" data-view="tracker">Open tracker</button><button class="button secondary" type="button" data-action="navigate" data-view="home">Explore another category</button></div>
  </section>`;
}

function renderTracker() {
  return `<section aria-labelledby="tracker-title">
    <div class="section-heading"><div><p class="eyebrow">Your local record</p><h1 id="tracker-title">Case tracker</h1></div><button class="button small" type="button" data-action="start-workflow" data-workflow="iepf">New IEPF case</button></div>
    <div class="info-box"><p><strong>Progress is not recovery value.</strong> The tracker shows steps you acknowledged, your selected status, and the next action. It never turns a possible match into an official outcome.</p></div>
    ${state.cases.length ? `<div class="case-list" style="margin-top:1rem">${state.cases.map(renderCaseCard).join('')}</div>` : `<div class="empty-state" style="margin-top:1rem"><h2>No local cases yet</h2><p>Start an IEPF family/heir assessment or prepare a UDGAM search. A case is created only when you choose to track it.</p><div class="button-row" style="justify-content:center"><button class="button" type="button" data-action="start-workflow" data-workflow="iepf">Start IEPF</button><button class="button secondary" type="button" data-action="start-workflow" data-workflow="udgam">Start UDGAM</button></div></div>`}
  </section>`;
}

function renderCaseCard(record) {
  const progress = getCaseProgress(record);
  const workflowLabel = record.workflow === 'iepf' ? 'IEPF shares & dividends' : 'RBI UDGAM';
  const nextStatuses = getAllowedNextStatuses(record.status);
  return `<article class="case-card" aria-labelledby="case-${escapeHtml(record.id)}">
    <div class="case-card-header"><div><p class="eyebrow">${escapeHtml(workflowLabel)} · Demo data</p><h3 id="case-${escapeHtml(record.id)}">${escapeHtml(record.routeTitle)}</h3><p>Created ${escapeHtml(formatDate(record.createdAt))} · ${escapeHtml(record.claimantType === 'heir' ? 'Family / heir' : record.claimantType === 'holder' ? 'Named holder' : 'Search preparation')}</p></div><span class="status-chip ${record.status === CASE_STATUS.USER_REPORTED_RESOLVED ? 'warning' : ''}">${escapeHtml(STATUS_LABELS[record.status] || record.status)}</span></div>
    <div class="case-meta"><div class="metric"><strong>${progress.completed} / ${progress.total}</strong><span>steps completed</span></div><div class="metric"><strong>${progress.percentage}%</strong><span>local progress</span></div><div class="metric"><strong>${escapeHtml(formatDate(record.updatedAt || record.createdAt))}</strong><span>last updated</span></div></div>
    <div class="progress-track" aria-label="${progress.percentage}% complete"><div class="progress-bar" style="width:${progress.percentage}%"></div></div>
    <div class="info-box" style="margin-top:1rem"><p><strong>Next action:</strong> ${escapeHtml(progress.nextAction)}</p></div>
    <div class="checklist" style="margin-top:1rem">${(record.checklist || []).map((item, index) => renderChecklistItem(item, index, record.id)).join('')}</div>
    <div class="timeline" aria-label="Case timeline">${(record.timeline || []).map((item) => `<div class="timeline-item"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(formatDateTime(item.at))} · ${escapeHtml(item.source || 'Local demo record')}</span></div>`).join('')}</div>
    <div class="button-row" style="margin-top:1rem">
      ${nextStatuses.map((status) => `<button class="button ${status === CASE_STATUS.WAITING_ON_INSTITUTION ? 'secondary' : ''} small" type="button" data-action="update-case-status" data-case-id="${escapeHtml(record.id)}" data-to-status="${escapeHtml(status)}">Move to ${escapeHtml(STATUS_LABELS[status])}</button>`).join('')}
      ${record.status === CASE_STATUS.USER_REPORTED_RESOLVED ? '<span class="microcopy">Resolved by your report only; official status is unknown.</span>' : ''}
    </div>
  </article>`;
}

function renderSources() {
  return `<section aria-labelledby="sources-title">
    <div class="section-heading"><div><p class="eyebrow">Trust layer</p><h1 id="sources-title">Official source directory</h1></div><p>Each source carries its access date and status. A destination link is not the same as a verified procedural claim.</p></div>
    <div class="source-list">${SOURCES.map((source) => `<article class="source-card"><div class="source-card-header"><div><p class="eyebrow">${escapeHtml(source.institution)}</p><h3>${escapeHtml(source.title)}</h3></div>${sourceStatusPill(source)}</div><p>Source ID: <strong>${escapeHtml(source.id)}</strong> · Checked ${escapeHtml(formatDate(source.accessedOn))}</p><a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.url)}</a><details><summary>What this record supports</summary><ul>${source.supports.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>${source.openQuestions.length ? `<p class="microcopy" style="margin-top:0.6rem"><strong>Open questions:</strong> ${escapeHtml(source.openQuestions.join(' '))}</p>` : ''}</details></article>`).join('')}</div>
  </section>`;
}

function renderAssistant() {
  const answer = state.assistantAnswer;
  return `<section aria-labelledby="assistant-title">
    <div class="section-heading"><div><p class="eyebrow">Accessibility layer · fallback active</p><h1 id="assistant-title">Ask about the next step</h1></div><p>Qwen3-8B is not connected in this demo. This deterministic fallback answers only from approved source records and refuses out-of-corpus questions.</p></div>
    <div class="assistant-card">
      <div class="panel-header"><div><h2>Grounded explainer</h2><p>Try “How does UDGAM work?” or “What does IEPF verify?”</p></div><span class="status-chip blue">Provider: fallback</span></div>
      <form data-form="assistant" class="form-grid">
        <div class="field full"><label for="assistant-question">Your question</label><textarea id="assistant-question" name="question" rows="3" maxlength="500" placeholder="Ask a procedural question, not for an amount or approval."></textarea></div>
        <div class="field"><label for="assistant-language">Language</label><select id="assistant-language" name="language"><option value="en">English</option><option value="hi">Hindi (fallback wording)</option></select></div>
        <div class="field" style="justify-content:end"><button class="button" type="submit">Explain safely</button></div>
      </form>
      ${answer ? `<div class="assistant-answer" role="status"><div class="pill-row"><span class="pill ${answer.status === 'refused' ? 'warning' : ''}">${escapeHtml(answer.status === 'refused' ? 'Outside verified corpus' : 'Deterministic fallback')}</span><span class="pill muted">${escapeHtml(answer.reason || 'provider-not-configured')}</span></div><p style="margin-top:0.8rem">${escapeHtml(answer.answer)}</p><div class="pill-row">${answer.sourceIds?.length ? sourceChips(answer.sourceIds) : '<span class="microcopy">No procedural source cited because the question was refused.</span>'}</div></div>` : ''}
    </div>
    <div class="panel" style="margin-top:1rem"><div class="panel-header"><div><h2>What the assistant cannot do</h2><p>These are rules, not a model preference.</p></div></div><div class="trust-strip" style="margin:0"><div class="trust-item"><span class="trust-icon">×</span><span><strong>No eligibility decision</strong><span>Routing stays in the deterministic rules engine.</span></span></div><div class="trust-item"><span class="trust-icon">×</span><span><strong>No official status</strong><span>Only institutions can confirm a claim or payment.</span></span></div><div class="trust-item"><span class="trust-icon">×</span><span><strong>No invented facts</strong><span>Unsupported citations and guarantee language fail validation.</span></span></div></div></div>
  </section>`;
}

function renderPrivacy() {
  return `<section aria-labelledby="privacy-title">
    <div class="section-heading"><div><p class="eyebrow">Control your demo data</p><h1 id="privacy-title">Privacy &amp; boundaries</h1></div><p>This MVP deliberately keeps state in this browser and asks for no sensitive financial record.</p></div>
    <div class="form-grid">
      <article class="panel"><h2>Stored here</h2><p class="muted">Only synthetic workflow choices, checklist acknowledgements, case statuses, and timestamps under the demo storage key are saved locally.</p><div class="pill-row"><span class="pill">Demo mode always on</span><span class="pill muted">No account login</span><span class="pill muted">No uploads</span></div></article>
      <article class="panel"><h2>Never enter here</h2><p class="muted">Do not enter Aadhaar, PAN, bank account numbers, passwords, OTPs, government-portal credentials, or document contents.</p><div class="pill-row"><span class="pill warning">No credentials</span><span class="pill warning">No sensitive documents</span></div></article>
      <article class="panel"><h2>Export a copy</h2><p class="muted">Download the current synthetic case state for inspection. This export contains no server secret and is not an official record.</p><button class="button secondary" type="button" data-action="export-demo">Download demo JSON</button></article>
      <article class="panel"><h2>Delete local demo data</h2><p class="muted">Reset removes the Reclaim Labs demo storage namespace from this browser. It cannot affect any official institution.</p><button class="button" type="button" data-action="reset-demo">Reset and delete demo data</button></article>
    </div>
  </section>`;
}

function readForm(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function beginWorkflow(workflow) {
  state.view = 'workflow';
  state.assistantAnswer = null;
  state.wizard = workflow === 'iepf'
    ? {
        workflow,
        step: 1,
        inputs: {
          claimantType: 'heir',
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
    wizard.step = 5;
    showToast('That preparation route is already tracked; no duplicate case was created.');
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
    routeTitle: assessment.routeTitle,
    claimantType: assessment.claimantType || 'search-preparation',
    companyName: assessment.companyName || '',
    status: CASE_STATUS.PREPARING,
    nextAction: assessment.nextAction,
    assessment,
    checklist: checklist.map((item) => ({ ...item })),
    timeline: [{ label: 'Local demo case created', status: CASE_STATUS.PREPARING, at: now, source: 'Reclaim Labs local demo' }],
    createdAt: now,
    updatedAt: now,
    dedupKey
  };
  state.cases.unshift(record);
  wizard.caseId = id;
  wizard.step = 5;
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleWizardChecklist(index, checked) {
  const item = state.wizard?.checklist?.[index];
  if (!item) return;
  item.checked = checked;
  persist();
  render();
}

function toggleCaseChecklist(caseId, index, checked) {
  const record = state.cases.find((item) => item.id === caseId);
  if (!record?.checklist?.[index]) return;
  record.checklist[index].checked = checked;
  record.updatedAt = new Date().toISOString();
  persist();
  render();
}

function updateCaseStatus(caseId, toStatus) {
  const record = state.cases.find((item) => item.id === caseId);
  if (!record || !canTransitionCaseStatus(record.status, toStatus)) {
    showToast('That status transition is not allowed.');
    render();
    return;
  }
  const now = new Date().toISOString();
  record.status = toStatus;
  record.nextAction = STATUS_ACTIONS[toStatus];
  record.updatedAt = now;
  record.timeline = Array.isArray(record.timeline) ? record.timeline : [];
  record.timeline.push({ label: `Status changed to ${STATUS_LABELS[toStatus]}`, status: toStatus, at: now, source: 'User-reported local update' });
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
  showToast('Downloaded the synthetic demo record.');
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
    if (state.view !== 'workflow') state.wizard = state.view === 'home' ? state.wizard : state.wizard;
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
  if (target.dataset.action === 'wizard-check') {
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
    const response = answerWithFallback(values.question, { language: values.language });
    state.assistantAnswer = validateAssistantResponse(response).ok
      ? response
      : answerWithFallback('Tell me about IEPF or UDGAM.', { language: 'en' });
    persist();
    render();
  }
});

render();
