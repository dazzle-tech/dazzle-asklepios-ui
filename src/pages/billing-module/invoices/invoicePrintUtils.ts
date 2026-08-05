import type {
  InvoiceLineItem,
  InvoicePricingSummary
} from '@/services/billing/financialDocumentAdjustmentService';
import type {
  BillingEligibilitySnapshot,
  EncounterInvoiceDetails,
  PatientFinancialInvoice
} from '@/services/billing/invoiceGenerationService';
import type { EncounterBillingItemSummary } from '@/types/model-types-new';
import type { UnifiedBillingChargeRow } from '@/pages/billing-module/accounting/utils/billingAccountingUtils';
import {
  formatBillingItemType,
  isTechnicalBillingLabel
} from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';

import type { InvoicePrintChargeContext } from './useInvoicePrintLookups';

export type InvoicePrintLineItem = {
  serviceCode: string;
  serviceName: string;
  serviceType: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountAmount: number;
  amountBeforeTax: number;
  amount: number;
  patientShare?: number;
  insuranceShare?: number;
  taxAmount?: number;
  appliedDiscounts?: InvoiceLineItem['appliedDiscounts'];
  appliedTaxes?: InvoiceLineItem['appliedTaxes'];
};

export type InvoicePrintData = {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: 'PATIENT' | 'INSURANCE_CLAIM';
  status: string;
  visitNumber: string;
  visitDate?: string;
  facilityName: string;
  facilityAddress?: string;
  vatRegistrationNumber?: string;
  qrCodePayload: string;
  patientName: string;
  patientMrn: string;
  nationalId?: string;
  mobileNumber?: string;
  eligibilityReference?: string;
  claimReference?: string;
  insuranceCompany?: string;
  payerId?: string;
  policyNumber?: string;
  memberNumber?: string;
  benefitClass?: string;
  authorizationNumber?: string;
  authorizationDate?: string;
  providerName?: string;
  providerId?: string;
  physician?: string;
  currency: string;
  items: InvoicePrintLineItem[];
  pricingSummary?: InvoicePricingSummary | null;
  totals: {
    grossAmount: number;
    discountAmount: number;
    taxAmount: number;
    netAmount: number;
    patientShare: number;
    insuranceShare: number;
  };
};

export type FacilityPrintInfo = {
  name: string;
  address?: string;
  vatRegistrationNumber?: string;
  providerId?: string;
};

const formatMoneyValue = (value?: number) => Number(value ?? 0);

export const formatApplicableOnLabel = (value?: string | null) => {
  switch (String(value ?? '').toUpperCase()) {
    case 'INVOICE':
      return 'Invoice';
    case 'INVOICE_LINE':
      return 'Invoice line';
    case 'SERVICE':
      return 'Service';
    case 'PRODUCT':
      return 'Product';
    default:
      return value ?? '-';
  }
};

export const formatDiscountRuleLabel = (
  rule: InvoicePricingSummary['discountRules'][number]
) => {
  const code = rule.code ?? rule.name ?? 'Discount';
  const applicableOn = formatApplicableOnLabel(rule.applicableOn);
  if (String(rule.discountType).toUpperCase() === 'PERCENTAGE') {
    return `${code} · ${Number(rule.rate ?? 0)}% · ${applicableOn}`;
  }
  if (String(rule.discountType).toUpperCase() === 'FIXED_AMOUNT') {
    return `${code} · Fixed ${Number(rule.fixedAmount ?? 0)} · ${applicableOn}`;
  }
  return `${code} · ${applicableOn}`;
};

export const formatTaxRuleLabel = (rule: InvoicePricingSummary['taxRules'][number]) => {
  const code = rule.code ?? rule.name ?? 'Tax';
  const applicableOn = formatApplicableOnLabel(rule.applicableOn);
  const calculation =
    String(rule.calculationType ?? 'EXCLUSIVE').toUpperCase() === 'INCLUSIVE'
      ? 'Inclusive'
      : 'Exclusive';
  if (String(rule.taxType).toUpperCase() === 'PERCENTAGE') {
    return `${code} · ${Number(rule.rate ?? 0)}% · ${calculation} · ${applicableOn}`;
  }
  if (String(rule.taxType).toUpperCase() === 'FIXED_AMOUNT') {
    return `${code} · Fixed ${Number(rule.fixedAmount ?? 0)} · ${calculation} · ${applicableOn}`;
  }
  return `${code} · ${calculation} · ${applicableOn}`;
};

