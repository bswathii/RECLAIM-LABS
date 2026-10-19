import assert from 'node:assert/strict';
import test from 'node:test';
import { answerWithFallback, validateAssistantResponse } from '../src/domain/assistant.mjs';
import { hasOnlyKnownSources } from '../src/domain/sources.mjs';
import {
  CASE_STATUS,
  IEPF_CUSTODY,
  assessIepf,
  buildIepfChecklist,
  buildUdgumPlan,
  canTransitionCaseStatus,
  getCaseProgress,
  validateAssessment
} from '../src/domain/rules.mjs';

test('identical IEPF inputs produce identical deterministic assessments', () => {
  const input = {
    claimantType: 'heir',
    custody: IEPF_CUSTODY.IEPF,
    companyName: 'Example Industries',
    deathCertificate: 'yes',
    heirAuthority: 'yes'
  };
  assert.deepEqual(assessIepf(input), assessIepf(input));
});

test('custody selects the correct IEPF route and every route cites known sources', () => {
  assert.equal(assessIepf({ custody: IEPF_CUSTODY.IEPF, companyName: 'Example' }).routeId, 'iepf-form-5');
  assert.equal(assessIepf({ custody: IEPF_CUSTODY.COMPANY_SUSPENSE, companyName: 'Example' }).routeId, 'company-rta');
  const unknown = assessIepf({ custody: IEPF_CUSTODY.UNKNOWN });
  assert.equal(unknown.routeId, 'verify-custody');
  assert.equal(hasOnlyKnownSources(unknown.sourceIds), true);
  assert.equal(validateAssessment(unknown), true);
});

test('missing information cannot increase confidence and possible matches are never confirmed', () => {
  const complete = assessIepf({
    claimantType: 'heir',
    custody: IEPF_CUSTODY.IEPF,
    companyName: 'Example',
    deathCertificate: 'yes',
    heirAuthority: 'yes'
  });
  const incomplete = assessIepf({ claimantType: 'heir', custody: IEPF_CUSTODY.UNKNOWN });
  assert.equal(complete.confidence, 'possible-match');
  assert.equal(incomplete.confidence, 'needs-more-information');
  assert.equal(complete.isOfficiallyConfirmed, false);
  assert.equal(incomplete.isOfficiallyConfirmed, false);
});

test('IEPF checklist is route-specific without inventing amounts or deadlines', () => {
  const assessment = assessIepf({
    claimantType: 'heir',
    custody: IEPF_CUSTODY.COMPANY_SUSPENSE,
    companyName: 'Example',
    deathCertificate: 'yes',
    heirAuthority: 'yes'
  });
  const checklist = buildIepfChecklist(assessment);
  assert.ok(checklist.some((item) => item.id === 'heir-evidence'));
  assert.ok(checklist.some((item) => item.id === 'confirm-route'));
  assert.ok(checklist.every((item) => !/₹|amount|guarantee|deadline date/i.test(`${item.title} ${item.detail}`)));
});

test('UDGAM plan exposes missing search inputs without collecting their values', () => {
  const plan = buildUdgumPlan({ hasHolderName: 'yes', hasBank: 'no', hasAdditionalIdentifier: 'no' });
  assert.equal(plan.confidence, 'needs-more-information');
  assert.equal(plan.missingInformation.length, 2);
  assert.equal('accountNumber' in plan, false);
  assert.equal(plan.isOfficiallyConfirmed, false);
});

test('case status transitions reject invalid transitions and progress is derived from state', () => {
  assert.equal(canTransitionCaseStatus(CASE_STATUS.PREPARING, CASE_STATUS.OFFICIAL_SEARCH), true);
  assert.equal(canTransitionCaseStatus(CASE_STATUS.PREPARING, CASE_STATUS.USER_REPORTED_RESOLVED), false);
  const progress = getCaseProgress({
    status: CASE_STATUS.PREPARING,
    nextAction: 'Review the checklist.',
    checklist: [{ checked: true }, { checked: false }]
  });
  assert.deepEqual(progress, { completed: 1, total: 3, percentage: 33, nextAction: 'Review the checklist.' });
});

test('assistant fallback cites approved sources or refuses out-of-corpus questions', () => {
  const udgam = answerWithFallback('How does UDGAM work?');
  assert.equal(validateAssistantResponse(udgam).ok, true);
  assert.deepEqual(udgam.sourceIds, ['SRC-RBI-UDGAM-FAQ']);
  const refused = answerWithFallback('Tell me the exact amount I will recover.');
  assert.equal(refused.status, 'refused');
  assert.equal(validateAssistantResponse(refused).ok, true);
});

test('assistant rejects invented source IDs and unsupported guarantee language', () => {
  assert.equal(validateAssistantResponse({ answer: 'A fact', status: 'grounded', sourceIds: ['NOT-A-SOURCE'] }).ok, false);
  assert.equal(validateAssistantResponse({ answer: 'You are guaranteed to recover it.', status: 'grounded', sourceIds: ['SRC-RBI-UDGAM-FAQ'] }).ok, false);
});
