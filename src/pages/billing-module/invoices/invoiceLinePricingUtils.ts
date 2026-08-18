import type { InvoiceLineItem } from '@/services/billing/financialDocumentAdjustmentService';

export type InvoiceLinePricingBreakdown = {
  grossAmount: number;
  itemDiscountAmount: number;
  itemTaxAmount: number;
  invoiceDiscountAmount: number;
  invoiceTaxAmount: number;
  netAmount: number;
};

const isInvoiceScope = (scope?: string | null) =>
  String(scope ?? '').toUpperCase() === 'INVOICE';

export const lineNetAmount = (row: {
  netAmount?: number | null;
  grossAmount?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  itemDiscountAmount?: number | null;
  itemTaxAmount?: number | null;
  invoiceDiscountAmount?: number | null;
  invoiceTaxAmount?: number | null;
  quantity?: number | null;
  unitPrice?: number | null;
}) => {
  if (row.netAmount != null && Number.isFinite(Number(row.netAmount))) {
    return Number(row.netAmount);
  }

  const gross =
    row.grossAmount != null
      ? Number(row.grossAmount)
      : Number(row.quantity ?? 0) * Number(row.unitPrice ?? 0);
  const itemDiscount = Number(row.itemDiscountAmount ?? row.discountAmount ?? 0);
  const itemTax = Number(row.itemTaxAmount ?? row.taxAmount ?? 0);
  const invoiceDiscount = Number(row.invoiceDiscountAmount ?? 0);
  const invoiceTax = Number(row.invoiceTaxAmount ?? 0);
  const totalDiscount = row.itemDiscountAmount != null ? itemDiscount + invoiceDiscount : itemDiscount;
  const totalTax = row.itemTaxAmount != null ? itemTax + invoiceTax : itemTax;
  return Math.max(0, gross - totalDiscount + totalTax);
};

export const resolvePricingBreakdown = (row: {
  grossAmount?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  itemDiscountAmount?: number | null;
  itemTaxAmount?: number | null;
  invoiceDiscountAmount?: number | null;
  invoiceTaxAmount?: number | null;
  unitPrice?: number | null;
  quantity?: number | null;
  appliedDiscounts?: InvoiceLineItem['appliedDiscounts'];
  appliedTaxes?: InvoiceLineItem['appliedTaxes'];
}): InvoiceLinePricingBreakdown => {
  if (row.itemDiscountAmount != null || row.invoiceDiscountAmount != null) {
    return {
      grossAmount:
        row.grossAmount != null
          ? Number(row.grossAmount)
          : Number(row.quantity ?? 0) * Number(row.unitPrice ?? 0),
      itemDiscountAmount: Number(row.itemDiscountAmount ?? 0),
      itemTaxAmount: Number(row.itemTaxAmount ?? 0),
      invoiceDiscountAmount: Number(row.invoiceDiscountAmount ?? 0),
      invoiceTaxAmount: Number(row.invoiceTaxAmount ?? 0),
      netAmount: lineNetAmount(row)
    };
  }

  const gross =
    row.grossAmount != null
      ? Number(row.grossAmount)
      : Number(row.quantity ?? 0) * Number(row.unitPrice ?? 0);

  const itemDiscount =
    row.appliedDiscounts?.reduce(
      (sum, entry) =>
        sum + (isInvoiceScope(entry.applicableOn) ? 0 : Number(entry.appliedAmount ?? 0)),
      0
    ) ?? Number(row.discountAmount ?? 0);

  const invoiceDiscount =
    row.appliedDiscounts?.reduce(
      (sum, entry) =>
        sum + (isInvoiceScope(entry.applicableOn) ? Number(entry.appliedAmount ?? 0) : 0),
      0
    ) ?? 0;

  const itemTax =
    row.appliedTaxes?.reduce(
      (sum, entry) =>
        sum + (isInvoiceScope(entry.applicableOn) ? 0 : Number(entry.appliedAmount ?? 0)),
      0
    ) ?? Number(row.taxAmount ?? 0);

  const invoiceTax =
    row.appliedTaxes?.reduce(
      (sum, entry) =>
        sum + (isInvoiceScope(entry.applicableOn) ? Number(entry.appliedAmount ?? 0) : 0),
      0
    ) ?? 0;

  const hasScopedBreakdown =
    (row.appliedDiscounts?.length ?? 0) > 0 || (row.appliedTaxes?.length ?? 0) > 0;

  if (!hasScopedBreakdown) {
    return {
      grossAmount: gross,
      itemDiscountAmount: Number(row.discountAmount ?? 0),
      itemTaxAmount: Number(row.taxAmount ?? 0),
      invoiceDiscountAmount: 0,
      invoiceTaxAmount: 0,
      netAmount: lineNetAmount(row)
    };
  }

  return {
    grossAmount: gross,
    itemDiscountAmount: itemDiscount,
    itemTaxAmount: itemTax,
    invoiceDiscountAmount: invoiceDiscount,
    invoiceTaxAmount: invoiceTax,
    netAmount: lineNetAmount({
      ...row,
      itemDiscountAmount: itemDiscount,
      itemTaxAmount: itemTax,
      invoiceDiscountAmount: invoiceDiscount,
      invoiceTaxAmount: invoiceTax
    })
  };
};