export const invoiceStatusLabel = (status?: string) => {
  switch (String(status ?? '').toUpperCase()) {
    case 'ISSUED':
      return 'Issued';
    case 'PARTIALLY_PAID':
      return 'Partially Paid';
    case 'PAID':
      return 'Paid';
    case 'DRAFT':
      return 'Draft';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return status ?? '-';
  }
};

export const invoiceTypeLabel = (type: InvoicePrintData['invoiceType']) =>
  type === 'INSURANCE_CLAIM' ? 'Insurance Claim Invoice' : 'Patient Invoice';

const buildQrCodePayload = ({
  invoiceNumber,
  invoiceDate,
  facilityName,
  vatRegistrationNumber,
  netAmount,
  taxAmount
}: {
  invoiceNumber: string;
  invoiceDate: string;
  facilityName: string;
  vatRegistrationNumber?: string;
  netAmount: number;
  taxAmount: number;
}) =>
  [
    `Invoice: ${invoiceNumber}`,
    `Date: ${invoiceDate}`,
    `Facility: ${facilityName}`,
    vatRegistrationNumber ? `VAT: ${vatRegistrationNumber}` : null,
    `Net: ${netAmount.toFixed(2)}`,
    `Tax: ${taxAmount.toFixed(2)}`
  ]
    .filter(Boolean)
    .join('\n');

const findBillingItem = (
  chargeContext: InvoicePrintChargeContext,
  chargeLineId?: number | null,
  patientServiceProductId?: number | null
): EncounterBillingItemSummary | undefined => {
  const items = chargeContext.billingSummary?.items ?? [];

  if (chargeLineId != null) {
    const byChargeLine = items.find(
      item => Number(item.chargeLineId) === Number(chargeLineId)
    );
    if (byChargeLine) {
      return byChargeLine;
    }
  }

  if (patientServiceProductId != null) {
    return items.find(
      item => Number(item.patientServiceProductId) === Number(patientServiceProductId)
    );
  }

  return undefined;
};

const resolveServiceCode = (
  chargeRow: UnifiedBillingChargeRow,
  billingItem?: EncounterBillingItemSummary
) => {
  if (billingItem?.priceListItemCode?.trim()) {
    return billingItem.priceListItemCode.trim();
  }

  if (
    chargeRow.itemCode?.trim() &&
    !isTechnicalBillingLabel(chargeRow.itemCode, chargeRow.billingItemType)
  ) {
    return chargeRow.itemCode.trim();
  }

  if (
    billingItem?.itemCode?.trim() &&
    !isTechnicalBillingLabel(billingItem.itemCode, billingItem.billingItemType)
  ) {
    return billingItem.itemCode.trim();
  }

  return '-';
};

const mapChargeRowToPrintItem = (
  chargeRow: UnifiedBillingChargeRow,
  billingItem: EncounterBillingItemSummary | undefined,
  invoiceType: InvoicePrintData['invoiceType']
): InvoicePrintLineItem | null => {
  const patientShare = formatMoneyValue(chargeRow.patientAmount);
  const insuranceShare = formatMoneyValue(chargeRow.insuranceAmount);
  const isInsuranceInvoice = invoiceType === 'INSURANCE_CLAIM';

  if (isInsuranceInvoice && insuranceShare <= 0) {
    return null;
  }

  if (!isInsuranceInvoice && patientShare <= 0 && formatMoneyValue(chargeRow.netAmount) <= 0) {
    return null;
  }

  const amount = isInsuranceInvoice
    ? insuranceShare
    : patientShare > 0
      ? patientShare
      : formatMoneyValue(chargeRow.netAmount);

  return {
    serviceCode: resolveServiceCode(chargeRow, billingItem),
    serviceName: chargeRow.itemName || '-',
    serviceType: formatBillingItemType(chargeRow.billingItemType),
    quantity: Number(chargeRow.quantity ?? 1),
    unitPrice: formatMoneyValue(chargeRow.unitPrice),
    grossAmount:
      formatMoneyValue(chargeRow.unitPrice) * Number(chargeRow.quantity ?? 1),
    discountAmount: 0,
    amountBeforeTax: amount,
    amount,
    patientShare,
    insuranceShare,
    taxAmount: formatMoneyValue(billingItem?.taxAmount)
  };
};

