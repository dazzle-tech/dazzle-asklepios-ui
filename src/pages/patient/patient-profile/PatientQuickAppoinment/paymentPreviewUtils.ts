import type { EncounterBillingItemSummary, EncounterBillingSummary } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';

export type PreviewServiceRow = {
  serviceId: number;
  serviceType: string;
  serviceName: string;
  selected: boolean;
  isExempted: boolean;
  quantity: number;
  sequence: number;
  setupPrice?: number | null;
  calculatedPrice?: number | null;
  priceSource?: string | null;
  priceListItemCode?: string | null;
  patientShare?: number | null;
  insuranceShare?: number | null;
};

export type PreviewBillingTotals = {
  grossAmount: number;
  discountAmount: number;
  exemptionAmount: number;
  taxAmount: number;
  netAmount: number;
  patientResponsibilityAmount: number;
  insuranceResponsibilityAmount: number;
  patientOutstandingAmount: number;
  isPreview: boolean;
};

const toAmount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isGenericItemLabel = (
  name: string | null | undefined,
  billingItemType: string | null | undefined
): boolean => {
  const normalized = String(name ?? '').trim().toUpperCase();
  if (!normalized) {
    return true;
  }

  const typeNormalized = String(
    billingItemType ?? ''
  )
    .trim()
    .toUpperCase();

  return (
    normalized === typeNormalized ||
    normalized === 'SERVICE' ||
    normalized === 'CONSULTATION'
  );
};

/** Technical codes such as SERVICE-1500 or MEDICATION - 172 are not display names. */
export const isTechnicalBillingLabel = (
  value: string | null | undefined,
  billingItemType?: string | null | undefined
): boolean => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (!normalized) {
    return true;
  }

  if (isGenericItemLabel(value, billingItemType)) {
    return true;
  }

  if (/^[A-Z][A-Z0-9_]*-\d+$/.test(normalized)) {
    return true;
  }

  if (/^[A-Z][A-Z0-9_]*\s*-\s*\d+$/.test(normalized)) {
    return true;
  }

  return false;
};

export const resolveBillingItemName = (
  item: EncounterBillingItemSummary,
  serviceRows: PreviewServiceRow[] = []
): string => {
  const matchedService = serviceRows.find(
    row => row.serviceId === item.sourceId
  );

  if (
    item.itemName &&
    !isTechnicalBillingLabel(
      item.itemName,
      item.billingItemType
    )
  ) {
    return item.itemName.trim();
  }

  if (matchedService?.serviceName?.trim()) {
    return matchedService.serviceName.trim();
  }

  if (
    item.itemCode?.trim() &&
    !isTechnicalBillingLabel(
      item.itemCode,
      item.billingItemType
    )
  ) {
    return item.itemCode.trim();
  }

  if (
    item.itemName?.trim() &&
    !isTechnicalBillingLabel(
      item.itemName,
      item.billingItemType
    )
  ) {
    return item.itemName.trim();
  }

  return '-';
};

export const formatBillingItemType = (
  billingItemType: string | null | undefined
): string =>
  formatEnumString(
    String(billingItemType ?? '')
  ) || '-';

const SETTLED_CHARGE_STATUSES = new Set([
  'ALLOCATED',
  'CLOSED',
  'FULLY_ALLOCATED',
  'CANCELLED',
  'REVERSED'
]);

export const hasCalculatedSummary = (
  summary: EncounterBillingSummary | null | undefined
): boolean => (summary?.items ?? []).length > 0 || toAmount(summary?.netAmount) > 0;

export const isChargeLineSettled = (
  item: EncounterBillingItemSummary
): boolean => {
  const outstanding = toAmount(item.outstandingAmount);
  if (outstanding > 0) {
    return false;
  }

  const status = String(item.status ?? '').toUpperCase();
  if (
    status === 'OPEN' ||
    status === 'PARTIAL' ||
    status === 'PARTIALLY_ALLOCATED' ||
    status === 'PARTIALLY_PAID'
  ) {
    return false;
  }

  return SETTLED_CHARGE_STATUSES.has(status);
};

export const getLineDueAmount = (
  item: EncounterBillingItemSummary
): number => {
  const outstanding = toAmount(item.outstandingAmount);
  if (outstanding > 0) {
    return outstanding;
  }

  if (isChargeLineSettled(item)) {
    return 0;
  }

  return Math.max(
    0,
    toAmount(item.patientResponsibilityAmount) -
      toAmount(item.allocatedAmount) -
      toAmount(item.reservedAmount)
  );
};

export const getUnpaidSummaryItems = (
  summary: EncounterBillingSummary
): EncounterBillingItemSummary[] =>
  (summary.items ?? []).filter(
    item => getLineDueAmount(item) > 0
  );

export const resolvePatientOutstandingAmount = (
  summary: EncounterBillingSummary | null | undefined
): number => {
  if (!summary) {
    return 0;
  }

  const headerOutstanding = toAmount(
    summary.patientOutstandingAmount
  );

  const lineOutstanding = (summary.items ?? []).reduce(
    (total, item) => total + getLineDueAmount(item),
    0
  );

  return Math.max(headerOutstanding, lineOutstanding);
};

