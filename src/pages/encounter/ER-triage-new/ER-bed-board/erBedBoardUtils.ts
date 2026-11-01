import { calculateAgeFormat, formatEnumString } from '@/utils';

export const CTAS_LEVEL_BY_EMERGENCY: Record<string, number> = {
  RESUSCITATION: 1,
  EMERGENT: 2,
  URGENT: 3,
  LESS_URGENT: 4,
  NON_URGENT: 5
};

/** Standard CTAS physician-initial-assessment targets (minutes), matching board reference. */
export const CTAS_TARGET_MINUTES: Record<number, number> = {
  1: 0,
  2: 15,
  3: 30,
  4: 60,
  5: 120
};

export const CTAS_COLOR_VAR: Record<number, string> = {
  1: 'var(--ebb-c1)',
  2: 'var(--ebb-c2)',
  3: 'var(--ebb-c3)',
  4: 'var(--ebb-c4)',
  5: 'var(--ebb-c5)'
};

/**
 * Backend `DiagnosticStatus` values used on DiagnosticOrder.labStatus / radStatus
 * and DiagnosticOrderTest.processingStatus
 * (see patient-service DiagnosticStatus.java).
 */
const DIAG_STATUS_RANK: Record<string, number> = {
  PARTIALLY: 8,
  SAMPLE_REPEAT: 7,
  RESULT_REJECTED: 6,
  PATIENT_ARRIVED: 5,
  SAMPLE_COLLECTED: 5,
  ACCEPTED: 4,
  ALL_ACCEPTED: 4,
  EXAM_DONE: 3,
  RESULT_READY: 3,
  RESULT_APPROVED: 2,
  SUBMITTED: 2,
  NEW: 1,
  COMPLETED: 0,
  CANCELLED: -1,
  REJECTED: -1,
  ALL_REJECTED: -1
};

/** Still in the lab/rad workflow (excludes completed / cancelled / result-ready). */
const DIAG_PENDING = new Set([
  'NEW',
  'SUBMITTED',
  'ACCEPTED',
  'ALL_ACCEPTED',
  'SAMPLE_COLLECTED',
  'SAMPLE_REPEAT',
  'PATIENT_ARRIVED',
  'PARTIALLY',
  'RESULT_REJECTED'
]);

const DIAG_DONE = new Set([
  'COMPLETED',
  'RESULT_APPROVED',
  'RESULT_READY',
  'EXAM_DONE'
]);

const DIAG_PROGRESS = new Set([
  'ACCEPTED',
  'ALL_ACCEPTED',
  'SAMPLE_COLLECTED',
  'SAMPLE_REPEAT',
  'PATIENT_ARRIVED',
  'PARTIALLY',
  'RESULT_REJECTED'
]);

export const toDateSafe = (value: unknown): Date | null => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const formatBoardDuration = (ms: number): string => {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  return h ? `${h}h ${String(mm).padStart(2, '0')}m` : `${mm}m`;
};

/** LOS display: unknown timestamps must be "—", never 0m. */
export const formatLosOrDash = (elapsedMs: number | null | undefined): string => {
  if (elapsedMs == null || !Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return '—';
  }
  return formatBoardDuration(elapsedMs);
};

export const extractEncounterId = (value: any): number | null => {
  const raw =
    value?.encounterId ??
    value?.encounter?.id ??
    (typeof value?.encounter === 'number' || typeof value?.encounter === 'string'
      ? value.encounter
      : null);

  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && !Number.isNaN(n) ? n : null;
};

export const extractPatientId = (value: any): number | null => {
  const raw =
    value?.patientId ??
    value?.patient?.id ??
    (typeof value?.patient === 'number' || typeof value?.patient === 'string'
      ? value.patient
      : null);

  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && !Number.isNaN(n) ? n : null;
};

export const ctasFromEmergencyLevel = (level: unknown): number | null => {
  if (level == null || String(level).trim() === '') return null;
  const raw = String(level).trim().toUpperCase();
  if (CTAS_LEVEL_BY_EMERGENCY[raw] != null) return CTAS_LEVEL_BY_EMERGENCY[raw];
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1 && n <= 5) return n;
  return null;
};

