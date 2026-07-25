/**
 * Resolves the clinical workflow status from an encounter payload.
 * Supports both the new treatmentStatus field and legacy status.
 */
export const getEncounterTreatmentStatus = (
  encounter: { treatmentStatus?: string | null; status?: string | null } | null | undefined
): string => String(encounter?.treatmentStatus ?? encounter?.status ?? '').toUpperCase();

/**
 * Resolves the high-level encounter lifecycle status (OPEN / IN_PROGRESS / CLOSED / CANCELLED).
 */
export const getEncounterLifecycleStatus = (
  encounter: { encounterStatus?: string | null } | null | undefined
): string => String(encounter?.encounterStatus ?? '').toUpperCase();

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