export const projectLineNetAfterChange = (
  line: {
    grossAmount?: number | null;
    unitPrice?: number | null;
    quantity?: number | null;
    netAmount?: number | null;
    discountAmount?: number | null;
    taxAmount?: number | null;
    itemDiscountAmount?: number | null;
    itemTaxAmount?: number | null;
    invoiceDiscountAmount?: number | null;
    invoiceTaxAmount?: number | null;
    appliedDiscounts?: InvoiceLineItem['appliedDiscounts'];
    appliedTaxes?: InvoiceLineItem['appliedTaxes'];
  },
  newQuantity: number,
  newUnitPrice: number
): number => {
  const oldNet = lineNetAmount(line);
  const oldQty = Number(line.quantity ?? 1);
  const oldGross =
    line.grossAmount != null && Number(line.grossAmount) > 0
      ? Number(line.grossAmount)
      : oldQty * Number(line.unitPrice ?? 0);
  const newGross = newQuantity * newUnitPrice;

  if (oldGross <= 0) {
    if (newQuantity <= oldQty && newUnitPrice <= Number(line.unitPrice ?? 0)) {
      return oldNet;
    }
    if (oldQty <= 0) {
      return newGross;
    }
    return (oldNet * newQuantity) / oldQty;
  }

  return (oldNet * newGross) / oldGross;
};

const hasInsuranceCopayRule = (line: {
  chargeNetAmount?: number | null;
  insuranceShareAmount?: number | null;
  patientCopaymentPercentage?: number | null;
}) =>
  Number(line.chargeNetAmount ?? 0) > 0 &&
  Number(line.insuranceShareAmount ?? 0) > 0 &&
  Number(line.patientCopaymentPercentage ?? 0) > 0;

/**
 * Insurance qty/price reduce must re-run copay % + max on the remaining charge net.
 * Do not scale the already-capped patient invoice share (75 → 37.50).
 */
export const projectInvoiceLineNetAfterChange = (
  line: InvoiceLineItem,
  newQuantity: number,
  newUnitPrice: number,
  documentSubtype?: string | null
): number => {
  if (hasInsuranceCopayRule(line)) {
    const oldQty = Number(line.chargeQuantity ?? line.quantity ?? 1);
    let newChargeNet = (Number(line.chargeNetAmount) * newQuantity) / (oldQty || 1);
    const chargeUnit = Number(line.chargeUnitPrice ?? 0);
    if (chargeUnit > 0 && Math.abs(newUnitPrice - chargeUnit) < 0.0001) {
      newChargeNet = chargeUnit * newQuantity;
    }

    const copayPercent = Number(line.patientCopaymentPercentage);
    const copayMax = Number(line.patientMaximumCopayment ?? 0);
    let patientShare = (newChargeNet * copayPercent) / 100;
    if (copayMax > 0) {
      patientShare = Math.min(patientShare, copayMax);
    }
    patientShare = Math.min(Math.max(0, patientShare), newChargeNet);
    const insuranceShare = Math.max(0, newChargeNet - patientShare);

    return String(documentSubtype ?? '').toUpperCase() === 'INSURANCE_CLAIM'
      ? Number(insuranceShare.toFixed(4))
      : Number(patientShare.toFixed(4));
  }

  return projectLineNetAfterChange(line, newQuantity, newUnitPrice);
};

export const inferInvoiceScopeAdjustments = (
  grossAmount: number,
  referenceLines: InvoiceLineItem[] | undefined | null
): Pick<
  InvoiceLinePricingBreakdown,
  'invoiceDiscountAmount' | 'invoiceTaxAmount' | 'netAmount'
> | null => {
  if (!referenceLines?.length || grossAmount <= 0) {
    return null;
  }

  const sample = referenceLines
    .map(line => ({ line, breakdown: resolvePricingBreakdown(line) }))
    .filter(
      ({ breakdown }) =>
        breakdown.grossAmount > 0 &&
        (breakdown.invoiceDiscountAmount > 0 || breakdown.invoiceTaxAmount > 0)
    )
    .sort(
      (left, right) =>
        right.breakdown.invoiceDiscountAmount +
        right.breakdown.invoiceTaxAmount -
        (left.breakdown.invoiceDiscountAmount + left.breakdown.invoiceTaxAmount)
    )[0];

  if (!sample) {
    return null;
  }

  const { breakdown } = sample;
  const discountRate = breakdown.invoiceDiscountAmount / breakdown.grossAmount;
  const afterSampleDiscount = breakdown.grossAmount - breakdown.invoiceDiscountAmount;
  const taxRate =
    afterSampleDiscount > 0 ? breakdown.invoiceTaxAmount / afterSampleDiscount : 0;

  const invoiceDiscountAmount = Number((grossAmount * discountRate).toFixed(4));
  const afterDiscount = Math.max(0, grossAmount - invoiceDiscountAmount);
  const invoiceTaxAmount = Number((afterDiscount * taxRate).toFixed(4));
  const netAmount = Number((afterDiscount + invoiceTaxAmount).toFixed(4));

  return {
    invoiceDiscountAmount,
    invoiceTaxAmount,
    netAmount
  };
};
