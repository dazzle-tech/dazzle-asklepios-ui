/**
 * Resolves the clinical workflow status from an encounter payload.
 * Supports both the new treatmentStatus field and legacy status.
 */
export const getEncounterTreatmentStatus = (
  encounter: { treatmentStatus?: string | null; status?: string | null } | null | undefined
): string => String(encounter?.treatmentStatus ?? encounter?.status ?? '').toUpperCase();

const LIFECYCLE_STATUSES = new Set([
  'OPEN',
  'IN_PROGRESS',
  'CLOSED',
  'CANCELLED'
]);

/** Mirrors PatientEncounter.computeEncounterStatus in patient-service. */
const mapTreatmentStatusToLifecycle = (
  treatmentStatus: string
): string | null => {
  switch (treatmentStatus) {
    case 'NEW':
    case 'PENDING_PAYMENT':
    case 'WAITING_TRIAGE':
      return 'OPEN';
    case 'TRIAGE_STARTED':
    case 'ASSIGNED_TO_BED':
    case 'ONGOING':
      return 'IN_PROGRESS';
    case 'COMPLETED':
    case 'CLOSED':
    case 'DISCHARGED':
      return 'CLOSED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return null;
  }
};

/**
 * Resolves the high-level encounter lifecycle status (OPEN / IN_PROGRESS / CLOSED / CANCELLED).
 * Falls back to treatment-status mapping when encounterStatus is missing or stores a legacy value.
 */
export const getEncounterLifecycleStatus = (
  encounter:
    | {
        encounterStatus?: string | null;
        treatmentStatus?: string | null;
        status?: string | null;
      }
    | null
    | undefined
): string => {
  const encounterStatus = String(encounter?.encounterStatus ?? '').toUpperCase();

  if (encounterStatus && LIFECYCLE_STATUSES.has(encounterStatus)) {
    return encounterStatus;
  }

  const mappedFromEncounterStatus =
    mapTreatmentStatusToLifecycle(encounterStatus);
  if (mappedFromEncounterStatus) {
    return mappedFromEncounterStatus;
  }

  const mappedFromTreatment = mapTreatmentStatusToLifecycle(
    getEncounterTreatmentStatus(encounter)
  );
  if (mappedFromTreatment) {
    return mappedFromTreatment;
  }

  return encounterStatus;
};

/** Treatment statuses that collapse to OPEN — hide redundant badge in billing UI. */
const TREATMENT_STATUSES_MAPPED_TO_OPEN = new Set([
  'NEW',
  'PENDING_PAYMENT',
  'WAITING_TRIAGE'
]);

/** Show clinical treatment badge only when it adds detail beyond lifecycle status. */
export const shouldShowEncounterTreatmentStatus = (
  encounter:
    | {
        encounterStatus?: string | null;
        treatmentStatus?: string | null;
        status?: string | null;
      }
    | null
    | undefined
): boolean => {
  const treatmentStatus = getEncounterTreatmentStatus(encounter);
  if (!treatmentStatus) {
    return false;
  }

  const lifecycleStatus = getEncounterLifecycleStatus(encounter);
  return !(
    lifecycleStatus === 'OPEN' &&
    TREATMENT_STATUSES_MAPPED_TO_OPEN.has(treatmentStatus)
  );
};

/** Treatment statuses where the visit was already started and start API should not be called again. */
const STARTED_TREATMENT_STATUSES = new Set([
  'ONGOING',
  'TRIAGE_STARTED',
  'IN_OPERATION',
  'WAITING_TRIAGE',
  'WAITING_LIST',
  'CONFIRM_RETURN',
  'TEMP_DC',
  'SENT_TO_ER',
  'PENDING_PAYMENT'
]);

/**
 * Returns true when the encounter visit is already in progress and re-opening should not call /start again.
 */
export const shouldSkipEncounterStart = (
  encounter: { treatmentStatus?: string | null; status?: string | null; encounterStatus?: string | null } | null | undefined
): boolean => {
  const treatmentStatus = getEncounterTreatmentStatus(encounter);
  if (STARTED_TREATMENT_STATUSES.has(treatmentStatus)) {
    return true;
  }
  return getEncounterLifecycleStatus(encounter) === 'IN_PROGRESS';
};

/** Backend may still return alreadyOngoing on older deployments — treat as success when re-opening. */
export const isEncounterAlreadyOngoingError = (error: unknown): boolean => {
  const err = error as { data?: { message?: string; properties?: { message?: string } } };
  const message = String(
    err?.data?.message ?? err?.data?.properties?.message ?? ''
  ).toLowerCase();
  return message.includes('encounter.alreadyongoing') || message.includes('already ongoing');
};
