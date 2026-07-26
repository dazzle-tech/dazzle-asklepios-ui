import type { InvoiceLineItem } from '@/services/billing/financialDocumentAdjustmentService';
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
  amount: number;
  patientShare?: number;
  insuranceShare?: number;
  taxAmount?: number;
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
  totals: {
    grossAmount: number;
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
    amount,
    patientShare,
    insuranceShare,
    taxAmount: formatMoneyValue(billingItem?.taxAmount)
  };
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

  if (chargeRow) {
    return mapChargeRowToPrintItem(
      chargeRow,
      findBillingItem(
        chargeContext,
        chargeRow.chargeLineId,
        chargeRow.patientServiceProductId
      ),
      invoiceType
    );
  }

  const billingItem = findBillingItem(
    chargeContext,
    lineItem.chargeLineId,
    lineItem.patientServiceProductId
  );

  const patientShare =
    formatMoneyValue(billingItem?.patientResponsibilityAmount) ||
    (invoiceType === 'PATIENT' ? formatMoneyValue(lineItem.netAmount) : 0);
  const insuranceShare =
    formatMoneyValue(billingItem?.insuranceResponsibilityAmount) ||
    (invoiceType === 'INSURANCE_CLAIM' ? formatMoneyValue(lineItem.netAmount) : 0);

  const amount = formatMoneyValue(lineItem.netAmount);
  const serviceName =
    lineItem.itemDescription?.trim() &&
    !isTechnicalBillingLabel(lineItem.itemDescription, billingItem?.billingItemType)
      ? lineItem.itemDescription.trim()
      : '-';

  return {
    serviceCode:
      billingItem?.priceListItemCode?.trim() ||
      (lineItem.itemCode?.trim() &&
      !isTechnicalBillingLabel(lineItem.itemCode, billingItem?.billingItemType)
        ? lineItem.itemCode.trim()
        : '-') ||
      '-',
    serviceName,
    serviceType: formatBillingItemType(billingItem?.billingItemType),
    quantity: Number(lineItem.quantity ?? 1),
    unitPrice: formatMoneyValue(lineItem.unitPrice),
    amount,
    patientShare,
    insuranceShare,
    taxAmount: formatMoneyValue(lineItem.taxAmount)
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

const buildTotals = (items: InvoicePrintLineItem[]) => {
  const grossAmount = items.reduce(
    (sum, item) => sum + formatMoneyValue(item.quantity) * formatMoneyValue(item.unitPrice),
    0
  );
  const taxAmount = items.reduce((sum, item) => sum + formatMoneyValue(item.taxAmount), 0);
  const netAmount = items.reduce((sum, item) => sum + formatMoneyValue(item.amount), 0);
  const patientShare = items.reduce((sum, item) => sum + formatMoneyValue(item.patientShare), 0);
  const insuranceShare = items.reduce(
    (sum, item) => sum + formatMoneyValue(item.insuranceShare),
    0
  );

  return {
    grossAmount,
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
      ? buildTotals(items)
      : {
          grossAmount: formatMoneyValue(invoice.totalAmount),
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
  encounterDetails,
  eligibilitySnapshot,
  patient,
  facility,
  chargeContext
}: {
  invoice: PatientFinancialInvoice;
  lineItems: InvoiceLineItem[];
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
      ? buildTotals(items)
      : {
          grossAmount: formatMoneyValue(invoice.totalAmount),
          taxAmount: 0,
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
    totals
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
