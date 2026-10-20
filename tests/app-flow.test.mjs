import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as rules from '../src/domain/rules.mjs';
import * as sources from '../src/domain/sources.mjs';
import * as assistant from '../src/domain/assistant.mjs';
import * as i18n from '../src/domain/i18n.mjs';
import * as opportunities from '../src/domain/opportunities.mjs';
import * as events from '../src/domain/case-events.mjs';
import * as copy from '../src/domain/opportunity-copy.mjs';

// Executes the real browser controller with storage/document event boundaries.
// This is a controller integration test, NOT a real-browser or layout test.
const controller = readFileSync(new URL('../public/app.mjs', import.meta.url), 'utf8')
  .replace(/^import\s[\s\S]*?from\s+'[^']+';\s*/gm, '');

function harness(seed = new Map()) {
  const listeners = {};
  const element = { innerHTML: '' };
  let failStorage = false;
  const window = { confirm: () => true, clearTimeout() {}, setTimeout() {}, scrollTo() {} };
  const context = vm.createContext({
    ...rules, ...sources, ...assistant, ...i18n, ...opportunities, ...events, ...copy,
    Date, Intl, URL, Blob, console, window,
    FormData: class { constructor(form) { this.form = form; } entries() { return Object.entries(this.form.values || {}); } },
    document: {
      documentElement: { lang: 'en' },
      querySelector: () => element,
      addEventListener: (name, handler) => { listeners[name] = handler; }
    },
    localStorage: {
      getItem(key) { if (failStorage) throw new Error('blocked'); return seed.get(key) || null; },
      setItem(key, value) { if (failStorage) throw new Error('quota'); seed.set(key, value); },
      removeItem(key) { if (failStorage) throw new Error('blocked'); seed.delete(key); }
    }
  });
  vm.runInContext(controller, context);
  const run = (script) => vm.runInContext(script, context);
  return {
    run, seed, window,
    state: () => JSON.parse(run('JSON.stringify(state)')),
    html: () => element.innerHTML,
    click(dataset) { listeners.click({ target: { dataset, closest() { return this; } } }); },
    submit(form, values, dataset = {}) { listeners.submit({ preventDefault() {}, target: { dataset: { form, ...dataset }, values } }); },
    change(dataset, value, checked) { listeners.change({ target: { dataset, value, checked } }); },
    input(name, value, form = 'wizard') { listeners.input({ target: { name, value, closest: () => ({ dataset: { form } }) } }); },
    failStorage(value) { failStorage = value; }
  };
}

