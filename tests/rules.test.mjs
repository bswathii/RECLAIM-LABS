import assert from 'node:assert/strict';
import test from 'node:test';
import { answerWithFallback, validateAssistantResponse } from '../src/domain/assistant.mjs';
import { SUPPORTED_LANGUAGES, TRANSLATIONS, translate } from '../src/domain/i18n.mjs';
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

test('missing information cannot increase confidence and route suggestions are never asset matches', () => {
  const complete = assessIepf({
    claimantType: 'heir',
    custody: IEPF_CUSTODY.IEPF,
    companyName: 'Example',
    deathCertificate: 'yes',
    heirAuthority: 'yes'
  });
  const incomplete = assessIepf({ claimantType: 'heir', custody: IEPF_CUSTODY.UNKNOWN });
  assert.equal(complete.confidence, 'suggested-route');
  assert.match(complete.confidenceLabel, /Suggested route/);
  assert.doesNotMatch(complete.confidenceLabel, /Possible match/i);
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

test('case status transitions distinguish reported action, reported submission, and resolution', () => {
  assert.equal(canTransitionCaseStatus(CASE_STATUS.PREPARING, CASE_STATUS.ACTION_REPORTED), true);
  assert.equal(canTransitionCaseStatus(CASE_STATUS.ACTION_REPORTED, CASE_STATUS.SUBMISSION_REPORTED), true);
  assert.equal(canTransitionCaseStatus(CASE_STATUS.SUBMISSION_REPORTED, CASE_STATUS.USER_REPORTED_RESOLVED), true);
  assert.equal(canTransitionCaseStatus(CASE_STATUS.PREPARING, CASE_STATUS.USER_REPORTED_RESOLVED), false);
  const progress = getCaseProgress({
    status: CASE_STATUS.PREPARING,
    nextAction: 'Review the checklist.',
    checklist: [{ reviewed: true }, { reviewed: false }]
  });
  assert.equal(progress.itemsReviewed, 1);
  assert.equal(progress.total, 2);
  assert.equal(progress.percentage, 50);
  assert.equal(progress.isInstitutionConfirmed, false);
  assert.equal(progress.nextAction, 'Review the checklist.');
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

test('English and Hindi dictionaries cover the same core translation keys', () => {
  const flatten = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'string' ? [path] : flatten(child, path);
  });
  const englishKeys = new Set(flatten(TRANSLATIONS.en));
  const hindiKeys = new Set(flatten(TRANSLATIONS.hi));
  assert.deepEqual([...englishKeys].filter((key) => !hindiKeys.has(key)), []);
  assert.deepEqual(SUPPORTED_LANGUAGES.map((language) => language.code), ['en', 'hi']);
  assert.equal(translate('ui.home.title', 'hi'), 'क्या आपके परिवार के पैसे या शेयर छूट गए हो सकते हैं?');
  assert.equal(translate('ui.cases.stepsReviewed', 'en', { reviewed: 1, total: 2 }), '1 / 2');
});