const resolveLineItemLabel = (lineItem: InvoiceLineItem): string => {
  const description = lineItem.itemDescription?.trim();
  if (description && !isTechnicalBillingLabel(description)) {
    return description;
  }

  const code = lineItem.itemCode?.trim();
  if (code && !isTechnicalBillingLabel(code)) {
    return code;
  }

  return description || code || '-';
};

const inferLineItemType = (lineItem: InvoiceLineItem): string => {
  const source = `${lineItem.itemCode ?? ''} ${lineItem.itemDescription ?? ''}`.toUpperCase();
  const name = String(lineItem.itemDescription ?? '').toLowerCase();

  if (
    source.includes('MEDICATION') ||
    source.includes('MEDICINE') ||
    source.includes('DRUG') ||
    name.includes('medication') ||
    name.includes('medicine')
  ) {
    return 'Medication';
  }
  if (
    source.includes('TEST') ||
    source.includes('LAB') ||
    source.includes('DIAGNOSTIC') ||
    source.includes('CBC') ||
    name.includes('cbc') ||
    name.includes('lab')
  ) {
    return 'Diagnostic Test';
  }
  if (source.includes('PROCEDURE')) {
    return 'Procedure';
  }
  if (source.includes('SERVICE') || source.includes('CONSULT')) {
    return 'Service';
  }

  return '-';
};

const mapIssuedLineToPrintItem = (
  lineItem: InvoiceLineItem,
  chargeContext: InvoicePrintChargeContext,
  invoiceType: InvoicePrintData['invoiceType']
): InvoicePrintLineItem | null => {
  const chargeRow =
    chargeContext.chargeRows.find(
      row =>
        (lineItem.chargeLineId != null &&
          Number(row.chargeLineId) === Number(lineItem.chargeLineId)) ||
        (lineItem.patientServiceProductId != null &&
          Number(row.patientServiceProductId) === Number(lineItem.patientServiceProductId))
    ) ?? null;

  const billingItem = findBillingItem(
    chargeContext,
    lineItem.chargeLineId,
    lineItem.patientServiceProductId
  );

  const persistedAmount = formatMoneyValue(lineItem.netAmount);
  const persistedTaxAmount = formatMoneyValue(lineItem.taxAmount);
  const persistedGrossAmount = formatMoneyValue(lineItem.grossAmount);
  const persistedDiscountAmount = formatMoneyValue(lineItem.discountAmount);
  const quantity = Number(lineItem.quantity ?? chargeRow?.quantity ?? 1);
  const grossUnitPrice =
    quantity > 0 ? persistedGrossAmount / quantity : formatMoneyValue(lineItem.unitPrice);
  const amountBeforeTax = Math.max(0, persistedAmount - persistedTaxAmount);

  const patientShare =
    invoiceType === 'PATIENT'
      ? persistedAmount
      : formatMoneyValue(billingItem?.patientResponsibilityAmount);
  const insuranceShare =
    invoiceType === 'INSURANCE_CLAIM'
      ? persistedAmount
      : formatMoneyValue(billingItem?.insuranceResponsibilityAmount);

  const amount = persistedAmount;
  const serviceName = resolveLineItemLabel(lineItem);
  const serviceType =
    formatBillingItemType(billingItem?.billingItemType) !== '-'
      ? formatBillingItemType(billingItem?.billingItemType)
      : inferLineItemType(lineItem);

  return {
    serviceCode:
      billingItem?.priceListItemCode?.trim() ||
      (lineItem.itemCode?.trim() &&
      !isTechnicalBillingLabel(lineItem.itemCode, billingItem?.billingItemType)
        ? lineItem.itemCode.trim()
        : '-') ||
      '-',
    serviceName: chargeRow?.itemName || serviceName,
    serviceType: chargeRow
      ? formatBillingItemType(chargeRow.billingItemType)
      : serviceType,
    quantity,
    unitPrice: grossUnitPrice,
    grossAmount: persistedGrossAmount,
    discountAmount: persistedDiscountAmount,
    amountBeforeTax,
    amount: amount || patientShare || insuranceShare,
    patientShare,
    insuranceShare,
    taxAmount: persistedTaxAmount,
    appliedDiscounts: lineItem.appliedDiscounts,
    appliedTaxes: lineItem.appliedTaxes
  };
};

