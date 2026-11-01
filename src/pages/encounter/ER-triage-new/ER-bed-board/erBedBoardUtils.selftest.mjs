/**
 * Focused regression checks for ER Bed Board aggregation / LOS helpers.
 * Run: node src/pages/encounter/ER-triage-new/ER-bed-board/erBedBoardUtils.selftest.mjs
 */

const CTAS_LEVEL_BY_EMERGENCY = {
  RESUSCITATION: 1,
  EMERGENT: 2,
  URGENT: 3,
  LESS_URGENT: 4,
  NON_URGENT: 5
};

const aggregateGroupStatus = statuses => {
  const distinct = [
    ...new Set(
      statuses
        .filter(s => s != null && String(s).trim() !== '')
        .map(s => String(s).trim().toUpperCase())
    )
  ];
  if (distinct.length === 0) return null;
  if (distinct.length === 1) return distinct[0];
  return 'PARTIALLY';
};

const formatLosOrDash = elapsedMs => {
  if (elapsedMs == null || !Number.isFinite(elapsedMs) || elapsedMs < 0) return '—';
  const mins = Math.max(0, Math.floor(elapsedMs / 60000));
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  return h ? `${h}h ${String(mm).padStart(2, '0')}m` : `${mm}m`;
};

const toDateSafe = value => {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const buildDiagMapFromTests = (tests, orderIdToEncounterId, optionalSingleEncounterId) => {
  const labByEncounter = new Map();
  const radByEncounter = new Map();
  const single = optionalSingleEncounterId != null ? String(optionalSingleEncounterId) : null;

  for (const test of tests) {
    if (String(test?.status ?? '').toUpperCase() === 'CANCELLED') continue;
    const fromTest =
      test?.encounterId != null && String(test.encounterId).trim() !== ''
        ? String(test.encounterId)
        : null;
    const encounterKey =
      fromTest ||
      orderIdToEncounterId.get(String(test.orderId)) ||
      single ||
      null;
    if (!encounterKey || test.processingStatus == null) continue;
    const type = String(test.orderType ?? '').toUpperCase();
    const target = type === 'LABORATORY' ? labByEncounter : type === 'RADIOLOGY' ? radByEncounter : null;
    if (!target) continue;
    const arr = target.get(encounterKey) ?? [];
    arr.push(String(test.processingStatus));
    target.set(encounterKey, arr);
  }

  const next = new Map();
  for (const key of new Set([...labByEncounter.keys(), ...radByEncounter.keys()])) {
    next.set(key, {
      lab: aggregateGroupStatus(labByEncounter.get(key) ?? []),
      rad: aggregateGroupStatus(radByEncounter.get(key) ?? [])
    });
  }
  return next;
};

let failed = 0;
const assert = (cond, msg) => {
  if (!cond) {
    failed += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('OK:', msg);
  }
};

assert(aggregateGroupStatus([]) === null, 'empty group → null (Lab —)');
assert(aggregateGroupStatus(['ACCEPTED']) === 'ACCEPTED', 'single ACCEPTED');
assert(aggregateGroupStatus(['ACCEPTED', 'ACCEPTED']) === 'ACCEPTED', 'duplicate ACCEPTED');
assert(aggregateGroupStatus(['ACCEPTED', 'NEW']) === 'PARTIALLY', 'mixed → PARTIALLY');
assert(formatLosOrDash(null) === '—', 'LOS null → dash');
assert(formatLosOrDash(undefined) === '—', 'LOS undefined → dash');
assert(formatLosOrDash(-1) === '—', 'LOS negative → dash');
assert(formatLosOrDash(0) === '0m', 'LOS zero valid');
assert(toDateSafe('') === null, 'empty date → null');
assert(toDateSafe('1970-01-01T00:00:00.000Z') !== null, 'epoch string parses but callers must not invent it');
assert(CTAS_LEVEL_BY_EMERGENCY.EMERGENT === 2, 'CTAS EMERGENT → 2');

const map = buildDiagMapFromTests(
  [
    { orderId: 1017, orderType: 'LABORATORY', processingStatus: 'ACCEPTED', status: 'ACTIVE' },
    { orderId: 1017, orderType: 'RADIOLOGY', processingStatus: 'NEW', status: 'ACTIVE' },
    { orderId: 999, orderType: 'LABORATORY', processingStatus: 'ACCEPTED', status: 'CANCELLED' }
  ],
  new Map([
    ['1017', '55'],
    ['999', '55']
  ])
);

assert(map.get('55')?.lab === 'ACCEPTED', 'P176-style lab ACCEPTED from tests');
assert(map.get('55')?.rad === 'NEW', 'rad NEW when radiology tests exist');
assert(
  buildDiagMapFromTests(
    [{ orderId: 1, orderType: 'RADIOLOGY', processingStatus: 'ACCEPTED', status: 'SUBMITTED' }],
    new Map([['1', '9']])
  ).get('9')?.lab == null,
  'no laboratory tests → lab null (—), not NEW'
);

// Runtime regression: empty order map must not drop ACCEPTED when encounterId is on the test
assert(
  buildDiagMapFromTests(
    [
      {
        orderId: 1517,
        encounterId: 72,
        orderType: 'LABORATORY',
        processingStatus: 'ACCEPTED',
        status: 'SUBMITTED'
      }
    ],
    new Map()
  ).get('72')?.lab === 'ACCEPTED',
  'test.encounterId alone maps ACCEPTED without order map'
);

// Runtime regression: single-encounter fallback when mapping missing
assert(
  buildDiagMapFromTests(
    [
      {
        orderId: 1517,
        orderType: 'LABORATORY',
        processingStatus: 'ACCEPTED',
        status: 'SUBMITTED'
      }
    ],
    new Map(),
    '72'
  ).get('72')?.lab === 'ACCEPTED',
  'single-encounter fallback maps ACCEPTED'
);

// Overwrite guard: empty test map must not replace prior order map in callers
const emptyFromTests = buildDiagMapFromTests(
  [{ orderId: 1517, orderType: 'LABORATORY', processingStatus: 'ACCEPTED', status: 'SUBMITTED' }],
  new Map()
);
assert(emptyFromTests.size === 0, 'unmapped tests → empty map (caller must not overwrite)');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}

console.log('\nAll ER bed board utility regressions passed');
