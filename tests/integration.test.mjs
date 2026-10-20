import assert from 'node:assert/strict';
import test from 'node:test';
import { getSources, hasOnlyKnownSources } from '../src/domain/sources.mjs';
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
  getCaseProgress,
  validateAssessment
} from '../src/domain/rules.mjs';

function makeCaseRecord(assessment, checklist) {
  return {
    workflow: assessment.workflow,
    routeId: assessment.routeId,
    claimantType: assessment.claimantType || 'search-preparation',
    companyName: assessment.companyName || '',
    status: CASE_STATUS.PREPARING,
    assessment,
    checklist: checklist.map((item) => ({ ...item, reviewed: item.reviewed === true || item.checked === true }))
  };
}

test('IEPF unknown-custody family/heir journey retains assessment and checklist sources in case data', () => {
  const assessment = assessIepf({
    claimantType: 'heir',
    custody: IEPF_CUSTODY.UNKNOWN,
    companyName: '',
    deathCertificate: 'no',
    heirAuthority: 'no'
  });
  const checklist = buildIepfChecklist(assessment);
  const record = makeCaseRecord(assessment, checklist);

  assert.equal(validateAssessment(assessment), true);
  assert.equal(assessment.routeId, 'verify-custody');
  assert.equal(assessment.confidence, 'needs-more-information');
  assert.deepEqual(assessment.missingInformation.map((item) => item.label), [
    'Where the holding is recorded',
    'Death-related evidence availability',
    'Heir authority evidence availability',
    'Company or RTA name'
  ]);
  assert.deepEqual(checklist.map((item) => item.id), [
    'confirm-route',
    'heir-evidence',
    'issuer-reference',
    'official-handoff'
  ]);
  assert.deepEqual(record.assessment.sourceIds, ['SRC-IEPFA-HOME', 'SRC-MCA-HOME', 'SRC-NSDL-IEPF-GUIDE']);
  assert.ok(record.checklist.every((item) => item.reviewed === false));
  assert.ok(record.checklist.every((item) => hasOnlyKnownSources(item.sourceIds)));
  assert.equal(getSources(record.assessment.sourceIds).length, 3);
});

test('UDGAM missing-input journey retains plan and official checklist sources in case data', () => {
  const plan = buildUdgumPlan({ hasHolderName: 'yes', hasBank: 'no', hasAdditionalIdentifier: 'no' });
  const checklist = buildUdgumChecklist();
  const record = makeCaseRecord(plan, checklist);

  assert.equal(plan.confidence, 'needs-more-information');
  assert.deepEqual(plan.missingInformation.map((item) => item.label), [
    'Bank name',
    'Additional identifier or address'
  ]);
  assert.equal(plan.isOfficiallyConfirmed, false);
  assert.equal('accountNumber' in record.assessment, false);
  assert.equal(record.claimantType, 'search-preparation');
  assert.deepEqual(record.assessment.sourceIds, ['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-UDGAM-PORTAL']);
  assert.deepEqual(record.checklist.map((item) => item.id), [
    'udgam-holder-name',
    'udgam-bank',
    'udgam-extra',
    'udgam-handoff'
  ]);
  assert.ok(record.checklist.every((item) => item.reviewed === false));
  assert.ok(record.checklist.every((item) => hasOnlyKnownSources(item.sourceIds)));
  assert.deepEqual(record.checklist[3].sourceIds, ['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-UDGAM-PORTAL']);
});

test('case deduplication keys are stable for equivalent labels and distinct routes', () => {
  const first = caseDeduplicationKey({
    workflow: 'iepf',
    routeId: 'company-rta',
    claimantType: 'heir',
    companyName: '  Example Industries  '
  });
  const equivalent = caseDeduplicationKey({
    workflow: 'iepf',
    routeId: 'company-rta',
    claimantType: 'heir',
    companyName: 'example industries'
  });

  assert.equal(first, equivalent);
  assert.notEqual(first, caseDeduplicationKey({
    workflow: 'iepf',
    routeId: 'company-rta',
    claimantType: 'holder',
    companyName: 'example industries'
  }));
  assert.notEqual(first, caseDeduplicationKey({
    workflow: 'iepf',
    routeId: 'iepf-form-5',
    claimantType: 'heir',
    companyName: 'example industries'
  }));
});

test('case progress counts reviewed and legacy checked checklist items without changing source data', () => {
  const assessment = assessIepf({ claimantType: 'heir', custody: IEPF_CUSTODY.UNKNOWN });
  const checklist = buildIepfChecklist(assessment);
  const record = makeCaseRecord(assessment, checklist).checklist.map((item, index) => ({
    ...item,
    reviewed: index === 0,
    checked: index === 1
  }));
  const progress = getCaseProgress({
    status: CASE_STATUS.PREPARING,
    nextAction: 'Review the preparation checklist.',
    checklist: record
  });

  assert.equal(progress.itemsReviewed, 2);
  assert.equal(progress.completed, 2);
  assert.equal(progress.total, 4);
  assert.equal(progress.percentage, 50);
  assert.equal(progress.status, CASE_STATUS.PREPARING);
  assert.equal(progress.isInstitutionConfirmed, false);
  assert.equal(progress.nextAction, 'Review the preparation checklist.');
  assert.deepEqual(record[0].sourceIds, checklist[0].sourceIds);
});

test('case status progresses through reported action, submission, and user-reported resolution', () => {
  const statuses = [
    CASE_STATUS.PREPARING,
    CASE_STATUS.ACTION_REPORTED,
    CASE_STATUS.SUBMISSION_REPORTED,
    CASE_STATUS.USER_REPORTED_RESOLVED
  ];

  for (let index = 0; index < statuses.length - 1; index += 1) {
    assert.equal(canTransitionCaseStatus(statuses[index], statuses[index + 1]), true);
    assert.deepEqual(
      getAllowedNextStatuses(statuses[index]),
      index === 0
        ? [CASE_STATUS.ACTION_REPORTED]
        : index === 1
          ? [CASE_STATUS.PREPARING, CASE_STATUS.SUBMISSION_REPORTED]
          : [CASE_STATUS.ACTION_REPORTED, CASE_STATUS.USER_REPORTED_RESOLVED]
    );
  }
  assert.equal(canTransitionCaseStatus(CASE_STATUS.PREPARING, CASE_STATUS.USER_REPORTED_RESOLVED), false);
  assert.equal(canTransitionCaseStatus(CASE_STATUS.USER_REPORTED_RESOLVED, CASE_STATUS.PREPARING), false);

  const resolved = getCaseProgress({ status: CASE_STATUS.USER_REPORTED_RESOLVED, checklist: [] });
  assert.equal(resolved.status, CASE_STATUS.USER_REPORTED_RESOLVED);
  assert.equal(resolved.isInstitutionConfirmed, false);
  assert.match(resolved.nextAction, /not verified/i);
});
