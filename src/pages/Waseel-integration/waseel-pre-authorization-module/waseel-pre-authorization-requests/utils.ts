import type { Filters } from './types';
import type {
  PreAuthorizationTrackingItemResponse,
  PreAuthorizationTrackingResponse
} from '@/types/model-types-new';

export const getStatusColor = (status?: string | null) => {
  const normalized = String(status ?? '').toUpperCase();

  if (normalized.includes('APPROVED') || normalized.includes('SUBMITTED')) return '#28a745';
  if (normalized.includes('REJECTED') || normalized.includes('FAILED')) return '#dc3545';
  if (normalized.includes('CANCEL')) return '#6c757d';
  if (normalized.includes('SUBMITTING') || normalized.includes('PENDING')) return '#ffc107';

  return '#007bff';
};

const contains = (value: unknown, search: unknown) =>
  String(value ?? '').toLowerCase().includes(String(search ?? '').toLowerCase());

export const getPreAuthItems = (
  row: PreAuthorizationTrackingResponse
): PreAuthorizationTrackingItemResponse[] =>
  Array.isArray(row.items) ? row.items : [];

export const joinItemField = (
  row: PreAuthorizationTrackingResponse,
  picker: (item: PreAuthorizationTrackingItemResponse) => unknown,
  fallback = '-'
) => {
  const values = getPreAuthItems(row)
    .map(picker)
    .map(value => String(value ?? '').trim())
    .filter(Boolean);

  return values.length ? values.join(', ') : fallback;
};

export const formatMoney = (value: unknown) => {
  if (value == null || value === '') return '-';
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : String(value);
};

export const filterPreAuthorizationRows = (
  rows: PreAuthorizationTrackingResponse[],
  appliedFilters: Filters
) =>
  rows.filter(row => {
    if (appliedFilters.preAuthId && !contains(row.id, appliedFilters.preAuthId)) return false;

    if (
      appliedFilters.approvalNumber &&
      !contains(row.approvalRequestId ?? row.preAuthRefNo, appliedFilters.approvalNumber)
    ) {
      return false;
    }

    if (appliedFilters.encounterId && !contains(row.encounterId, appliedFilters.encounterId)) {
      return false;
    }

    if (appliedFilters.patientId && !contains(row.patientId, appliedFilters.patientId)) {
      return false;
    }

    if (
      appliedFilters.patientInsuranceId &&
      !contains(row.patientInsuranceId, appliedFilters.patientInsuranceId)
    ) {
      return false;
    }

    if (appliedFilters.status && row.status !== appliedFilters.status) return false;
    if (appliedFilters.outcome && row.outcome !== appliedFilters.outcome) return false;

    if (
      appliedFilters.requestDateFrom &&
      row.dateOrdered &&
      row.dateOrdered < appliedFilters.requestDateFrom
    ) {
      return false;
    }

    if (
      appliedFilters.requestDateTo &&
      row.dateOrdered &&
      row.dateOrdered > appliedFilters.requestDateTo
    ) {
      return false;
    }

    return true;
  });

export const canCancelPreAuthorization = (row: PreAuthorizationTrackingResponse) =>
  !!row.approvalRequestId &&
  !row.isCancelled &&
  !['CANCELLED', 'REJECTED', 'FAILED'].includes(String(row.status ?? '').toUpperCase());
