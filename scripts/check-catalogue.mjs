import assert from 'node:assert/strict';
import { OPPORTUNITIES, searchOpportunities } from '../src/domain/opportunities.mjs';
import { SOURCE_BY_ID } from '../src/domain/sources.mjs';

// Offline editorial validation, not a live link checker or freshness claim.
const ids = new Set();
for (const record of OPPORTUNITIES) {
  assert.ok(!ids.has(record.id), 'duplicate catalogue id');
  ids.add(record.id);
  assert.ok(record.sourceIds.length > 0);
  assert.ok(record.sourceIds.every((id) => SOURCE_BY_ID[id]));
  assert.ok(['published', 'under-review', 'expired', 'archived'].includes(record.publicationStatus));
  assert.ok(record.limitations.length > 0);
  assert.equal(record.refreshMode, 'manual-review');
  assert.equal(record.amount, null, 'add amount only with explicit reviewed evidence and tests');
  assert.equal(record.deadline, null, 'add deadlines only with explicit reviewed evidence and tests');
  assert.ok(new URL(record.officialUrl).protocol === 'https:');
  if (record.publicationStatus === 'published') {
    assert.match(record.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(record.sourceIds.some((id) => SOURCE_BY_ID[id].status === 'verified'));
  }
}
console.log(`Catalogue validation PASS: ${searchOpportunities('').length} published records; ${OPPORTUNITIES.filter((item) => item.publicationStatus === 'under-review').length} under review.`);
console.log('No live source refresh, individual asset lookup, or verification-date update was performed.');
