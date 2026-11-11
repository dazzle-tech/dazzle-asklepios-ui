import type { EncounterBillingItemSummary, EncounterBillingSummary } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import {
  isBilledItemOfRow,
  type DefaultBillingRowIdentity
} from './defaultBillingRows';

export type PreviewServiceRow = DefaultBillingRowIdentity & {
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
  previewGrossAmount?: number | null;
  previewDiscountAmount?: number | null;
  previewTaxAmount?: number | null;
  previewNetAmount?: number | null;
};

export type PaymentDiscountCode = {
  discountType?: string | null;
  percentage?: number | null;
  fixedAmount?: number | null;
} | null;

export const discountCodeAmount = (
  gross: number,
  discount: PaymentDiscountCode
): number => {
  if (!discount || gross <= 0) {
    return 0;
  }
  if (discount.discountType === 'FIXED_AMOUNT') {
    return Math.min(gross, Math.max(0, toAmount(discount.fixedAmount)));
  }
  const rate = Math.min(100, Math.max(0, toAmount(discount.percentage)));
  return Math.min(gross, (gross * rate) / 100);
};

const extraDiscount = (
  gross: number,
  serverDiscount: number,
  discount: PaymentDiscountCode
): number => Math.max(0, discountCodeAmount(gross, discount) - serverDiscount);

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
/**
 * Tax carried by the patient share of a charge line. Lines billed before the
 * Patient Copayment / Claim Share toggles have no party split, so their tax is
 * shared in proportion to the patient share.
 */
