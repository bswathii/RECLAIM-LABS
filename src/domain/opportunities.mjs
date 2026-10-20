import { getSources, hasOnlyKnownSources } from './sources.mjs';

/**
 * Catalogue state describes what the catalogue can responsibly say. None of
 * these states means that an individual asset was found.
 */
export const OPPORTUNITY_STATE = Object.freeze({
  RELEVANT: 'relevant-opportunity',
  POTENTIAL_PERSONAL_MATCH: 'potential-personal-match',
  INSUFFICIENT_INFORMATION: 'insufficient-information',
  NO_MATCH_IN_SOURCES_CHECKED: 'no-match-in-sources-checked'
});

export const OPPORTUNITY_STATUS = Object.freeze({
  JOURNEY: 'journey',
  VERIFIED: 'verified',
  VERIFIED_GUIDANCE: 'verified-guidance',
  OFFICIAL_DESTINATION: 'official-destination'
});

export const ACCESS_MODE = Object.freeze({
  GUIDED_PREPARATION: 'guided-preparation',
  OFFICIAL_SEARCH: 'official-search',
  OFFICIAL_GUIDANCE: 'official-guidance',
  OFFICIAL_GATEWAY: 'official-gateway'
});

const SOURCE_IDS = Object.freeze({
  UDGAM: ['SRC-RBI-UDGAM-FAQ', 'SRC-RBI-UDGAM-PORTAL'],
  IEPF: ['SRC-IEPFA-HOME', 'SRC-MCA-HOME', 'SRC-NSDL-IEPF-GUIDE'],
  DFS: ['SRC-DFS-UNCLAIMED-GATEWAY']
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function prompt(id, label, question, evidenceHint) {
  return { id, label, question, evidenceHint };
}

const RECORDS = [
  {
    id: 'journey-iepf',
    category: 'unclaimed-shares-dividends',
    title: 'Unclaimed shares and dividends — IEPF preparation',
    description: 'A guided preparation journey for checking whether the company/RTA or IEPF/MCA route is the right official place to continue.',
    institution: 'IEPF Authority, Ministry of Corporate Affairs, and the relevant company or RTA',
    eligibilityEvidencePrompts: [
      prompt('claimant-type', 'Claimant type', 'Are you the holder or a family/heir claimant?', 'User-confirmed workflow context only; the institution decides accepted authority.'),
      prompt('custody', 'Current custody', 'Has the company/RTA or IEPF confirmed where the holding is recorded?', 'Ask the relevant official institution; this catalogue does not verify custody.'),
      prompt('issuer', 'Issuer or RTA', 'Do you know the company or official RTA name?', 'Keep a non-sensitive name or label; do not enter account credentials.'),
      prompt('heir-evidence', 'Heir evidence', 'If applicable, can you ask the institution what current succession evidence it accepts?', 'Availability is user-reported and is not a legal or institutional determination.')
    ],
    sourceIds: SOURCE_IDS.IEPF,
    officialUrl: 'https://nsdl.com/an-investors-guide-to-claim-unclaimed-shares-and-dividends',
    destination: 'IEPF Authority and the relevant company/RTA official channel',
    accessMode: ACCESS_MODE.GUIDED_PREPARATION,
    publicationStatus: 'published',
    opportunityType: 'journey',
    accessClass: 'C',
    sourceRecordDate: null,
    deadline: null,
    amount: null,
    refreshMode: 'manual-review',
    verifiedOn: '2026-10-20',
    recordDate: null,
    provenance: {
      method: 'Curated from the existing IEPF journey and approved source register.',
      sourceIds: SOURCE_IDS.IEPF,
      basis: 'The sources support official destinations and general NSDL guidance; current institution-specific instructions remain to be checked.'
    },
    freshness: {
      asOf: '2026-10-20',
      reviewOnChange: 'Recheck official pages before acting on procedural details.'
    },
    limitations: [
      'This journey does not confirm that a holding or dividend exists.',
      'The custody route and accepted evidence must be confirmed by the relevant institution.',
      'IEPF and MCA page content was not relied on as verified procedural detail in the source audit.'
    ],
    status: OPPORTUNITY_STATUS.JOURNEY
  },
  {
    id: 'journey-udgam',
    category: 'unclaimed-bank-deposits',
    title: 'Unclaimed bank deposits — UDGAM preparation',
    description: 'A guided preparation journey for opening the RBI UDGAM search yourself and then following up with the respective bank.',
    institution: 'Reserve Bank of India and the respective participating bank',
    eligibilityEvidencePrompts: [
      prompt('holder-name', 'Account-holder name', 'Do you have the account-holder name ready for the official search?', 'Do not enter the value in Reclaim Labs.'),
      prompt('bank', 'Bank', 'Do you know the bank or banks to check?', 'The bank relationship must be confirmed through the official flow.'),
      prompt('identifier', 'Additional identifier or address', 'Can you provide an additional identifier or address to the official portal when asked?', 'Do not enter an identifier, address, account number, or credential here.')
    ],
    sourceIds: SOURCE_IDS.UDGAM,
    officialUrl: 'https://udgam.rbi.org.in/',
    destination: 'RBI UDGAM official search portal',
    accessMode: ACCESS_MODE.GUIDED_PREPARATION,
    publicationStatus: 'published',
    opportunityType: 'journey',
    accessClass: 'D',
    sourceRecordDate: null,
    deadline: null,
    amount: null,
    refreshMode: 'manual-review',
    verifiedOn: '2026-10-19',
    recordDate: null,
    provenance: {
      method: 'Curated from the existing UDGAM journey and approved source register.',
      sourceIds: SOURCE_IDS.UDGAM,
      basis: 'The RBI FAQ describes the search inputs and claim handoff; the portal is the official destination.'
    },
    freshness: {
      asOf: '2026-10-19',
      reviewOnChange: 'Recheck the portal flow when ready to search.'
    },
    limitations: [
      'UDGAM search information is not an approved or paid claim.',
      'Reclaim Labs does not perform the search or receive individual search results.',
      'Any claim is made with the respective bank.'
    ],
    status: OPPORTUNITY_STATUS.JOURNEY
  },
  {
    id: 'route-rbi-udgam-search',
    category: 'unclaimed-bank-deposits',
    title: 'RBI UDGAM search route',
    description: 'Use the official RBI UDGAM destination to search participating banks using the information the portal requests.',
    institution: 'Reserve Bank of India',
    eligibilityEvidencePrompts: [
      prompt('holder-name', 'Account-holder name', 'Is the account-holder name available to use on the official UDGAM portal?', 'User-confirmed preparation detail; the value stays outside this catalogue.'),
      prompt('bank', 'Bank name', 'Is the relevant bank known?', 'The official portal and bank determine the applicable next step.'),
      prompt('identifier', 'Additional identifier or address', 'Is an additional identifier or address available for the official search?', 'Do not provide the value to Reclaim Labs.')
    ],
    sourceIds: SOURCE_IDS.UDGAM,
    officialUrl: 'https://udgam.rbi.org.in/',
    destination: 'RBI UDGAM official search portal',
    accessMode: ACCESS_MODE.OFFICIAL_SEARCH,
    publicationStatus: 'published',
    opportunityType: 'search-route',
    accessClass: 'D',
    sourceRecordDate: null,
    deadline: null,
    amount: null,
    refreshMode: 'manual-review',
    verifiedOn: '2026-10-19',
    recordDate: null,
    provenance: {
      method: 'Verified route assembled from the RBI UDGAM FAQ and official portal source records.',
      sourceIds: SOURCE_IDS.UDGAM,
      basis: 'RBI describes UDGAM as a search facility and directs claim follow-up to the respective bank.'
    },
    freshness: {
      asOf: '2026-10-19',
      reviewOnChange: 'Recheck the portal and participating-bank flow before use.'
    },
    limitations: [
      'The catalogue does not search UDGAM and cannot show an individual result.',
      'A search does not establish that a claim will be accepted.',
      'Use the respective bank for any follow-up.'
    ],
    status: OPPORTUNITY_STATUS.VERIFIED
  },
  {
    id: 'route-iepf-nsdl-general-guidance',
    category: 'unclaimed-shares-dividends',
    title: 'IEPF and NSDL general unclaimed shares/dividends guidance',
    description: 'Read NSDL’s general investor guidance, then confirm the current route with IEPF, MCA, the company, or its official RTA.',
    institution: 'IEPF Authority, Ministry of Corporate Affairs, and National Securities Depository Limited (NSDL)',
    eligibilityEvidencePrompts: [
      prompt('asset-type', 'Asset type', 'Are you asking about unclaimed shares, unpaid dividends, or both?', 'A general topic label only; the institution confirms the record.'),
      prompt('issuer', 'Issuer or RTA', 'Do you know the company or official RTA connected with the holding?', 'Use a non-sensitive label when asking the institution.'),
      prompt('route-confirmation', 'Route confirmation', 'Has an official institution told you which current route applies?', 'Do not treat catalogue guidance as institutional confirmation.')
    ],
    sourceIds: SOURCE_IDS.IEPF,
    officialUrl: 'https://nsdl.com/an-investors-guide-to-claim-unclaimed-shares-and-dividends',
    destination: 'NSDL general investor guide; confirm the next step with IEPF/MCA or the relevant company/RTA',
    accessMode: ACCESS_MODE.OFFICIAL_GUIDANCE,
    publicationStatus: 'published',
    opportunityType: 'guidance-route',
    accessClass: 'C',
    sourceRecordDate: null,
    deadline: null,
    amount: null,
    refreshMode: 'manual-review',
    verifiedOn: '2026-10-20',
    recordDate: null,
    provenance: {
      method: 'Verified general guidance route based on the approved NSDL guide and official IEPF/MCA destinations.',
      sourceIds: SOURCE_IDS.IEPF,
      basis: 'NSDL publishes a general explanation; it does not replace current institution-specific instructions.'
    },
    freshness: {
      asOf: '2026-10-20',
      reviewOnChange: 'Confirm current instructions and document requirements with the relevant institution.'
    },
    limitations: [
      'This is general guidance, not a finding about an individual holding.',
      'The current IEPF and MCA pages were access-blocked in the source audit.',
      'The company or RTA must confirm the applicable route and evidence.'
    ],
    status: OPPORTUNITY_STATUS.VERIFIED_GUIDANCE
  },
  {
    id: 'route-dfs-unclaimed-assets-gateway',
    category: 'unclaimed-assets',
    title: 'DFS unclaimed-assets gateway — under review',
    description: 'A title-only source record for a Department of Financial Services gateway. Current categories, redirects, and actionable guidance need manual review before publication.',
    institution: 'Department of Financial Services, Ministry of Finance',
    eligibilityEvidencePrompts: [
      prompt('asset-category', 'Asset category', 'Which unclaimed-asset category are you trying to understand?', 'The gateway category and destination must be checked by the user.'),
      prompt('institution', 'Institution', 'Do you know which institution may hold the record?', 'A user-confirmed institution can help narrow the official destination.'),
      prompt('official-route', 'Official route', 'Has the gateway or institution shown you the current destination?', 'Do not infer an individual record from the presence of a catalogue route.')
    ],
    sourceIds: SOURCE_IDS.DFS,
    officialUrl: 'https://www.unclaimedassetsportal.in/',
    destination: 'Department of Financial Services official unclaimed-assets gateway',
    accessMode: ACCESS_MODE.OFFICIAL_GATEWAY,
    publicationStatus: 'under-review',
    opportunityType: 'guidance-route',
    accessClass: 'E',
    sourceRecordDate: null,
    deadline: null,
    amount: null,
    refreshMode: 'manual-review',
    verifiedOn: null,
    recordDate: null,
    provenance: {
      method: 'Curated from the approved Department of Financial Services gateway source record.',
      sourceIds: SOURCE_IDS.DFS,
      basis: 'The source register identifies the site as an official gateway/index; detailed categories were not relied on.'
    },
    freshness: {
      asOf: '2026-10-20',
      reviewOnChange: 'Recheck current categories and redirect behavior before use.'
    },
    limitations: [
      'The gateway is an index, not an individual registry result in this application.',
      'The source audit retrieved only the page title, so detailed gateway behavior remains unverified.',
      'The user must confirm the destination and institution flow.'
    ],
    status: OPPORTUNITY_STATUS.OFFICIAL_DESTINATION
  }
];

for (const opportunity of RECORDS) {
  if (!hasOnlyKnownSources(opportunity.sourceIds)) {
    throw new Error(`Opportunity ${opportunity.id} contains an unknown source ID`);
  }
}

/** Stable, source-traceable records. Nested values are frozen as well. */
export const OPPORTUNITIES = deepFreeze(RECORDS);

export const OPPORTUNITY_BY_ID = Object.freeze(
  Object.fromEntries(OPPORTUNITIES.map((opportunity) => [opportunity.id, opportunity]))
);

const SEARCH_FIELDS = [
  'id',
  'category',
  'title',
  'description',
  'institution',
  'officialUrl',
  'destination',
  'accessMode',
  'opportunityType',
  'publicationStatus',
  'status'
];

function text(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// A small transparent vocabulary, not AI interpretation or an asset lookup.
export function discoveryConcepts(value) {
  const normalized = text(value);
  const concepts = [];
  if (/\b(bank|deposit|deposits|fd|savings|udgam)\b|बैंक|जमा|उद्गम/.test(normalized)) concepts.push('bank');
  if (/\b(share|shares|dividend|dividends|iepf|stock|stocks)\b|शेयर|लाभांश/.test(normalized)) concepts.push('shares');
  return concepts;
}

function asList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').map(text).filter(Boolean);
  const normalized = text(value);
  return normalized ? [normalized] : [];
}

function recordSearchText(opportunity) {
  const prompts = opportunity.eligibilityEvidencePrompts
    .flatMap((item) => [item.id, item.label, item.question, item.evidenceHint]);
  const sources = getSources(opportunity.sourceIds)
    .flatMap((source) => [source.id, source.institution, source.title, source.url]);
  return [...SEARCH_FIELDS.map((field) => opportunity[field]), ...prompts, ...sources]
    .filter((value) => typeof value === 'string')
    .map(text)
    .join(' ');
}

function matchesFilter(opportunity, filters = {}) {
  filters = filters || {};
  const category = asList(filters.category);
  const institution = asList(filters.institution);
  const accessMode = asList(filters.accessMode);
  const status = asList(filters.status);
  const publicationStatus = asList(filters.publicationStatus);
  const opportunityType = asList(filters.opportunityType);
  const accessClass = asList(filters.accessClass);
  const sourceIds = asList(filters.sourceIds);
  const ids = asList(filters.ids || filters.id);

  if (opportunity.publicationStatus === 'under-review' && filters.includeUnderReview !== true) return false;
  if (publicationStatus.length && !publicationStatus.includes(text(opportunity.publicationStatus))) return false;
  if (opportunityType.length && !opportunityType.includes(text(opportunity.opportunityType))) return false;
  if (accessClass.length && !accessClass.includes(text(opportunity.accessClass))) return false;
  if (category.length && !category.includes(text(opportunity.category))) return false;
  if (accessMode.length && !accessMode.includes(text(opportunity.accessMode))) return false;
  if (status.length && !status.includes(text(opportunity.status))) return false;
  if (ids.length && !ids.includes(text(opportunity.id))) return false;
  if (institution.length && !institution.some((term) => text(opportunity.institution).includes(term))) return false;
  if (sourceIds.length && !sourceIds.every((sourceId) => opportunity.sourceIds.map(text).includes(sourceId))) return false;
  return true;
}

/** Filter records without changing catalogue order. */
export function filterOpportunities(filters = {}, opportunities = OPPORTUNITIES) {
  const records = Array.isArray(opportunities) ? opportunities : OPPORTUNITIES;
  return records.filter((opportunity) => matchesFilter(opportunity, filters));
}

/**
 * Deterministic text search followed by exact metadata filters. Empty queries
 * return published records matching the filters, in stable catalogue order.
 * Under-review records require includeUnderReview: true, even with an ID filter.
 */
export function searchOpportunities(queryOrOptions = '', maybeFilters = {}) {
  const options = queryOrOptions && typeof queryOrOptions === 'object'
    ? queryOrOptions
    : { ...maybeFilters, query: queryOrOptions };
  const query = text(options.query || options.q || '');
  const terms = query.split(/\s+/).filter(Boolean);
  const concepts = discoveryConcepts(query);
  return filterOpportunities(options).filter((opportunity) => {
    if (!terms.length) return true;
    if (concepts.length) return concepts.some((concept) => opportunity.category === (concept === 'bank' ? 'unclaimed-bank-deposits' : 'unclaimed-shares-dividends'));
    const haystack = recordSearchText(opportunity);
    return terms.every((term) => haystack.includes(term));
  });
}

function topicalInput(input = {}) {
  const nested = input.userConfirmed && typeof input.userConfirmed === 'object' ? input.userConfirmed : {};
  const confirmed = input.confirmed && typeof input.confirmed === 'object' ? input.confirmed : {};
  const values = {
    institution: input.institution ?? input.confirmedInstitution ?? nested.institution ?? nested.confirmedInstitution ?? confirmed.institution ?? confirmed.confirmedInstitution,
    product: input.product ?? input.confirmedProduct ?? nested.product ?? nested.confirmedProduct ?? confirmed.product ?? confirmed.confirmedProduct,
    clues: input.clues ?? input.confirmedClues ?? nested.clues ?? nested.confirmedClues ?? confirmed.clues ?? confirmed.confirmedClues
  };
  return Object.entries(values)
    .flatMap(([field, value]) => asList(value).map((term) => ({ field, term })));
}

const PERSONAL_EVIDENCE_KINDS = new Set([
  'old-statement', 'share-certificate', 'bank-correspondence', 'official-search-result'
]);

function hasPersonalEvidence(evidence) {
  return Boolean(evidence && typeof evidence === 'object' && !Array.isArray(evidence)
    && evidence.confirmed === true
    && PERSONAL_EVIDENCE_KINDS.has(evidence.kind)
    && evidence.institutionMatches === true
    && evidence.productMatches === true);
}

const STATE_LABELS = Object.freeze({
  [OPPORTUNITY_STATE.RELEVANT]: 'Relevant catalogue route',
  [OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH]: 'Potential personal match based on user-confirmed evidence',
  [OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION]: 'Insufficient information',
  [OPPORTUNITY_STATE.NO_MATCH_IN_SOURCES_CHECKED]: 'No match in this catalogue — no government database search performed'
});

function opportunityTerms(opportunity) {
  const sourceText = getSources(opportunity.sourceIds)
    .flatMap((source) => [source.institution, source.title, source.supports])
    .flat();
  const prompts = opportunity.eligibilityEvidencePrompts
    .flatMap((item) => [item.id, item.label, item.question, item.evidenceHint]);
  return text([
    opportunity.id,
    opportunity.category,
    opportunity.title,
    opportunity.description,
    opportunity.institution,
    opportunity.destination,
    ...sourceText,
    ...prompts
  ].join(' '));
}

/**
 * Score topical labels independently of confirmation. A potential personal
 * match additionally requires explicit personalEvidence and a score >= 65.
 * Even user-confirmed official-search-result evidence is not an authorized
 * search performed or verified by this application.
 */
export function scoreOpportunityRelevance(opportunity, input = {}) {
  input = input || {};
  const fields = topicalInput(input);
  const haystack = opportunityTerms(opportunity);
  const weights = { institution: 45, product: 35, clues: 20 };
  const matchedFields = [];
  const evidence = [];
  let score = 0;
  for (const field of ['institution', 'product', 'clues']) {
    const values = fields.filter((item) => item.field === field);
    const matched = values.filter((item) => haystack.includes(item.term) || (field !== 'institution' && discoveryConcepts(item.term).some((concept) => opportunity.category === (concept === 'bank' ? 'unclaimed-bank-deposits' : 'unclaimed-shares-dividends'))));
    if (matched.length) {
      matchedFields.push(field);
      evidence.push(...matched.map((item) => item.term));
      score += weights[field];
    }
  }

  const reasonCodes = [];
  const limitations = [
    ...opportunity.limitations,
    'Only this curated catalogue is compared; no government database or authorized individual search is performed.',
    'User-confirmed personal evidence is not independently verified and does not confirm an asset, entitlement, amount, or accepted claim.'
  ];
  let state;
  if (input.conflictingEvidence === true) {
    state = OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION;
    reasonCodes.push('conflicting-evidence');
    limitations.push('Conflicting evidence must be resolved with the relevant institution before a personal match can be suggested.');
  } else if (opportunity.publicationStatus === 'under-review') {
    state = OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION;
  } else if (!fields.length) {
    state = OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION;
    reasonCodes.push('missing-topical-information');
  } else if (score === 0) {
    state = OPPORTUNITY_STATE.NO_MATCH_IN_SOURCES_CHECKED;
    reasonCodes.push('no-catalogue-match');
    limitations.push('No catalogue match does not mean no asset exists or that a government database returned no match.');
  } else if (score >= 65 && hasPersonalEvidence(input.personalEvidence)) {
    state = OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH;
    reasonCodes.push('explicit-personal-evidence', 'topical-relevance');
  } else {
    state = OPPORTUNITY_STATE.RELEVANT;
    reasonCodes.push('topical-relevance');
    reasonCodes.push(hasPersonalEvidence(input.personalEvidence)
      ? 'insufficient-topical-relevance-for-personal-match'
      : 'personal-evidence-required');
  }

  if (opportunity.publicationStatus === 'under-review') {
    reasonCodes.push('under-review');
    limitations.push('This record is under manual review and is not a current published actionable route.');
  }
  if (getSources(opportunity.sourceIds).some((source) => source.status === 'access-blocked')) {
    reasonCodes.push('source-unavailable');
    limitations.push('Some official source pages were unavailable in the audit; current institution-specific instructions remain unverified.');
  }
  reasonCodes.push('no-authorized-individual-search');

  return {
    opportunityId: opportunity?.id || null,
    score,
    state,
    stateLabel: STATE_LABELS[state],
    reasonCodes,
    limitations,
    matchedFields,
    evidence: [...new Set(evidence)],
    liveSearchPerformed: false,
    isIndividualMatch: false
  };
}

/** Score every catalogue record and keep the stable catalogue order. */
export function scoreOpportunities(input = {}, opportunities = OPPORTUNITIES) {
  const records = Array.isArray(opportunities) ? opportunities : OPPORTUNITIES;
  return records.map((opportunity) => ({
    opportunity,
    ...scoreOpportunityRelevance(opportunity, input)
  }));
}

/**
 * Convenience helper for a catalogue result: filter first, then score. The
 * result does not imply a live search or an individual asset match.
 */
export function findRelevantOpportunities(input = {}, filters = {}) {
  const records = searchOpportunities(filters);
  return scoreOpportunities(input, records);
}

// Explicit aliases make the domain boundary easy to consume without changing
// the stable records or requiring callers to know the internal helper names.
export const getOpportunities = () => OPPORTUNITIES;
export const OPPORTUNITY_CATALOG = OPPORTUNITIES;
export const getOpportunityById = (id) => OPPORTUNITY_BY_ID[id] || null;
export const assessOpportunityRelevance = scoreOpportunityRelevance;
export const scoreCatalogueRelevance = scoreOpportunities;
export const rankOpportunities = scoreOpportunities;
export const searchCatalogue = searchOpportunities;
