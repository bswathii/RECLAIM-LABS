/** Local reports are audit entries, never proof of an institutional outcome. */
export const EVENT_TYPES = Object.freeze([
  'evidence-collected',
  'portal-opened',
  'submission-reported',
  'response-reported',
  'recovery-reported'
]);

const LABELS = Object.freeze({
  'evidence-collected': 'Evidence collected — user-reported',
  'portal-opened': 'Portal link clicked — page load not verified',
  'submission-reported': 'Submission reported by user — not institution-confirmed',
  'response-reported': 'Response reported by user — not institution-confirmed',
  'recovery-reported': 'Recovery reported by user — not institution-confirmed'
});

function requireRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('A case record is required.');
  }
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function isTimestamp(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !isCalendarDate(match[1])) return false;
  if (+match[2] > 23 || +match[3] > 59 || +match[4] > 59) return false;
  if (match[5] !== 'Z') {
    const [hours, minutes] = match[5].slice(1).split(':').map(Number);
    if (hours > 23 || minutes > 59) return false;
  }
  return Number.isFinite(Date.parse(value));
}

/**
 * Append an independent event without advancing status or changing checklist items.
 * Portal events record a browser link click, not a successful page load or filing.
 * Provenance identifies a local report/click; institutional confirmation is not supported.
 */
export function appendCaseEvent(record, type, { at = new Date().toISOString(), provenance = 'user-reported' } = {}) {
  requireRecord(record);
  if (!EVENT_TYPES.includes(type)) throw new RangeError('Unsupported case event type.');
  if (!isTimestamp(at)) throw new RangeError('Event at must be a valid ISO timestamp with a timezone.');
  if (!['user-reported', 'browser-click'].includes(provenance)) {
    throw new RangeError('Event provenance must be user-reported or browser-click.');
  }
  const events = Array.isArray(record.events) ? record.events : [];
  const timeline = Array.isArray(record.timeline) ? record.timeline : [];
  const repeated = ['evidence-collected', 'portal-opened'].includes(type)
    && [...events, ...timeline].some((event) => event?.type === type);
  if (repeated) return { ...record, events: [...events], timeline: [...timeline] };

  const event = { type, at, provenance, label: LABELS[type], isInstitutionConfirmed: false };
  return {
    ...record,
    events: [...events, event],
    timeline: [...timeline, { ...event }]
  };
}

/** Store only the user's chosen reminder date; no official deadline is inferred. */
export function setFollowUp(record, date) {
  requireRecord(record);
  if (date !== '' && !isCalendarDate(date)) {
    throw new RangeError('Follow-up must be an actual calendar date in YYYY-MM-DD format.');
  }
  return { ...record, followUpDate: date };
}

/** Ambiguous records and unknown modes never cross the demo/local-real boundary. */
export function casesForMode(records, mode) {
  if (!Array.isArray(records)) throw new TypeError('Case records must be an array.');
  if (mode !== 'demo' && mode !== 'real') return [];
  return records.filter((record) => record != null && record.demo === (mode === 'demo'));
}
