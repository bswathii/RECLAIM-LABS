import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCESS_MODE,
  OPPORTUNITIES,
  OPPORTUNITY_STATUS,
  OPPORTUNITY_STATE,
  filterOpportunities,
  findRelevantOpportunities,
  getOpportunityById,
  scoreOpportunities,
  scoreOpportunityRelevance,
  searchOpportunities
} from '../src/domain/opportunities.mjs';
import { getSources, hasOnlyKnownSources } from '../src/domain/sources.mjs';

const bankLabels = { institution: 'Reserve Bank of India', product: 'unclaimed deposits' };
const personalEvidence = {
  confirmed: true,
  kind: 'old-statement',
  institutionMatches: true,
  productMatches: true
};
const bankRoute = getOpportunityById('route-rbi-udgam-search');

test('every catalogue record uses only approved, traceable source IDs', () => {
  for (const opportunity of OPPORTUNITIES) {
    assert.ok(opportunity.sourceIds.length > 0, `${opportunity.id} has no source IDs`);
    assert.equal(hasOnlyKnownSources(opportunity.sourceIds), true, opportunity.id);
    assert.equal(getSources(opportunity.sourceIds).length, opportunity.sourceIds.length, opportunity.id);
    assert.deepEqual(opportunity.provenance.sourceIds, opportunity.sourceIds, opportunity.id);
  }
});

test('catalogue records contain required provenance, freshness, and status fields', () => {
  const allowedStatuses = new Set(Object.values(OPPORTUNITY_STATUS));

  for (const opportunity of OPPORTUNITIES) {
    assert.equal(typeof opportunity.provenance?.method, 'string', opportunity.id);
    assert.equal(typeof opportunity.provenance?.basis, 'string', opportunity.id);
    assert.equal(typeof opportunity.freshness?.asOf, 'string', opportunity.id);
    assert.match(opportunity.freshness.asOf, /^\d{4}-\d{2}-\d{2}$/, opportunity.id);
    assert.equal(typeof opportunity.freshness.reviewOnChange, 'string', opportunity.id);
    assert.equal(allowedStatuses.has(opportunity.status), true, opportunity.id);
    assert.ok(Array.isArray(opportunity.limitations) && opportunity.limitations.length > 0, opportunity.id);
    assert.ok(['published', 'under-review'].includes(opportunity.publicationStatus), opportunity.id);
    assert.ok(['journey', 'search-route', 'guidance-route'].includes(opportunity.opportunityType), opportunity.id);
    assert.ok(['C', 'D', 'E'].includes(opportunity.accessClass), opportunity.id);
    assert.equal(opportunity.sourceRecordDate, null, opportunity.id);
    assert.equal(opportunity.deadline, null, opportunity.id);
    assert.equal(opportunity.amount, null, opportunity.id);
    assert.equal(opportunity.refreshMode, 'manual-review', opportunity.id);
  }
});

test('all five stable IDs remain available, including the review-only record', () => {
  assert.deepEqual(OPPORTUNITIES.map(({ id }) => id), [
    'journey-iepf', 'journey-udgam', 'route-rbi-udgam-search',
    'route-iepf-nsdl-general-guidance', 'route-dfs-unclaimed-assets-gateway'
  ]);
  assert.equal(Object.isFrozen(OPPORTUNITIES), true);
  assert.equal(Object.isFrozen(bankRoute), true);
});

test('catalogue search and metadata filters return stable, relevant records', () => {
  assert.deepEqual(
    searchOpportunities('UDGAM').map((opportunity) => opportunity.id),
    ['journey-udgam', 'route-rbi-udgam-search']
  );
  assert.deepEqual(
    filterOpportunities({ category: 'unclaimed-bank-deposits' }).map((opportunity) => opportunity.id),
    ['journey-udgam', 'route-rbi-udgam-search']
  );
  assert.deepEqual(
    filterOpportunities({ sourceIds: ['SRC-RBI-UDGAM-PORTAL'] }).map((opportunity) => opportunity.id),
    ['journey-udgam', 'route-rbi-udgam-search']
  );
  assert.deepEqual(
    searchOpportunities({ query: 'official', accessMode: ACCESS_MODE.OFFICIAL_SEARCH })
      .map((opportunity) => opportunity.id),
    ['route-rbi-udgam-search']
  );
});

test('raw institution and product labels only produce topical relevance, even at a high score', () => {
  const assessment = scoreOpportunityRelevance(bankRoute, bankLabels);

  assert.equal(assessment.state, OPPORTUNITY_STATE.RELEVANT);
  assert.deepEqual(assessment.matchedFields, ['institution', 'product']);
  assert.equal(assessment.score, 80);
  assert.ok(assessment.reasonCodes.includes('personal-evidence-required'));
});

test('legacy confirmation wrappers do not substitute for explicit personal evidence', () => {
  for (const input of [
    { ...bankLabels, confirmed: true },
    { ...bankLabels, userConfirmed: true },
    { userConfirmed: bankLabels },
    { confirmed: bankLabels },
    { confirmedInstitution: bankLabels.institution, confirmedProduct: bankLabels.product }
  ]) {
    const assessment = scoreOpportunityRelevance(bankRoute, input);
    assert.equal(assessment.score, 80);
    assert.equal(assessment.state, OPPORTUNITY_STATE.RELEVANT);
  }
});

