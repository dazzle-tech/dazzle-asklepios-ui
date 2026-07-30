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