export const isEncounterFullyPaid = (
  summary: EncounterBillingSummary | null | undefined
): boolean => {
  if (!hasCalculatedSummary(summary)) {
    return false;
  }

  return resolvePatientOutstandingAmount(summary) <= 0;
};

export const isDefaultServicePayable = (
  serviceId: number,
  summary: EncounterBillingSummary
): boolean => {
  const billed = (summary.items ?? []).find(
    item => item.sourceId === serviceId
  );

  if (!billed) {
    return true;
  }

  return getLineDueAmount(billed) > 0;
};

export const filterPayableServiceRows = <T extends PreviewServiceRow>(
  rows: T[],
  summary: EncounterBillingSummary
): T[] =>
  rows.filter(row => isDefaultServicePayable(row.serviceId, summary));

export const computePreviewBillingTotals = (
  summary: EncounterBillingSummary,
  selectedRows: PreviewServiceRow[],
  isInsurance: boolean
): PreviewBillingTotals => {
  if (hasCalculatedSummary(summary)) {
    const outstandingAmount =
      resolvePatientOutstandingAmount(summary);

    return {
      grossAmount: toAmount(summary.grossAmount),
      discountAmount: toAmount(summary.discountAmount),
      exemptionAmount: toAmount(summary.exemptionAmount),
      taxAmount: toAmount(summary.taxAmount),
      netAmount: toAmount(summary.netAmount),
      patientResponsibilityAmount: toAmount(summary.patientResponsibilityAmount),
      insuranceResponsibilityAmount: toAmount(summary.insuranceResponsibilityAmount),
      patientOutstandingAmount: outstandingAmount,
      isPreview: false
    };
  }

  let grossAmount = 0;
  let exemptionAmount = 0;
  let patientResponsibilityAmount = 0;
  let insuranceResponsibilityAmount = 0;

  selectedRows.forEach(row => {
    const unitPrice = toAmount(row.calculatedPrice ?? row.setupPrice);
    const lineGross = unitPrice * toAmount(row.quantity);

    grossAmount += lineGross;

    if (row.isExempted) {
      exemptionAmount += lineGross;
      return;
    }

    if (isInsurance && (row.patientShare != null || row.insuranceShare != null)) {
      patientResponsibilityAmount += toAmount(row.patientShare);
      insuranceResponsibilityAmount += toAmount(row.insuranceShare);
      return;
    }

    patientResponsibilityAmount += lineGross;
  });

  const netAmount = Math.max(0, grossAmount - exemptionAmount);

  return {
    grossAmount,
    discountAmount: 0,
    exemptionAmount,
    taxAmount: 0,
    netAmount,
    patientResponsibilityAmount,
    insuranceResponsibilityAmount,
    patientOutstandingAmount: patientResponsibilityAmount,
    isPreview: true
  };
};

export const buildPreviewChargeLines = (
  summary: EncounterBillingSummary,
  selectedRows: PreviewServiceRow[],
  currency: string,
  isInsurance: boolean
): EncounterBillingItemSummary[] => {
  if ((summary.items ?? []).length > 0) {
    return summary.items;
  }

  return selectedRows.map((row, index) => {
    const unitPrice = toAmount(row.calculatedPrice ?? row.setupPrice);
    const quantity = toAmount(row.quantity);
    const grossAmount = unitPrice * quantity;
    const exempted = Boolean(row.isExempted);
    const netAmount = exempted ? 0 : grossAmount;

    const patientResponsibilityAmount =
      isInsurance && row.patientShare != null
        ? toAmount(row.patientShare)
        : exempted
          ? 0
          : netAmount;

    const insuranceResponsibilityAmount =
      isInsurance && row.insuranceShare != null ? toAmount(row.insuranceShare) : 0;

    return {
      patientServiceProductId: null,
      chargeLineId: -(index + 1),
      billingItemType: row.serviceType,
      sourceId: row.serviceId,
      itemCode: null,
      itemName: row.serviceName,
      quantity,
      unitPrice,
      setupUnitPrice: row.setupPrice ?? null,
      priceSource: row.priceSource ?? (row.setupPrice != null ? 'SETUP_FALLBACK' : 'ESTIMATE'),
      priceListItemCode: row.priceListItemCode ?? null,
      grossAmount,
      discountAmount: 0,
      exemptionAmount: exempted ? grossAmount : 0,
      taxAmount: 0,
      netAmount,
      patientResponsibilityAmount,
      insuranceResponsibilityAmount,
      otherPayerResponsibilityAmount: 0,
      reservedAmount: 0,
      allocatedAmount: 0,
      outstandingAmount: patientResponsibilityAmount,
      exempted,
      currency: currency as EncounterBillingItemSummary['currency'],
      status: 'OPEN'
    };
  });
};

export type PaymentReceiptData = {
  receiptNumber: string;
  transactionNumber: string;
  paymentDate: string;
  patientName: string;
  patientMrn: string;
  encounterNumber: string;
  facilityName: string;
  coverageType: string;
  currency: string;
  paymentAmount: number;
  paymentMethod: string;
  chargeNumber: string;
  items: Array<{
    name: string;
    type: string;
    quantity: number;
    unitPrice: number;
    netAmount: number;
    patientShare: number;
  }>;
  totals: PreviewBillingTotals;
  notes?: string;
};