test('each accepted explicit personal evidence kind can suggest a potential personal match', () => {
  for (const kind of ['old-statement', 'share-certificate', 'bank-correspondence', 'official-search-result']) {
    const assessment = scoreOpportunityRelevance(bankRoute, {
      ...bankLabels,
      personalEvidence: { ...personalEvidence, kind }
    });
    assert.equal(assessment.state, OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH, kind);
    assert.equal(assessment.score, 80, kind);
    assert.ok(assessment.reasonCodes.includes('explicit-personal-evidence'), kind);
    assert.equal(assessment.liveSearchPerformed, false, kind);
    assert.equal(assessment.isIndividualMatch, false, kind);
  }
});

test('personal evidence must have strict confirmation, an accepted kind, and both matching flags', () => {
  for (const evidence of [
    undefined, null, {}, [], true,
    { ...personalEvidence, confirmed: false },
    { ...personalEvidence, confirmed: 'true' },
    { ...personalEvidence, confirmed: undefined },
    { ...personalEvidence, kind: 'user-selection' },
    { ...personalEvidence, kind: undefined },
    { ...personalEvidence, institutionMatches: false },
    { ...personalEvidence, institutionMatches: 'true' },
    { ...personalEvidence, institutionMatches: undefined },
    { ...personalEvidence, productMatches: false },
    { ...personalEvidence, productMatches: 'true' },
    { ...personalEvidence, productMatches: undefined }
  ]) {
    const assessment = scoreOpportunityRelevance(bankRoute, { ...bankLabels, personalEvidence: evidence });
    assert.equal(assessment.state, OPPORTUNITY_STATE.RELEVANT, JSON.stringify(evidence));
    assert.ok(assessment.reasonCodes.includes('personal-evidence-required'));
  }
});

test('explicit personal evidence still requires sufficient topical relevance', () => {
  for (const [labels, expectedState] of [
    [{ institution: bankLabels.institution }, OPPORTUNITY_STATE.RELEVANT],
    [{ institution: 'unrelated institution' }, OPPORTUNITY_STATE.NO_MATCH_IN_SOURCES_CHECKED],
    [{}, OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION]
  ]) {
    const assessment = scoreOpportunityRelevance(bankRoute, { ...labels, personalEvidence });
    assert.equal(assessment.state, expectedState);
    assert.ok(assessment.score < 65);
  }
});

test('conflicting evidence always takes precedence and explains the insufficient state', () => {
  for (const input of [
    {}, bankLabels, { ...bankLabels, personalEvidence },
    { institution: 'unrelated institution', personalEvidence }
  ]) {
    const assessment = scoreOpportunityRelevance(bankRoute, { ...input, conflictingEvidence: true });
    assert.equal(assessment.state, OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION);
    assert.ok(assessment.reasonCodes.includes('conflicting-evidence'));
    assert.ok(assessment.limitations.some((limitation) => /conflicting evidence/i.test(limitation)));
  }
});

test('institution selection alone stays topical and is not a potential personal match', () => {
  const opportunity = OPPORTUNITIES.find(({ id }) => id === 'route-rbi-udgam-search');
  const assessment = scoreOpportunityRelevance(opportunity, {
    institution: 'Reserve Bank of India'
  });

  assert.equal(assessment.state, OPPORTUNITY_STATE.RELEVANT);
  assert.deepEqual(assessment.matchedFields, ['institution']);
  assert.equal(assessment.score, 45);
});

test('insufficient information and an explicit no-match result are distinct states', () => {
  const opportunity = OPPORTUNITIES[0];
  const insufficient = scoreOpportunityRelevance(opportunity, {});
  const noMatch = scoreOpportunityRelevance(opportunity, {
    confirmed: true,
    institution: 'An unrelated institution',
    product: 'an unrelated product',
    clues: 'an unrelated clue'
  });

  assert.equal(insufficient.state, OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION);
  assert.equal(noMatch.state, OPPORTUNITY_STATE.NO_MATCH_IN_SOURCES_CHECKED);
  assert.notEqual(insufficient.state, noMatch.state);
  assert.deepEqual(insufficient.matchedFields, []);
  assert.deepEqual(noMatch.matchedFields, []);
  assert.ok(insufficient.reasonCodes.includes('missing-topical-information'));
  assert.ok(noMatch.reasonCodes.includes('no-catalogue-match'));
  assert.match(noMatch.stateLabel, /this catalogue.*no government database search/i);
  assert.ok(noMatch.limitations.some((limitation) => /does not mean no asset exists/i.test(limitation)));
});

