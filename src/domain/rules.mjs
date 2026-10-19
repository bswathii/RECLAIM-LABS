import { hasOnlyKnownSources } from './sources.mjs';

export const IEPF_CUSTODY = Object.freeze({
  UNKNOWN: 'unknown',
  COMPANY_SUSPENSE: 'company-suspense',
  IEPF: 'iepf'
});

export const CASE_STATUS = Object.freeze({
  PREPARING: 'preparing',
  OFFICIAL_SEARCH: 'official-search',
  WAITING_ON_INSTITUTION: 'waiting-on-institution',
  USER_REPORTED_RESOLVED: 'user-reported-resolved'
});

const ROUTE_SOURCE_IDS = ['SRC-IEPFA-HOME', 'SRC-MCA-HOME'];

const ROUTES = Object.freeze({
  'iepf-form-5': {
    id: 'iepf-form-5',
    title: 'Confirm the IEPF / MCA route',
    shortTitle: 'IEPF / MCA handoff',
    nextAction: 'Confirm the current IEPF and MCA instructions, then use the official destination yourself.',
    rationale: 'You reported that the holding may already be with IEPF. Reclaim Labs cannot confirm that status or eligibility.',
    sourceIds: ROUTE_SOURCE_IDS
  },
  'company-rta': {
    id: 'company-rta',
    title: 'Confirm the company / RTA route',
    shortTitle: 'Company / RTA handoff',
    nextAction: 'Ask the company or its official RTA to confirm whether the holding remains in a suspense account and what current steps apply.',
    rationale: 'You reported that the holding may still be with the company or RTA rather than IEPF. The institution must confirm the route.',
    sourceIds: ROUTE_SOURCE_IDS
  },
  'verify-custody': {
    id: 'verify-custody',
    title: 'First verify where the holding is recorded',
    shortTitle: 'Verify custody first',
    nextAction: 'Use an official company/RTA or IEPF/MCA channel to confirm whether the holding is in a company suspense account or with IEPF.',
    rationale: 'The route changes depending on where the institution records the holding. That information is still missing.',
    sourceIds: ROUTE_SOURCE_IDS
  }
});

const STATUS_TRANSITIONS = Object.freeze({
  [CASE_STATUS.PREPARING]: [CASE_STATUS.OFFICIAL_SEARCH],
  [CASE_STATUS.OFFICIAL_SEARCH]: [CASE_STATUS.PREPARING, CASE_STATUS.WAITING_ON_INSTITUTION],
  [CASE_STATUS.WAITING_ON_INSTITUTION]: [CASE_STATUS.PREPARING, CASE_STATUS.USER_REPORTED_RESOLVED],
  [CASE_STATUS.USER_REPORTED_RESOLVED]: []
});

function cleanText(value) {
  return typeof value === 'string' ? value.trim().slice(0, 120) : '';
}

function yes(value) {
  return value === true || value === 'yes';
}

function no(value) {
  return value === false || value === 'no';
}

function addMissing(missingInformation, label, reason) {
  missingInformation.push({ label, reason });
}

export function assessIepf(input = {}) {
  const claimantType = input.claimantType === 'heir' ? 'heir' : 'holder';
  const custody = Object.values(IEPF_CUSTODY).includes(input.custody) ? input.custody : IEPF_CUSTODY.UNKNOWN;
  const companyName = cleanText(input.companyName);
  const missingInformation = [];

  if (custody === IEPF_CUSTODY.UNKNOWN) {
    addMissing(missingInformation, 'Where the holding is recorded', 'The company/RTA versus IEPF distinction changes the next official destination.');
  }

  if (claimantType === 'heir') {
    if (!yes(input.deathCertificate)) {
      addMissing(missingInformation, 'Death-related evidence availability', 'Ask the relevant institution what current evidence it accepts; do not upload it here.');
    }
    if (!yes(input.heirAuthority)) {
      addMissing(missingInformation, 'Heir authority evidence availability', 'Ask the relevant institution what current succession or authority evidence it accepts.');
    }
  }

  if (!companyName) {
    addMissing(missingInformation, 'Company or RTA name', 'The official institution may need the issuer or its RTA to locate the record.');
  }

  const routeId = custody === IEPF_CUSTODY.IEPF
    ? 'iepf-form-5'
    : custody === IEPF_CUSTODY.COMPANY_SUSPENSE
      ? 'company-rta'
      : 'verify-custody';
  const route = ROUTES[routeId];
  const confidence = missingInformation.length === 0 ? 'possible-match' : 'needs-more-information';

  return {
    workflow: 'iepf',
    claimantType,
    custody,
    companyName,
    routeId,
    routeTitle: route.title,
    routeShortTitle: route.shortTitle,
    confidence,
    confidenceLabel: confidence === 'possible-match' ? 'Possible match — user-reported inputs' : 'Needs more information',
    rationale: route.rationale,
    nextAction: route.nextAction,
    sourceIds: [...route.sourceIds],
    missingInformation,
    isOfficiallyConfirmed: false,
    routeRule: `custody=${custody} selects ${routeId}; missing information never increases confidence`,
    labels: ['user-reported', 'official procedure', confidence]
  };
}

function checklistItem(id, title, detail, sourceIds, label = 'Prepare or verify') {
  return { id, title, detail, sourceIds: [...sourceIds], label, checked: false };
}