const buildItemsFromChargeRows = (
  chargeContext: InvoicePrintChargeContext,
  invoiceType: InvoicePrintData['invoiceType'],
  lineItemFilter?: InvoiceLineItem[]
): InvoicePrintLineItem[] => {
  if (lineItemFilter?.length) {
    return lineItemFilter
      .map(item => mapIssuedLineToPrintItem(item, chargeContext, invoiceType))
      .filter((item): item is InvoicePrintLineItem => item != null);
  }

  return chargeContext.chargeRows
    .filter(row => row.isBilled)
    .map(row =>
      mapChargeRowToPrintItem(
        row,
        findBillingItem(chargeContext, row.chargeLineId, row.patientServiceProductId),
        invoiceType
      )
    )
    .filter((item): item is InvoicePrintLineItem => item != null);
};

const resolveVisitNumber = (
  encounterDetails: EncounterInvoiceDetails | null | undefined,
  encounterId: number
) => encounterDetails?.encounterNumber ?? `Visit #${encounterId}`;

const resolveInsuranceFields = (
  invoice: PatientFinancialInvoice,
  eligibilitySnapshot?: BillingEligibilitySnapshot | null
) => ({
  eligibilityReference:
    invoice.eligibilityReference ?? eligibilitySnapshot?.eligibilityResponseId ?? undefined,
  claimReference: invoice.claimReference ?? undefined,
  policyNumber: eligibilitySnapshot?.policyNumber ?? undefined,
  memberNumber: eligibilitySnapshot?.memberId ?? undefined,
  benefitClass: eligibilitySnapshot?.network ?? undefined,
  insuranceCompany: eligibilitySnapshot?.policyHolder ?? undefined
});

const buildTotals = (
  items: InvoicePrintLineItem[],
  options?: {
    invoiceTotalAmount?: number;
    lineItems?: InvoiceLineItem[];
  }
) => {
  const grossAmount = items.reduce(
    (sum, item) => sum + formatMoneyValue(item.quantity) * formatMoneyValue(item.unitPrice),
    0
  );
  const taxAmount = items.reduce((sum, item) => sum + formatMoneyValue(item.taxAmount), 0);
  let netAmount = items.reduce((sum, item) => sum + formatMoneyValue(item.amount), 0);
  let patientShare = items.reduce((sum, item) => sum + formatMoneyValue(item.patientShare), 0);
  const insuranceShare = items.reduce(
    (sum, item) => sum + formatMoneyValue(item.insuranceShare),
    0
  );

  const discountAmount =
    options?.lineItems?.reduce(
      (sum, item) => sum + formatMoneyValue(item.discountAmount),
      0
    ) ?? Math.max(0, grossAmount + taxAmount - netAmount);

  const invoiceTotalAmount = formatMoneyValue(options?.invoiceTotalAmount);
  if (invoiceTotalAmount > 0) {
    netAmount = invoiceTotalAmount;
    if (patientShare > 0) {
      patientShare = invoiceTotalAmount;
    }
  }

  return {
    grossAmount,
    discountAmount,
    taxAmount,
    netAmount: netAmount || grossAmount,
    patientShare,
    insuranceShare
  };
};