export const resolvePatientTaxAmount = (
  item: Pick<
    EncounterBillingItemSummary,
    'taxAmount' | 'netAmount' | 'patientResponsibilityAmount' | 'patientTaxAmount'
  >
): number => {
  if (item.patientTaxAmount != null) {
    return toAmount(item.patientTaxAmount);
  }

  const netAmount = toAmount(item.netAmount);
  const taxAmount = toAmount(item.taxAmount);

  if (netAmount <= 0 || taxAmount <= 0) {
    return 0;
  }

  return (taxAmount * toAmount(item.patientResponsibilityAmount)) / netAmount;
};

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
    row => isBilledItemOfRow(item, row)
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
  row: DefaultBillingRowIdentity,
  summary: EncounterBillingSummary
): boolean => {
  const billed = (summary.items ?? []).find(
    item => isBilledItemOfRow(item, row)
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
  rows.filter(row => isDefaultServicePayable(row, summary));

export const computePreviewBillingTotals = (
  summary: EncounterBillingSummary,
  selectedRows: PreviewServiceRow[],
  isInsurance: boolean,
  discount: PaymentDiscountCode = null
): PreviewBillingTotals => {
  const hasInsurancePreviewPricing =
    isInsurance &&
    selectedRows.some(
      row =>
        !row.isExempted &&
        row.previewNetAmount != null
    );

  if (
    hasCalculatedSummary(summary) &&
    !hasInsurancePreviewPricing &&
    !isInsurance
  ) {
    const extra = selectedRows.reduce((sum, row) => {
      if (row.isExempted) {
        return sum;
      }
      const gross =
        toAmount(row.calculatedPrice ?? row.setupPrice) * Math.max(1, toAmount(row.quantity));
      return sum + extraDiscount(gross, toAmount(row.previewDiscountAmount), discount);
    }, 0);
    const outstandingAmount = Math.max(
      0,
      resolvePatientOutstandingAmount(summary) - extra
    );

    return {
      grossAmount: toAmount(summary.grossAmount),
      discountAmount: toAmount(summary.discountAmount) + extra,
      exemptionAmount: toAmount(summary.exemptionAmount),
      taxAmount: toAmount(summary.taxAmount),
      netAmount: Math.max(0, toAmount(summary.netAmount) - extra),
      patientResponsibilityAmount: Math.max(
        0,
        toAmount(summary.patientResponsibilityAmount) - extra
      ),
      insuranceResponsibilityAmount: toAmount(summary.insuranceResponsibilityAmount),
      patientOutstandingAmount: outstandingAmount,
      isPreview: extra > 0
    };
  }

  let grossAmount = 0;
  let discountAmount = 0;
  let exemptionAmount = 0;
  let patientResponsibilityAmount = 0;
  let insuranceResponsibilityAmount = 0;
  let taxAmount = 0;
  let netAmount = 0;

  selectedRows.forEach(row => {
    if (row.previewNetAmount != null) {
      const lineGross = toAmount(row.previewGrossAmount);
      const addedDiscount = row.isExempted
        ? 0
        : extraDiscount(lineGross, toAmount(row.previewDiscountAmount), discount);
      grossAmount += lineGross;
      discountAmount += toAmount(row.previewDiscountAmount) + addedDiscount;
      taxAmount += toAmount(row.previewTaxAmount);
      exemptionAmount += row.isExempted ? lineGross : 0;

      if (row.isExempted) {
        return;
      }

      const lineNet = Math.max(0, toAmount(row.previewNetAmount) - addedDiscount);
      netAmount += lineNet;

      if (isInsurance && (row.patientShare != null || row.insuranceShare != null)) {
        patientResponsibilityAmount += toAmount(row.patientShare);
        insuranceResponsibilityAmount += toAmount(row.insuranceShare);
        return;
      }

      patientResponsibilityAmount += lineNet;
      return;
    }

    const unitPrice = toAmount(row.calculatedPrice ?? row.setupPrice);
    const lineGross = unitPrice * Math.max(1, toAmount(row.quantity));
    const addedDiscount = row.isExempted
      ? 0
      : extraDiscount(lineGross, 0, discount);

    grossAmount += lineGross;
    discountAmount += addedDiscount;

    if (row.isExempted) {
      exemptionAmount += lineGross;
      return;
    }

    netAmount += Math.max(0, lineGross - addedDiscount);

    if (isInsurance && (row.patientShare != null || row.insuranceShare != null)) {
      patientResponsibilityAmount += toAmount(row.patientShare);
      insuranceResponsibilityAmount += toAmount(row.insuranceShare);
      return;
    }

    patientResponsibilityAmount += Math.max(0, lineGross - addedDiscount);
  });

  netAmount = Math.max(0, netAmount);

  return {
    grossAmount,
    discountAmount,
    exemptionAmount,
    taxAmount,
    netAmount,
    patientResponsibilityAmount,
    insuranceResponsibilityAmount,
    patientOutstandingAmount: patientResponsibilityAmount,
    isPreview: true
  };
};

const applyLineDiscount = (
  grossAmount: number,
  serverDiscount: number,
  serverNet: number,
  discount: PaymentDiscountCode,
  exempted: boolean
) => {
  if (exempted) {
    return { discountAmount: serverDiscount, netAmount: 0 };
  }
  const added = extraDiscount(grossAmount, serverDiscount, discount);
  return {
    discountAmount: serverDiscount + added,
    netAmount: Math.max(0, serverNet - added)
  };
};

export const linePriceAfterDiscount = (
  row: Pick<PreviewServiceRow, 'quantity' | 'setupPrice' | 'calculatedPrice' | 'previewDiscountAmount' | 'isExempted'>,
  discount: PaymentDiscountCode
): number | null => {
  const unit = row.calculatedPrice ?? row.setupPrice;
  if (unit == null || row.isExempted) {
    return unit ?? null;
  }
  const quantity = Math.max(1, toAmount(row.quantity));
  const gross = toAmount(unit) * quantity;
  const priced = applyLineDiscount(
    gross,
    toAmount(row.previewDiscountAmount),
    gross - toAmount(row.previewDiscountAmount),
    discount,
    false
  );
  return priced.netAmount / quantity;
};

export const buildPreviewChargeLines = (
  summary: EncounterBillingSummary,
  selectedRows: PreviewServiceRow[],
  currency: string,
  isInsurance: boolean,
  discount: PaymentDiscountCode = null
): EncounterBillingItemSummary[] => {
  const hasInsurancePreviewPricing =
    isInsurance &&
    selectedRows.some(
      row =>
        !row.isExempted &&
        row.previewNetAmount != null
    );

  if ((summary.items ?? []).length > 0 && !hasInsurancePreviewPricing) {
    return summary.items.map(item => {
      const row = selectedRows.find(
        candidate =>
          isBilledItemOfRow(item, candidate) ||
          (item.sourceId != null && item.sourceId === candidate.itemId)
      );
      if (!row) {
        return item;
      }
      const grossAmount = toAmount(item.grossAmount ?? toAmount(item.unitPrice) * toAmount(item.quantity));
      const priced = applyLineDiscount(
        grossAmount,
        toAmount(item.discountAmount),
        toAmount(item.netAmount),
        discount,
        Boolean(row.isExempted || item.exempted)
      );
      const patientResponsibilityAmount = row.isExempted
        ? 0
        : Math.max(0, toAmount(item.patientResponsibilityAmount) - Math.max(0, priced.discountAmount - toAmount(item.discountAmount)));
      return {
        ...item,
        discountAmount: priced.discountAmount,
        netAmount: priced.netAmount,
        patientResponsibilityAmount,
        outstandingAmount: patientResponsibilityAmount
      };
    });
  }

  return selectedRows.map((row, index) => {
    const quantity = toAmount(row.quantity);
    const exempted = Boolean(row.isExempted);
    const hasPreview = row.previewNetAmount != null;

    const unitPrice = hasPreview
      ? toAmount(row.calculatedPrice ?? row.setupPrice)
      : toAmount(row.calculatedPrice ?? row.setupPrice);
    const grossAmount = hasPreview
      ? toAmount(row.previewGrossAmount)
      : unitPrice * Math.max(1, quantity);
    const priced = applyLineDiscount(
      grossAmount,
      hasPreview ? toAmount(row.previewDiscountAmount) : 0,
      exempted ? 0 : hasPreview ? toAmount(row.previewNetAmount) : grossAmount,
      discount,
      exempted
    );
    const discountAmount = priced.discountAmount;
    const taxAmount = hasPreview ? toAmount(row.previewTaxAmount) : 0;
    const netAmount = priced.netAmount;

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
      sourceId: row.itemId,
      itemCode: null,
      itemName: row.serviceName,
      quantity,
      unitPrice,
      setupUnitPrice: row.setupPrice ?? null,
      priceSource:
        row.priceSource ??
        (hasPreview ? 'PRICE_LIST' : row.setupPrice != null ? 'SETUP_FALLBACK' : 'ESTIMATE'),
      priceListItemCode: row.priceListItemCode ?? null,
      grossAmount,
      discountAmount,
      exemptionAmount: exempted ? grossAmount : 0,
      taxAmount,
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
    taxAmount?: number;
  }>;
  totals: PreviewBillingTotals;
  notes?: string;
};
