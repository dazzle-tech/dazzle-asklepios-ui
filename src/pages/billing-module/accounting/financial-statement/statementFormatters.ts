import { formatBillingEnum, formatBillingTimestamp, formatMoney } from '../utils/billingAccountingUtils';

export const dash = (value?: string | number | null): string => {
  if (value == null) return '-';
  const text = String(value).trim();
  return text.length ? text : '-';
};

export const money = (amount?: number | null, currency = 'SAR'): string =>
  formatMoney(amount, currency);

export const timestamp = (value?: string | null): string =>
  formatBillingTimestamp(value);

export const statusLabel = (value?: string | null): string => {
  const normalized = String(value ?? '').trim().toUpperCase();

  const labels: Record<string, string> = {
    SETTLED: 'Settled',
    INSURANCE_PENDING: 'Insurance pending',
    PATIENT_UNPAID: 'Patient unpaid',
    PARTIALLY_SETTLED: 'Partially Settled',
    FULLY_SETTLED: 'Fully Settled',
    UNPAID: 'Unpaid',
    PARTIALLY_PAID: 'Partially Paid',
    FULLY_PAID: 'Fully Paid',
    NOT_SUBMITTED: 'Not Submitted',
    SUBMITTED: 'Submitted',
    PENDING_PAYMENT: 'Pending Payment',
    REJECTED: 'Rejected',
    DRAFT: 'Draft',
    FINALIZED: 'Finalized',
    CANCELLED: 'Cancelled',
    ACCEPTED: 'Accepted',
    SUCCESS: 'Success',
    COMPLETED: 'Success',
    REFUNDED: 'Refunded'
  };

  return labels[normalized] ?? formatBillingEnum(value);
};

export const statusTone = (
  value?: string | null
): 'neutral' | 'info' | 'success' | 'warning' | 'danger' => {
  const normalized = String(value ?? '').trim().toUpperCase();

  if (['SETTLED', 'FULLY_SETTLED', 'FULLY_PAID', 'FINALIZED', 'COMPLETED', 'SUCCESS', 'ACCEPTED'].includes(normalized)) {
    return 'success';
  }
  if (['INSURANCE_PENDING', 'SUBMITTED', 'PENDING_PAYMENT', 'DRAFT'].includes(normalized)) {
    return 'info';
  }
  if (['PARTIALLY_SETTLED', 'PARTIALLY_PAID', 'PATIENT_UNPAID'].includes(normalized)) {
    return 'warning';
  }
  if (['REJECTED', 'CANCELLED', 'UNPAID'].includes(normalized)) {
    return 'danger';
  }
  return 'neutral';
};