export const buildInvoicePrintDataFromEncounter = ({
  invoice,
  encounterDetails,
  eligibilitySnapshot,
  facility,
  chargeContext
}: {
  invoice: PatientFinancialInvoice;
  encounterDetails: EncounterInvoiceDetails;
  eligibilitySnapshot?: BillingEligibilitySnapshot | null;
  facility: FacilityPrintInfo;
  chargeContext: InvoicePrintChargeContext;
}): InvoicePrintData => {
  const invoiceType =
    String(invoice.documentSubtype ?? 'PATIENT').toUpperCase() === 'INSURANCE_CLAIM'
      ? 'INSURANCE_CLAIM'
      : 'PATIENT';

  const items = buildItemsFromChargeRows(chargeContext, invoiceType);

  const totals =
    items.length > 0
      ? buildTotals(items, {
          invoiceTotalAmount: invoice.totalAmount
        })
      : {
          grossAmount: formatMoneyValue(invoice.totalAmount),
          discountAmount: 0,
          taxAmount: formatMoneyValue(encounterDetails.billingSummary?.taxAmount),
          netAmount: formatMoneyValue(invoice.totalAmount),
          patientShare:
            invoiceType === 'PATIENT'
              ? formatMoneyValue(invoice.totalAmount)
              : formatMoneyValue(encounterDetails.billingSummary?.patientOutstandingAmount),
          insuranceShare:
            invoiceType === 'INSURANCE_CLAIM'
              ? formatMoneyValue(invoice.totalAmount)
              : formatMoneyValue(encounterDetails.billingSummary?.insuranceOutstandingAmount)
        };

  const invoiceDate = invoice.createdDate
    ? String(invoice.createdDate).substring(0, 19).replace('T', ' ')
    : new Date().toLocaleString();

  const insuranceFields = resolveInsuranceFields(invoice, eligibilitySnapshot);

  return {
    invoiceNumber: invoice.documentNumber,
    invoiceDate,
    invoiceType,
    status: invoiceStatusLabel(invoice.status),
    visitNumber: resolveVisitNumber(encounterDetails, invoice.encounterId),
    visitDate: encounterDetails.encounterDate
      ? String(encounterDetails.encounterDate).substring(0, 10)
      : undefined,
    facilityName: facility.name,
    facilityAddress: facility.address,
    vatRegistrationNumber: facility.vatRegistrationNumber,
    qrCodePayload: buildQrCodePayload({
      invoiceNumber: invoice.documentNumber,
      invoiceDate,
      facilityName: facility.name,
      vatRegistrationNumber: facility.vatRegistrationNumber,
      netAmount: totals.netAmount,
      taxAmount: totals.taxAmount
    }),
    patientName: encounterDetails.patient?.fullName ?? '-',
    patientMrn: encounterDetails.patient?.medicalRecordNumber ?? '-',
    nationalId: encounterDetails.patient?.nationalId ?? undefined,
    mobileNumber: encounterDetails.patient?.mobileNumber ?? undefined,
    providerName: facility.name,
    providerId: facility.providerId,
    ...insuranceFields,
    currency: invoice.currency ?? 'SAR',
    items,
    totals
  };
};

