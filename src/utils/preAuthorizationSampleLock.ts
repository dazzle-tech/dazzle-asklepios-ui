/**
 * Lab samples of a test that waits on pre-authorization (NPHIES coverage contracts) cannot be
 * collected, labelled or bulk collected. The backend sends preAuthorizationBlocked per test and
 * rejects the action itself (DiagnosticPreAuthorizationService).
 */
export const PRE_AUTHORIZATION_SAMPLE_LOCK_MESSAGE =
  'This test requires pre-authorization approval. Sample collection and barcode printing are not allowed until it is approved. Please contact the Finance Department.';

export const isSampleBlockedByPreAuthorization = (orderTest?: {
  preAuthorizationBlocked?: boolean | null;
} | null): boolean => orderTest?.preAuthorizationBlocked === true;