test('relevance results never fabricate a live search or an individual asset match', () => {
  const results = findRelevantOpportunities({
    ...bankLabels,
    personalEvidence: { ...personalEvidence, kind: 'official-search-result' },
    sourceConfirmed: true,
    liveSearchPerformed: true,
    isIndividualMatch: true
  });

  assert.equal(results.length, 4);
  assert.ok(results.some(({ state }) => state === OPPORTUNITY_STATE.POTENTIAL_PERSONAL_MATCH));
  for (const result of results) {
    assert.equal(result.liveSearchPerformed, false, result.opportunityId);
    assert.equal(result.isIndividualMatch, false, result.opportunityId);
    assert.notEqual(result.state, 'source-confirmed', result.opportunityId);
    assert.ok(result.reasonCodes.includes('no-authorized-individual-search'));
    assert.ok(result.limitations.some((limitation) => /not independently verified/i.test(limitation)));
  }
});

test('records backed by source-unavailable pages remain explicitly constrained', () => {
  const constrained = OPPORTUNITIES.filter((opportunity) =>
    getSources(opportunity.sourceIds).some((source) => source.status === 'access-blocked')
  );

  assert.deepEqual(constrained.map(({ id }) => id), [
    'journey-iepf',
    'route-iepf-nsdl-general-guidance'
  ]);
  for (const opportunity of constrained) {
    assert.ok(
      opportunity.limitations.some((limitation) => /current|blocked|confirm|not verified/i.test(limitation)),
      opportunity.id
    );
    assert.notEqual(opportunity.status, OPPORTUNITY_STATUS.VERIFIED, opportunity.id);
    const assessment = scoreOpportunityRelevance(opportunity, { institution: 'IEPF' });
    assert.equal(assessment.state, OPPORTUNITY_STATE.RELEVANT);
    assert.ok(assessment.reasonCodes.includes('source-unavailable'), opportunity.id);
    assert.ok(assessment.limitations.some((limitation) => /source pages were unavailable/i.test(limitation)));
    assert.notEqual(assessment.state, 'source-confirmed');
  }
});

test('DFS title-only source is review-only and hidden by all default search entry points', () => {
  const dfs = getOpportunityById('route-dfs-unclaimed-assets-gateway');
  assert.equal(dfs.publicationStatus, 'under-review');
  assert.equal(dfs.verifiedOn, null);
  assert.equal(filterOpportunities().length, 4);
  assert.equal(searchOpportunities().length, 4);
  assert.deepEqual(searchOpportunities('DFS'), []);
  assert.deepEqual(filterOpportunities({ id: dfs.id }), []);
  assert.deepEqual(searchOpportunities({ publicationStatus: 'under-review' }), []);
  assert.deepEqual(searchOpportunities({ query: 'DFS', includeUnderReview: 'true' }), []);
  assert.deepEqual(findRelevantOpportunities(bankLabels, { id: dfs.id }), []);
});

test('explicit includeUnderReview exposes DFS for review but never an actionable personal match', () => {
  const dfs = getOpportunityById('route-dfs-unclaimed-assets-gateway');
  assert.equal(searchOpportunities({ includeUnderReview: true }).length, 5);
  assert.deepEqual(searchOpportunities('DFS', { includeUnderReview: true }), [dfs]);
  assert.deepEqual(filterOpportunities({ publicationStatus: 'under-review', includeUnderReview: true }), [dfs]);
  const input = {
    institution: 'Department of Financial Services',
    product: 'unclaimed-assets',
    personalEvidence
  };
  const [assessment] = findRelevantOpportunities(input, { id: dfs.id, includeUnderReview: true });
  assert.equal(assessment.state, OPPORTUNITY_STATE.INSUFFICIENT_INFORMATION);
  assert.ok(assessment.score >= 65);
  assert.ok(assessment.reasonCodes.includes('under-review'));
  assert.ok(assessment.limitations.some((limitation) => /not a current published actionable route/i.test(limitation)));
  assert.equal(scoreOpportunities(input).length, 5, 'raw scoring retains the complete catalogue for inspection');
});

test('publication, opportunity type, and access class are exact metadata filters', () => {
  assert.deepEqual(filterOpportunities({ opportunityType: 'search-route', accessClass: 'D' }), [bankRoute]);
  assert.deepEqual(filterOpportunities({ opportunityType: 'journey', accessClass: 'C' }).map(({ id }) => id), [
    'journey-iepf'
  ]);
  assert.deepEqual(filterOpportunities({ opportunityType: 'guidance-route', accessClass: 'C' }).map(({ id }) => id), [
    'route-iepf-nsdl-general-guidance'
  ]);
  assert.equal(filterOpportunities({ publicationStatus: 'published', includeUnderReview: true }).length, 4);
});

test('plain-language English and Hindi descriptions can find topical routes', () => {
  assert.deepEqual(searchOpportunities('My father had old shares in a company').map((item) => item.category), ['unclaimed-shares-dividends', 'unclaimed-shares-dividends']);
  assert.deepEqual(searchOpportunities('मेरे पिता की बैंक जमा').map((item) => item.category), ['unclaimed-bank-deposits', 'unclaimed-bank-deposits']);
  assert.equal(searchOpportunities('spaceship rewards').length, 0);
});
