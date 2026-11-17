import React from 'react';
import Translate from '@/components/Translate';

export const EMPTY_VALUE = '—';

const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PROPOSED: 'Proposed',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const planStatusLabel = (status?: string | null) =>
  PLAN_STATUS_LABELS[status || ''] || status || EMPTY_VALUE;

export const isGroupedScope = (scope?: string | null) =>
  scope === 'UPPER_ARCH' ||
  scope === 'LOWER_ARCH' ||
  scope === 'FULL_MOUTH';

export const isCompleted = (row: any) =>
  row?.status === 'COMPLETED' ||
  Boolean(row?.patientServiceAndProductId);

export const isInProgress = (row: any) =>
  row?.status === 'IN_PROGRESS' && !isCompleted(row);

export const isExistingDocumentation = (row: any) => row?.existing === true;

export const formatDate = (value?: string | null, includeTime = false) => {
  if (!value) return EMPTY_VALUE;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE;

  return includeTime
    ? date.toLocaleString()
    : date.toLocaleDateString();
};

const normalizeNumber = (value: any): number | null => {
  if (value === '' || value === null || value === undefined) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const moneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const formatMoney = (value: any) => {
  const number = normalizeNumber(value);
  return number == null ? EMPTY_VALUE : moneyFormatter.format(number);
};

/** Unit price × quantity − absolute discount (once per line). */
export const lineNetTotal = (
  unitPrice: any,
  quantity: any,
  discountAmount: any
): number | null => {
  const price = normalizeNumber(unitPrice);
  const qty = normalizeNumber(quantity);
  const discount = normalizeNumber(discountAmount) ?? 0;
  if (price == null || qty == null || qty <= 0) return null;
  return Math.round((price * qty - discount) * 100) / 100;
};

export const formatLineNet = (
  unitPrice: any,
  quantity: any,
  discountAmount: any
) => formatMoney(lineNetTotal(unitPrice, quantity, discountAmount));

/**
 * UI validation for planned treatment line net (unit × qty − discount).
 * Returns an error message, or null when valid.
 */
export const validateTreatmentFinancials = (
  unitPrice: any,
  quantity: any,
  discountAmount: any
): string | null => {
  const price = normalizeNumber(unitPrice);
  const qty = normalizeNumber(quantity);
  const discount = normalizeNumber(discountAmount) ?? 0;

  if (price == null || price < 0) {
    return 'Unit Price must be zero or greater';
  }
  if (qty == null || !Number.isInteger(qty) || qty <= 0) {
    return 'Quantity must be a positive number of billable units';
  }
  if (discount < 0) {
    return 'Discount Amount cannot be negative';
  }
  const gross = Math.round(price * qty * 100) / 100;
  if (discount > gross) {
    return 'Discount Amount cannot exceed Unit Price × Quantity';
  }
  return null;
};

export const treatmentRowKey = (row: any) => {
  if (row?._sessionHeader) {
    return `session-${row.visitNumber ?? 'none'}`;
  }

  if (isExistingDocumentation(row)) {
    return `existing-action-${row.toothActionId ?? row.id ?? 'unknown'}`;
  }

  return row?.id != null
    ? `plan-${row.id}`
    : `plan-row-${row?.toothActionId ?? 'unknown'}`;
};

export const sortTreatments = (rows: any[]) =>
  [...rows].sort((a, b) => {
    const sessionDifference =
      (a.visitNumber ?? Number.MAX_SAFE_INTEGER) -
      (b.visitNumber ?? Number.MAX_SAFE_INTEGER);

    return (
      sessionDifference ||
      (a.id ?? a.toothActionId ?? 0) -
        (b.id ?? b.toothActionId ?? 0)
    );
  });

export const groupTreatmentRows = (
  planTreatments: any[],
  existingDocumentation: any[],
  showExistingDocumentation: boolean
) => {
  const seen = new Set<string>();
  const source = showExistingDocumentation
    ? [...planTreatments, ...existingDocumentation]
    : planTreatments;
  const rows = sortTreatments(source).filter(row => {
    const key = treatmentRowKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const result: any[] = [];
  let previousSession: string | number | undefined;

  rows.forEach(row => {
    const session = row.visitNumber ?? 'none';

    if (session !== previousSession) {
      result.push({
        _sessionHeader: true,
        _rowKey: `session-${session}`,
        visitNumber: row.visitNumber ?? null,
        id: `session-${session}`
      });
      previousSession = session;
    }

    result.push({
      ...row,
      _rowKey: treatmentRowKey(row)
    });
  });

  return result;
};

export const PlanProgress = ({ plan }: { plan: any }) => {
  const completed = Number(plan.completedTreatments ?? 0);
  const total = Number(plan.activeTreatments ?? 0);

  return (
    <span className="tp-progress-simple">
      {completed} / {total}
    </span>
  );
};

export const PlanStatus = ({ status }: { status?: string | null }) => (
  <span
    className={`tp-plan-status tp-plan-status--${String(
      status || 'unknown'
    ).toLowerCase()}`}
  >
    <span className="tp-status-dot" aria-hidden="true" />
    <Translate>{planStatusLabel(status)}</Translate>
  </span>
);
