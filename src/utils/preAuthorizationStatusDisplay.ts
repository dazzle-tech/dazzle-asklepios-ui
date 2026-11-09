/**
 * One color per pre-authorization outcome, shared by the pre-authorization screen,
 * diagnostic order tables and lab screens. Colors are dark enough to stay readable on the
 * light badge background (MyBadgeStatus tints the background with the same color).
 */
export const PRE_AUTHORIZATION_STATUS_COLORS = {
  approved: '#1e8e3e',
  partial: '#6f42c1',
  pending: '#b26a00',
  submitted: '#1565c0',
  rejected: '#d32f2f',
  cancelled: '#6c757d',
  other: '#546e7a'
} as const;

export const getPreAuthorizationStatusColor = (status?: string | null): string => {
  const normalized = String(status ?? '').toUpperCase();

  if (normalized.includes('CANCEL')) return PRE_AUTHORIZATION_STATUS_COLORS.cancelled;
  if (
    normalized.includes('REJECT') ||
    normalized.includes('DENIED') ||
    normalized.includes('FAIL') ||
    normalized.includes('ERROR')
  ) {
    return PRE_AUTHORIZATION_STATUS_COLORS.rejected;
  }
  if (normalized.includes('PARTIAL')) return PRE_AUTHORIZATION_STATUS_COLORS.partial;
  if (normalized.includes('APPROVED') || normalized.includes('COMPLETE')) {
    return PRE_AUTHORIZATION_STATUS_COLORS.approved;
  }
  if (normalized.includes('PEND') || normalized.includes('SUBMITTING') || normalized.includes('QUEUE')) {
    return PRE_AUTHORIZATION_STATUS_COLORS.pending;
  }
  if (normalized.includes('SUBMITTED')) return PRE_AUTHORIZATION_STATUS_COLORS.submitted;

  return PRE_AUTHORIZATION_STATUS_COLORS.other;
};

/** PENDING_APPROVAL → "Pending Approval". */
export const formatPreAuthorizationStatus = (status?: string | null): string =>
  String(status ?? '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