export const buildPatientInitials = (patient: any): string => {
  const first = String(patient?.firstName ?? '').trim();
  const last = String(patient?.lastName ?? '').trim();
  if (first || last) {
    const fi = first ? `${first[0].toUpperCase()}.` : '';
    const li = last ? `${last[0].toUpperCase()}.` : '';
    return `${fi}${li}` || '—';
  }
  const full = String(patient?.fullName ?? '').trim();
  if (!full) return '—';
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return `${parts[0][0].toUpperCase()}.`;
  return `${parts[0][0].toUpperCase()}.${parts[parts.length - 1][0].toUpperCase()}.`;
};

export const buildAgeSex = (patient: any, ageFallback?: string | null): string => {
  const dob = patient?.dateOfBirth ?? patient?.dob ?? null;
  const age = ageFallback || (dob ? calculateAgeFormat(dob) : '') || '';
  const sex = formatEnumString(patient?.sexAtBirth) || '';
  const compactAge = String(age)
    .replace(/\s*years?\s*/i, '')
    .replace(/\s*yrs?\s*/i, '')
    .trim();
  const sexLetter = sex ? sex.charAt(0).toUpperCase() : '';
  return [compactAge, sexLetter].filter(Boolean).join(' ') || '—';
};

export const buildPatientFullName = (patient: any): string => {
  const v = String(patient?.fullName ?? '').trim();
  if (v) return v;
  return [patient?.firstName, patient?.secondName, patient?.thirdName, patient?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
};

export const pickDiagnosticStatus = (statuses: Array<string | null | undefined>): string | null => {
  let best: string | null = null;
  let bestRank = -2;
  statuses.forEach(s => {
    if (s == null || String(s).trim() === '') return;
    const key = String(s).toUpperCase();
    const rank = DIAG_STATUS_RANK[key] ?? -1;
    if (rank > bestRank) {
      bestRank = rank;
      best = key;
    }
  });
  return best;
};

/**
 * Matches DiagnosticOrderStatusService.resolveGroupStatus:
 * empty → null (no tests of that category);
 * one distinct processingStatus → that status;
 * mixed → PARTIALLY.
 */
export const aggregateGroupStatus = (
  statuses: Array<string | null | undefined>
): string | null => {
  const distinct = Array.from(
    new Set(
      statuses
        .filter(s => s != null && String(s).trim() !== '')
        .map(s => String(s).trim().toUpperCase())
    )
  );

  if (distinct.length === 0) return null;
  if (distinct.length === 1) return distinct[0];
  return 'PARTIALLY';
};

export const isCancelledDiagnosticTest = (test: {
  status?: string | null;
}): boolean => String(test?.status ?? '').toUpperCase() === 'CANCELLED';

export const isLaboratoryOrderType = (orderType: unknown): boolean =>
  String(orderType ?? '').toUpperCase() === 'LABORATORY';

export const isRadiologyOrderType = (orderType: unknown): boolean =>
  String(orderType ?? '').toUpperCase() === 'RADIOLOGY';

export const isDiagnosticPending = (status: string | null | undefined): boolean => {
  const key = String(status ?? '').toUpperCase();
  return DIAG_PENDING.has(key);
};

export const diagnosticStatusClass = (status: string | null | undefined): string => {
  const key = String(status ?? '').toUpperCase();
  if (DIAG_DONE.has(key)) return 'done';
  if (DIAG_PROGRESS.has(key)) return 'progress';
  if (key === 'NEW' || key === 'SUBMITTED') return 'ordered';
  return '';
};

export const matchesBoardSearch = (
  query: string,
  fields: Array<string | number | null | undefined>
): boolean => {
  const q = String(query ?? '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  return fields.some(f =>
    String(f ?? '')
      .toLowerCase()
      .includes(q)
  );
};

export const losTone = (
  elapsedMs: number | null | undefined
): '' | 'warn' | 'crit' => {
  if (elapsedMs == null || !Number.isFinite(elapsedMs)) return '';
  const mins = elapsedMs / 60000;
  if (mins >= 360) return 'crit';
  if (mins >= 240) return 'warn';
  return '';
};

export const formatPractitionerName = (p: any): string => {
  if (!p) return '—';
  const full = `${String(p.firstName ?? '').trim()} ${String(p.lastName ?? '').trim()}`.trim();
  if (full) return full.startsWith('Dr') || full.startsWith('dr') ? full : `Dr. ${full}`;
  return String(p.name ?? p.fullName ?? '—');
};

/**
 * Build encounter → {lab, rad} from order tests (Clinical Laboratory source of truth).
 * Prefer test.encounterId (enriched by backend filter). Fall back to orderId→encounter map.
 * optionalSingleEncounterId: when the request was scoped to exactly one occupied encounter
 * and mapping is still missing, attribute tests to that encounter (no cross-encounter risk).
 */
export const buildDiagMapFromTests = (
  tests: any[],
  orderIdToEncounterId: Map<string, string>,
  optionalSingleEncounterId?: string | null
): Map<string, { lab: string | null; rad: string | null }> => {
  const labByEncounter = new Map<string, string[]>();
  const radByEncounter = new Map<string, string[]>();
  const single =
    optionalSingleEncounterId != null &&
    String(optionalSingleEncounterId).trim() !== ''
      ? String(optionalSingleEncounterId)
      : null;

  (tests ?? []).forEach(test => {
    if (isCancelledDiagnosticTest(test)) return;

    const orderId = test?.orderId;
    const fromTest = extractEncounterId(test);
    const fromOrder =
      orderId != null
        ? orderIdToEncounterId.get(String(orderId))
        : undefined;
    const encounterKey =
      (fromTest != null ? String(fromTest) : null) ||
      fromOrder ||
      single ||
      null;

    if (!encounterKey) return;

    const processing = test?.processingStatus;
    if (processing == null || String(processing).trim() === '') return;

    if (isLaboratoryOrderType(test?.orderType)) {
      const arr = labByEncounter.get(encounterKey) ?? [];
      arr.push(String(processing));
      labByEncounter.set(encounterKey, arr);
      return;
    }

    if (isRadiologyOrderType(test?.orderType)) {
      const arr = radByEncounter.get(encounterKey) ?? [];
      arr.push(String(processing));
      radByEncounter.set(encounterKey, arr);
    }
  });

  const next = new Map<string, { lab: string | null; rad: string | null }>();
  const keys = new Set([...labByEncounter.keys(), ...radByEncounter.keys()]);

  keys.forEach(key => {
    next.set(key, {
      lab: aggregateGroupStatus(labByEncounter.get(key) ?? []),
      rad: aggregateGroupStatus(radByEncounter.get(key) ?? [])
    });
  });

  return next;
};

/** Fallback when tests are unavailable: use order.labStatus/radStatus only when present. */
export const buildDiagMapFromOrders = (
  orders: any[],
  encounterIdSet: Set<string>
): Map<string, { lab: string | null; rad: string | null }> => {
  const labByEncounter = new Map<string, string[]>();
  const radByEncounter = new Map<string, string[]>();

  (orders ?? []).forEach(order => {
    const eid = extractEncounterId(order);
    if (eid == null) return;

    const key = String(eid);
    if (!encounterIdSet.has(key)) return;

    // Drafts with no submitted workflow still expose NEW lab/rad defaults — skip
    // those so Lab/Rad stay "—" until real tests exist (test path is preferred).
    if (order?.saveDraft === true) return;

    if (order?.labStatus != null && String(order.labStatus).trim() !== '') {
      const arr = labByEncounter.get(key) ?? [];
      arr.push(String(order.labStatus));
      labByEncounter.set(key, arr);
    }

    if (order?.radStatus != null && String(order.radStatus).trim() !== '') {
      const arr = radByEncounter.get(key) ?? [];
      arr.push(String(order.radStatus));
      radByEncounter.set(key, arr);
    }
  });

  const next = new Map<string, { lab: string | null; rad: string | null }>();
  const keys = new Set([...labByEncounter.keys(), ...radByEncounter.keys()]);

  keys.forEach(key => {
    next.set(key, {
      // Prefer group aggregation so mixed orders become PARTIALLY (same as backend).
      lab: aggregateGroupStatus(labByEncounter.get(key) ?? []),
      rad: aggregateGroupStatus(radByEncounter.get(key) ?? [])
    });
  });

  return next;
};
