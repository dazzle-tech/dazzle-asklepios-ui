import type { ClaimTrackingItemResponse, ClaimTrackingResponse } from '@/types/model-types-new';
import type { Filters } from './types';

export const getStatusColor = (status?: string | null) => {
  const normalized = String(status ?? '').toUpperCase();

  if (normalized === 'ACCEPTED' || normalized === 'SUBMITTED') return '#16a34a';
  if (normalized === 'REJECTED' || normalized === 'FAILED') return '#dc2626';
  if (normalized === 'SUBMITTING' || normalized === 'DRAFT') return '#d97706';

  return '#2563eb';
};

export const formatMoney = (value: unknown) => {
  if (value == null || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const getClaimItems = (row: ClaimTrackingResponse): ClaimTrackingItemResponse[] =>
  Array.isArray(row.items) ? row.items : [];

const contains = (value: unknown, search: unknown) =>
  String(value ?? '')
    .toLowerCase()
    .includes(String(search ?? '').toLowerCase());

export const filterClaimRows = (
  rows: ClaimTrackingResponse[],
  filters: Filters
): ClaimTrackingResponse[] => {
  return rows.filter(row => {
    if (filters.status && String(row.status ?? '').toUpperCase() !== filters.status.toUpperCase()) {
      return false;
    }
    if (filters.claimType && String(row.claimType ?? '').toUpperCase() !== filters.claimType.toUpperCase()) {
      return false;
    }
    if (
      filters.claimSubType &&
      String(row.claimSubType ?? '').toUpperCase() !== filters.claimSubType.toUpperCase()
    ) {
      return false;
    }
    if (filters.claimReference && !contains(row.claimReference, filters.claimReference)) {
      return false;
    }
    if (filters.provClaimNo && !contains(row.provClaimNo, filters.provClaimNo)) {
      return false;
    }
    if (filters.uploadName && !contains(row.uploadName, filters.uploadName)) {
      return false;
    }
    if (filters.preAuthRefNo && !contains(row.preAuthRefNo, filters.preAuthRefNo)) {
      return false;
    }
    if (filters.encounterId && !contains(row.encounterId, filters.encounterId)) {
      return false;
    }
    if (filters.patientId && !contains(row.patientId, filters.patientId)) {
      return false;
    }
    return true;
  });
};