export function buildIepfChecklist(assessment) {
  const sourceIds = assessment?.sourceIds?.length ? assessment.sourceIds : ROUTE_SOURCE_IDS;
  const items = [
    checklistItem(
      'confirm-route',
      'Confirm the route with the official institution',
      assessment?.routeId === 'company-rta'
        ? 'Ask the company or official RTA whether the holding remains in suspense and what current instructions apply.'
        : 'Check the current IEPF Authority and MCA instructions before taking any filing or document step.',
      sourceIds,
      'Official procedure — verify current instructions'
    )
  ];

  if (assessment?.claimantType === 'heir') {
    items.push(
      checklistItem(
        'heir-evidence',
        'List the family/heir evidence you can arrange',
        'Record only whether evidence is available. Ask the institution for its current acceptable proof; do not upload it to this demo.',
        sourceIds,
        'User-reported — not verified'
      )
    );
  }

  if (assessment?.companyName) {
    items.push(
      checklistItem(
        'issuer-reference',
        'Keep the company or RTA name handy',
        `User-reported issuer/RTA label: ${assessment.companyName}. Reclaim Labs has not verified the holding or institution relationship.`,
        sourceIds,
        'User-reported — not verified'
      )
    );
  } else {
    items.push(
      checklistItem(
        'issuer-reference',
        'Find the company or RTA name',
        'Use records you already have or ask the official institution. Do not enter account numbers or credentials here.',
        sourceIds,
        'Needs more information'
      )
    );
  }

  items.push(
    checklistItem(
      'official-handoff',
      'Open the official destination yourself',
      'Reclaim Labs does not file a claim, submit documents, or act as a middleman.',
      sourceIds,
      'Trust boundary'
    )
  );

  return items;
}

export function buildUdgumPlan(input = {}) {
  const hasHolderName = yes(input.hasHolderName);
  const hasBank = yes(input.hasBank);
  const hasAdditionalIdentifier = yes(input.hasAdditionalIdentifier);
  const missingInformation = [];

  if (!hasHolderName) {
    addMissing(missingInformation, 'Account-holder name', 'RBI lists this as a search input for an individual.');
  }
  if (!hasBank) {
    addMissing(missingInformation, 'Bank name', 'RBI lists one or more banks as a search input.');
  }
  if (!hasAdditionalIdentifier) {
    addMissing(missingInformation, 'Additional identifier or address', 'RBI lists an identifier such as PAN, driving licence, voter ID, passport, date of birth, or an address as a search input. Reclaim Labs does not collect the value.');
  }

  const confidence = missingInformation.length === 0 ? 'ready-to-search' : 'needs-more-information';
  return {
    workflow: 'udgam',
    routeId: 'udgam-search',
    routeTitle: 'Prepare an official UDGAM search',
    confidence,
    confidenceLabel: confidence === 'ready-to-search' ? 'Ready to prepare a search — not a claim confirmation' : 'Needs more information',
    nextAction: 'Open UDGAM and perform the search yourself; any claim is made with the respective bank, not through Reclaim Labs.',
    sourceIds: ['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-UDGAM-PORTAL'],
    missingInformation,
    isOfficiallyConfirmed: false,
    labels: ['official procedure', confidence]
  };
}

export function buildUdgumChecklist() {
  return [
    checklistItem('udgam-holder-name', 'Have the account-holder name ready', 'RBI lists the account-holder name as an individual search input. Reclaim Labs does not store the value.', ['SRC-RBI-UDGAM-FAQ'], 'Official procedure'),
    checklistItem('udgam-bank', 'Have the bank name ready', 'RBI lists one or more banks as an individual search input.', ['SRC-RBI-UDGAM-FAQ'], 'Official procedure'),
    checklistItem('udgam-extra', 'Have an additional identifier or address ready', 'RBI lists an additional identifier or address. Do not enter the value into this demo.', ['SRC-RBI-UDGAM-FAQ'], 'Official procedure'),
    checklistItem('udgam-handoff', 'Open the official UDGAM portal', 'UDGAM provides search information; any claim is made with the respective bank.', ['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-UDGAM-PORTAL'], 'Trust boundary')
  ];
}

export function canTransitionCaseStatus(from, to) {
  return Boolean(STATUS_TRANSITIONS[from]?.includes(to));
}

export function getAllowedNextStatuses(status) {
  return [...(STATUS_TRANSITIONS[status] || [])];
}

export function getCaseProgress(caseRecord) {
  const checklist = Array.isArray(caseRecord?.checklist) ? caseRecord.checklist : [];
  const checked = checklist.filter((item) => item.checked).length;
  const statusComplete = caseRecord?.status === CASE_STATUS.USER_REPORTED_RESOLVED;
  const total = checklist.length + 1;
  const completed = checked + (statusComplete ? 1 : 0);
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const nextAction = statusComplete
    ? 'Keep the record for your own reference; Reclaim Labs has not verified an institutional outcome.'
    : caseRecord?.nextAction || 'Review the preparation checklist.';
  return { completed, total, percentage, nextAction };
}

export function caseDeduplicationKey({ workflow, routeId, claimantType = '', companyName = '' } = {}) {
  return [workflow, routeId, claimantType, cleanText(companyName).toLowerCase()].join('|');
}

export function validateAssessment(assessment) {
  return Boolean(
    assessment &&
    assessment.workflow === 'iepf' &&
    typeof assessment.routeId === 'string' &&
    assessment.isOfficiallyConfirmed === false &&
    hasOnlyKnownSources(assessment.sourceIds)
  );
}

export { ROUTES };