test('actual controller discovers real published routes and hides review-only entries', () => {
  const app = harness();
  app.click({ action: 'navigate', view: 'discover' });
  assert.match(app.html(), /Find a relevant official route/);
  assert.doesNotMatch(app.html(), /Official DFS unclaimed-assets gateway/);
  app.submit('opportunity-search', { query: 'UDGAM', institution: 'Reserve Bank of India', product: 'unclaimed deposits' });
  assert.equal(app.state().discovery.results.length, 2);
  app.click({ action: 'view-opportunity', opportunityId: 'route-rbi-udgam-search' });
  assert.match(app.html(), /Opportunity details/);
  assert.doesNotMatch(app.html(), /<span class="status-chip[^>]*>Potential personal match/);
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  assert.equal(app.state().cases.length, 1);
  assert.equal(app.state().cases[0].demo, false);
  assert.equal(app.state().cases[0].assessment.isIndividualMatch, false);
  assert.equal(app.state().cases[0].assessment.state, 'relevant-opportunity');
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  assert.equal(app.state().cases.length, 1);
  app.click({ action: 'navigate', view: 'home' });
  assert.match(app.html(), /RBI UDGAM search route/);
  const reloaded = harness(app.seed);
  assert.equal(reloaded.state().cases.length, 1);
});

test('explicit user evidence and conflicts drive matching without official confirmation', () => {
  const app = harness();
  app.submit('opportunity-search', { institution: 'Reserve Bank of India', product: 'unclaimed deposits', evidenceKind: 'old-statement', evidenceConfirmed: 'on' });
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  assert.equal(app.state().cases[0].assessment.state, 'potential-personal-match');
  assert.equal(app.state().cases[0].assessment.isOfficiallyConfirmed, false);
  app.click({ action: 'navigate', view: 'discover' });
  app.click({ action: 'view-opportunity', opportunityId: 'route-rbi-udgam-search' });
  assert.match(app.html(), /We have not read the document or verified the result/);
  app.submit('opportunity-search', { institution: 'Reserve Bank of India', product: 'unclaimed deposits', evidenceKind: 'old-statement', evidenceConfirmed: 'on', conflictingEvidence: 'on' });
  assert.equal(app.run("scoreOpportunityRelevance(getOpportunityById('route-rbi-udgam-search'), opportunityEvidenceInput()).state"), 'insufficient-information');
  app.click({ action: 'view-opportunity', opportunityId: 'route-rbi-udgam-search' });
  assert.match(app.html(), /Your evidence conflicts/);
});

test('actual mode switch isolates records and reset confirmation respects namespaces', () => {
  const app = harness();
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  app.click({ action: 'switch-mode' });
  assert.equal(app.state().cases.length, 0);
  assert.match(app.html(), /DEMO DATA — NOT A REAL FINANCIAL MATCH/);
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  assert.equal(app.state().cases[0].demo, true);
  app.window.confirm = () => false;
  app.click({ action: 'reset-demo' });
  assert.equal(app.state().cases.length, 1);
  app.window.confirm = () => true;
  app.click({ action: 'reset-demo' });
  assert.equal(app.state().cases.length, 0);
  app.click({ action: 'switch-mode' });
  assert.equal(app.state().cases.length, 1);
  assert.equal(app.state().cases[0].demo, false);
});

test('IEPF draft and review choices survive navigation, language changes and back tracking', () => {
  const app = harness();
  app.click({ action: 'start-workflow', workflow: 'iepf' });
  assert.equal(app.state().wizard.inputs.claimantType, '');
  app.submit('wizard', { claimantType: 'heir' });
  app.input('companyName', 'Example Industries');
  app.change({ action: 'language' }, 'hi');
  assert.equal(app.state().wizard.inputs.companyName, 'Example Industries');
  app.click({ action: 'navigate', view: 'settings' });
  app.click({ action: 'start-workflow', workflow: 'iepf' });
  assert.equal(app.state().wizard.step, 2);
  app.submit('wizard', { custody: 'unknown', companyName: 'Example Industries', deathCertificate: 'no', heirAuthority: 'no' });
  app.click({ action: 'wizard-next' });
  app.change({ action: 'wizard-check', itemIndex: '0' }, null, true);
  app.click({ action: 'wizard-back' });
  app.click({ action: 'wizard-next' });
  assert.equal(app.state().wizard.checklist[0].reviewed, true);
  app.click({ action: 'create-case' });
  assert.equal(app.state().cases[0].demo, false);
});

test('portal click does not submit and follow-up date and family role persist', () => {
  const app = harness();
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  const id = app.state().cases[0].id;
  app.click({ action: 'record-portal', caseId: id });
  assert.equal(app.state().cases[0].status, 'preparing');
  assert.deepEqual(app.state().cases[0].events.map((item) => item.type), ['portal-opened']);
  app.click({ action: 'case-event', caseId: id, eventType: 'submission-reported' });
  app.submit('case-followup', { followUpDate: '2027-01-05', familyRole: 'parent' }, { caseId: id });
  const reloaded = harness(app.seed);
  assert.equal(reloaded.state().cases[0].familyRole, 'parent');
  assert.equal(reloaded.state().cases[0].followUpDate, '2027-01-05');
  assert.equal(reloaded.state().cases[0].events[1].isInstitutionConfirmed, false);
  reloaded.click({ action: 'navigate', view: 'home' });
  assert.match(reloaded.html(), /Your review date: 2027-01-05/);
});

test('storage failures are explained without breaking in-memory navigation', () => {
  const app = harness();
  app.failStorage(true);
  app.click({ action: 'navigate', view: 'discover' });
  assert.equal(app.state().storageWarning, true);
  assert.match(app.html(), /role="alert"/);
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  assert.equal(app.state().cases.length, 1);
  app.click({ action: 'reset-demo' });
  assert.equal(app.state().cases.length, 1);
});

test('timed discovery test records user relevance and comprehension, not outcome claims', () => {
  const app = harness();
  app.click({ action: 'start-study' });
  assert.ok(app.state().study.startedAt > 0);
  app.click({ action: 'view-opportunity', opportunityId: 'route-rbi-udgam-search' });
  assert.match(app.html(), /Finish timed test/);
  app.submit('study-result', { relevant: 'on', understood: 'on' }, { opportunityId: 'route-rbi-udgam-search' });
  const result = app.state().studyResults[0];
  assert.equal(result.provenance, 'user-reported');
  assert.equal(result.demo, false);
  assert.equal(result.relevant, true);
  assert.equal(result.understood, true);
  assert.ok(result.elapsedMs >= 0);
  assert.match(app.html(), /Counts are local cases, not users/);
  app.click({ action: 'switch-mode' });
  assert.equal(app.state().studyResults.length, 0);
});

test('Hindi catalogue details and saved preparation prompts are localized', () => {
  const app = harness();
  app.change({ action: 'language' }, 'hi');
  app.click({ action: 'view-opportunity', opportunityId: 'route-rbi-udgam-search' });
  app.click({ action: 'navigate', view: 'discover' });
  assert.match(app.html(), /UDGAM/);
  assert.doesNotMatch(app.html(), /Use the official RBI UDGAM destination/);
  assert.match(app.html(), /आधिकारिक पोर्टल पर उपयोगकर्ता की खोज/);
  assert.doesNotMatch(app.html(), /Institution and product words only establish topical relevance/);
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-rbi-udgam-search' });
  assert.match(app.html(), /खाताधारक/);
  assert.doesNotMatch(app.html(), /Is the account-holder name available/);
});

test('review-only catalogue entries cannot be saved as actionable cases', () => {
  const app = harness();
  app.click({ action: 'save-opportunity-case', opportunityId: 'route-dfs-unclaimed-assets-gateway' });
  assert.equal(app.state().cases.length, 0);
});
