/**
 * The backend blocks starting triage or a doctor visit while a default service of an
 * NPHIES-contract visit waits on pre-authorization (EncounterPreAuthorizationGuardService).
 */
export const PRE_AUTHORIZATION_VISIT_LOCK_KEY = 'error.encounter.preAuthorizationPending';

export const PRE_AUTHORIZATION_VISIT_LOCK_MESSAGE =
  'This visit requires pre-authorization approval before it can start. Please contact the Finance Department.';

export const isPreAuthorizationVisitLockError = (error: unknown): boolean => {
  const data = (error as { data?: { messageKey?: string } } | null)?.data;
  return data?.messageKey === PRE_AUTHORIZATION_VISIT_LOCK_KEY;
};
