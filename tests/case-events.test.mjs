import assert from 'node:assert/strict';
import test from 'node:test';
import { EVENT_TYPES, appendCaseEvent, casesForMode, setFollowUp } from '../src/domain/case-events.mjs';

const AT = '2026-10-20T12:30:00.000Z';

test('event allowlist is explicit and cannot be extended', () => {
  assert.deepEqual(EVENT_TYPES, [
    'evidence-collected', 'portal-opened', 'submission-reported', 'response-reported', 'recovery-reported'
  ]);
  assert.ok(Object.isFrozen(EVENT_TYPES));
  for (const type of ['institution-confirmed', 'recovered', 'submitted', '', null, undefined]) {
    assert.throws(() => appendCaseEvent({}, type, { at: AT }), /Unsupported/);
  }
});

test('portal click is independent of submission and preserves legacy case state', () => {
  const record = Object.freeze({
    id: 'case-1', demo: false, status: 'preparing',
    checklist: Object.freeze([Object.freeze({ id: 'evidence', reviewed: false })]),
    timeline: Object.freeze([Object.freeze({ label: 'Created', at: AT })])
  });
  const updated = appendCaseEvent(record, 'portal-opened', { at: AT, provenance: 'browser-click' });
  assert.notEqual(updated, record);
  assert.equal(updated.status, 'preparing');
  assert.deepEqual(updated.checklist, record.checklist);
  assert.equal(updated.events.length, 1);
  assert.equal(updated.events[0].type, 'portal-opened');
  assert.equal(updated.events[0].provenance, 'browser-click');
  assert.match(updated.events[0].label, /link clicked.*load not verified/i);
  assert.ok(!updated.events.some((event) => event.type === 'submission-reported'));
  assert.equal(updated.timeline.length, 2);
  assert.equal(record.timeline.length, 1);
  assert.equal('events' in record, false);
});

test('each report can occur independently without evidence, portal, or status prerequisites', () => {
  for (const type of EVENT_TYPES) {
    const record = appendCaseEvent({ status: 'preparing' }, type, { at: AT });
    assert.equal(record.events.length, 1);
    assert.equal(record.events[0].type, type);
    assert.equal(record.events[0].at, AT);
    assert.equal(record.events[0].provenance, 'user-reported');
    assert.equal(record.events[0].isInstitutionConfirmed, false);
    assert.equal(record.status, 'preparing');
    assert.equal('amount' in record, false);
    assert.equal('amount' in record.events[0], false);
    assert.equal('deadline' in record, false);
  }
  assert.throws(() => appendCaseEvent({}, 'recovery-reported', { at: AT, provenance: 'institution-confirmed' }), /provenance/);
});

test('evidence and portal clicks deduplicate while repeated reports retain their audit timestamps', () => {
  let record = { events: [], timeline: [] };
  const later = '2026-10-21T12:30:00.000Z';
  for (const type of EVENT_TYPES) {
    record = appendCaseEvent(record, type, { at: AT });
    record = appendCaseEvent(record, type, { at: later });
  }
  assert.equal(record.events.length, 8);
  assert.equal(record.timeline.length, 8);
  for (const type of EVENT_TYPES) {
    assert.deepEqual(record.events.filter((event) => event.type === type).map((event) => event.at),
      ['evidence-collected', 'portal-opened'].includes(type) ? [AT] : [AT, later]);
  }
});

test('timestamps default to now, preserve explicit timezone instants, and reject invalid dates', () => {
  const start = Date.now();
  const updated = appendCaseEvent({}, 'evidence-collected');
  assert.ok(Date.parse(updated.events[0].at) >= start);
  assert.ok(Date.parse(updated.events[0].at) <= Date.now());
  const offset = '2024-02-29T23:59:59+05:30';
  assert.equal(appendCaseEvent({}, 'response-reported', { at: offset }).events[0].at, offset);
  for (const at of ['', null, 123, 'not-a-date', '2026-10-20', '2026-10-20T10:30:00',
    '2025-02-29T12:00:00Z', '2026-04-31T12:00:00Z', '2026-10-20T24:00:00Z',
    '2026-10-20T12:60:00Z', '2026-10-20T12:00:60Z', '2026-10-20T12:00:00+25:00']) {
    assert.throws(() => appendCaseEvent({}, 'evidence-collected', { at }), /timestamp/);
  }
});

test('follow-up is a user-picked calendar date, can be cleared, and does not invent a deadline', () => {
  const record = Object.freeze({ id: 'case-1', status: 'preparing' });
  const updated = setFollowUp(record, '2024-02-29');
  assert.notEqual(updated, record);
  assert.equal(updated.followUpDate, '2024-02-29');
  assert.equal('followUpDate' in record, false);
  assert.equal('deadline' in updated, false);
  assert.equal('events' in updated, false);
  assert.equal(setFollowUp(updated, '').followUpDate, '');
  assert.equal(setFollowUp(record, '2000-02-29').followUpDate, '2000-02-29');
  for (const date of ['2025-02-29', '1900-02-29', '2026-04-31', '2026-00-01', '2026-13-01',
    '2026-01-00', '2026-1-01', '0000-01-01', '2026-10-20T00:00:00Z', ' 2026-10-20 ', null, undefined, 20261020]) {
    assert.throws(() => setFollowUp(record, date), /calendar date/);
  }
});

test('mode isolation requires explicit boolean flags and returns a separate list', () => {
  const demo = Object.freeze({ id: 'demo', demo: true });
  const real = Object.freeze({ id: 'real', demo: false });
  const records = Object.freeze([demo, real, { id: 'legacy' }, { demo: undefined },
    { demo: null }, { demo: 'true' }, { demo: 'false' }, { demo: 0 }, null]);
  assert.deepEqual(casesForMode(records, 'demo'), [demo]);
  assert.deepEqual(casesForMode(records, 'real'), [real]);
  assert.deepEqual(casesForMode([], 'demo'), []);
  for (const mode of [undefined, null, '', 'unknown', true, false]) {
    assert.deepEqual(casesForMode(records, mode), []);
  }
  const result = casesForMode(records, 'demo');
  result.pop();
  assert.equal(records.length, 9);
  assert.deepEqual(casesForMode(records, 'demo'), [demo]);
});