export const buildInvoicePrintDataFromIssuedInvoice = ({
  invoice,
  lineItems,
  pricingSummary,
  encounterDetails,
  eligibilitySnapshot,
  patient,
  facility,
  chargeContext
}: {
  invoice: PatientFinancialInvoice;
  lineItems: InvoiceLineItem[];
  pricingSummary?: InvoicePricingSummary | null;
  encounterDetails?: EncounterInvoiceDetails | null;
  eligibilitySnapshot?: BillingEligibilitySnapshot | null;
  patient?: any;
  facility: FacilityPrintInfo;
  chargeContext: InvoicePrintChargeContext;
}): InvoicePrintData => {
  const invoiceType =
    String(invoice.documentSubtype ?? 'PATIENT').toUpperCase() === 'INSURANCE_CLAIM'
      ? 'INSURANCE_CLAIM'
      : 'PATIENT';

  const items = buildItemsFromChargeRows(chargeContext, invoiceType, lineItems);

  const totals =
    items.length > 0
      ? buildTotals(items, {
          invoiceTotalAmount: invoice.totalAmount,
          lineItems
        })
      : {
          grossAmount: formatMoneyValue(invoice.totalAmount),
          discountAmount: lineItems.reduce(
            (sum, item) => sum + formatMoneyValue(item.discountAmount),
            0
          ),
          taxAmount: lineItems.reduce(
            (sum, item) => sum + formatMoneyValue(item.taxAmount),
            0
          ),
          netAmount: formatMoneyValue(invoice.totalAmount),
          patientShare: invoiceType === 'PATIENT' ? formatMoneyValue(invoice.totalAmount) : 0,
          insuranceShare:
            invoiceType === 'INSURANCE_CLAIM' ? formatMoneyValue(invoice.totalAmount) : 0
        };

  const invoiceDate = invoice.createdDate
    ? String(invoice.createdDate).substring(0, 19).replace('T', ' ')
    : new Date().toLocaleString();

  const insuranceFields = resolveInsuranceFields(invoice, eligibilitySnapshot);
  const composedPatientName = [patient?.firstName, patient?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const patientName =
    encounterDetails?.patient?.fullName ??
    (composedPatientName || patient?.fullName || patient?.name || '-');

  return {
    invoiceNumber: invoice.documentNumber,
    invoiceDate,
    invoiceType,
    status: invoiceStatusLabel(invoice.status),
    visitNumber: resolveVisitNumber(encounterDetails ?? null, invoice.encounterId),
    visitDate: encounterDetails?.encounterDate
      ? String(encounterDetails.encounterDate).substring(0, 10)
      : undefined,
    facilityName: facility.name,
    facilityAddress: facility.address,
    vatRegistrationNumber: facility.vatRegistrationNumber,
    qrCodePayload: buildQrCodePayload({
      invoiceNumber: invoice.documentNumber,
      invoiceDate,
      facilityName: facility.name,
      vatRegistrationNumber: facility.vatRegistrationNumber,
      netAmount: totals.netAmount,
      taxAmount: totals.taxAmount
    }),
    patientName,
    patientMrn:
      encounterDetails?.patient?.medicalRecordNumber ??
      patient?.mrn ??
      patient?.medicalRecordNumber ??
      patient?.patientMrn ??
      '-',
    nationalId: encounterDetails?.patient?.nationalId ?? patient?.nationalId ?? undefined,
    mobileNumber:
      encounterDetails?.patient?.mobileNumber ??
      patient?.mobileNumber ??
      patient?.phoneNumber ??
      undefined,
    providerName: facility.name,
    providerId: facility.providerId,
    ...insuranceFields,
    currency: invoice.currency ?? 'SAR',
    items,
    pricingSummary: pricingSummary ?? null,
    totals:
      pricingSummary != null
        ? {
            grossAmount: formatMoneyValue(pricingSummary.grossAmount),
            discountAmount: formatMoneyValue(pricingSummary.discountAmount),
            taxAmount: formatMoneyValue(pricingSummary.taxAmount),
            netAmount: formatMoneyValue(pricingSummary.netAmount),
            patientShare:
              invoiceType === 'PATIENT'
                ? formatMoneyValue(pricingSummary.netAmount)
                : totals.patientShare,
            insuranceShare:
              invoiceType === 'INSURANCE_CLAIM'
                ? formatMoneyValue(pricingSummary.netAmount)
                : totals.insuranceShare
          }
        : totals
  };
};

export const buildInvoicePrintBatch = ({
  invoices,
  encounterDetails,
  eligibilitySnapshot,
  facility,
  chargeContext
}: {
  invoices: PatientFinancialInvoice[];
  encounterDetails: EncounterInvoiceDetails;
  eligibilitySnapshot?: BillingEligibilitySnapshot | null;
  facility: FacilityPrintInfo;
  chargeContext: InvoicePrintChargeContext;
}): InvoicePrintData[] =>
  invoices.map(invoice =>
    buildInvoicePrintDataFromEncounter({
      invoice,
      encounterDetails,
      eligibilitySnapshot,
      facility,
      chargeContext
    })
  );
