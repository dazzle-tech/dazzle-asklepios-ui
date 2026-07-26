import type {
  FinancialDocumentAdjustment,
  FinancialDocumentAdjustmentItem,
  InvoiceLineItem
} from '@/services/billing/financialDocumentAdjustmentService';
import type {
  BillingEligibilitySnapshot,
  EncounterInvoiceDetails,
  PatientFinancialInvoice
} from '@/services/billing/invoiceGenerationService';
import type { EncounterBillingItemSummary } from '@/types/model-types-new';
import {
  formatBillingItemType,
  isTechnicalBillingLabel
} from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';

import type { InvoicePrintChargeContext } from './useInvoicePrintLookups';
import type { FacilityPrintInfo, InvoicePrintLineItem } from './invoicePrintUtils';
import { invoiceStatusLabel } from './invoicePrintUtils';

export type AdjustmentPrintData = {
  documentNumber: string;
  documentDate: string;
  documentType: 'CREDIT_NOTE' | 'DEBIT_NOTE';
  invoiceType: 'PATIENT' | 'INSURANCE_CLAIM';
  originalInvoiceNumber: string;
  adjustmentReason?: string;
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
  providerName?: string;
  providerId?: string;
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

const formatMoneyValue = (value?: number) => Number(value ?? 0);

export const adjustmentTypeLabel = (
  documentType: AdjustmentPrintData['documentType'],
  invoiceType: AdjustmentPrintData['invoiceType']
) => {
  const base =
    documentType === 'CREDIT_NOTE' ? 'Credit Note' : 'Debit Note';
  return invoiceType === 'INSURANCE_CLAIM' ? `Insurance Claim ${base}` : base;
};

const buildQrCodePayload = ({
  documentType,
  documentNumber,
  documentDate,
  originalInvoiceNumber,
  facilityName,
  vatRegistrationNumber,
  netAmount
}: {
  documentType: AdjustmentPrintData['documentType'];
  documentNumber: string;
  documentDate: string;
  originalInvoiceNumber: string;
  facilityName: string;
  vatRegistrationNumber?: string;
  netAmount: number;
}) =>
  [
    `${documentType === 'CREDIT_NOTE' ? 'Credit Note' : 'Debit Note'}: ${documentNumber}`,
    `Original Invoice: ${originalInvoiceNumber}`,
    `Date: ${documentDate}`,
    `Facility: ${facilityName}`,
    vatRegistrationNumber ? `VAT: ${vatRegistrationNumber}` : null,
    `Net: ${netAmount.toFixed(2)}`
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

const resolveAdjustmentLineDetails = (
  item: FinancialDocumentAdjustmentItem,
  invoiceLineItems: InvoiceLineItem[],
  chargeContext: InvoicePrintChargeContext
) => {
  const parentLine =
    item.parentDocumentItemId != null
      ? invoiceLineItems.find(line => line.id === item.parentDocumentItemId)
      : undefined;

  const chargeLineId = item.chargeLineId ?? parentLine?.chargeLineId ?? null;
  const patientServiceProductId = parentLine?.patientServiceProductId ?? null;

  const chargeRow =
    chargeContext.chargeRows.find(
      row =>
        (chargeLineId != null && Number(row.chargeLineId) === Number(chargeLineId)) ||
        (patientServiceProductId != null &&
          Number(row.patientServiceProductId) === Number(patientServiceProductId))
    ) ?? null;

  const billingItem = findBillingItem(
    chargeContext,
    chargeLineId,
    patientServiceProductId
  );

  if (chargeRow?.itemName?.trim()) {
    return {
      serviceName: chargeRow.itemName.trim(),
      serviceType: formatBillingItemType(chargeRow.billingItemType),
      taxAmount: formatMoneyValue(billingItem?.taxAmount ?? parentLine?.taxAmount)
    };
  }

  if (
    parentLine?.itemDescription?.trim() &&
    !isTechnicalBillingLabel(parentLine.itemDescription, billingItem?.billingItemType)
  ) {
    return {
      serviceName: parentLine.itemDescription.trim(),
      serviceType: formatBillingItemType(billingItem?.billingItemType),
      taxAmount: formatMoneyValue(parentLine.taxAmount)
    };
  }

  if (
    item.itemDescription?.trim() &&
    !isTechnicalBillingLabel(item.itemDescription, billingItem?.billingItemType)
  ) {
    return {
      serviceName: item.itemDescription.trim(),
      serviceType: formatBillingItemType(billingItem?.billingItemType),
      taxAmount: formatMoneyValue(parentLine?.taxAmount)
    };
  }

  return {
    serviceName: '-',
    serviceType: formatBillingItemType(billingItem?.billingItemType),
    taxAmount: formatMoneyValue(parentLine?.taxAmount)
  };
};

const mapAdjustmentItemToPrintItem = (
  item: FinancialDocumentAdjustmentItem,
  invoiceLineItems: InvoiceLineItem[],
  chargeContext: InvoicePrintChargeContext,
  invoiceType: AdjustmentPrintData['invoiceType']
): InvoicePrintLineItem => {
  const { serviceName, serviceType, taxAmount } = resolveAdjustmentLineDetails(
    item,
    invoiceLineItems,
    chargeContext
  );

  const amount = formatMoneyValue(item.netAmount);

  return {
    serviceCode: '-',
    serviceName,
    serviceType,
    quantity: Number(item.quantity ?? 1),
    unitPrice: formatMoneyValue(item.unitPrice),
    amount,
    patientShare: invoiceType === 'PATIENT' ? amount : 0,
    insuranceShare: invoiceType === 'INSURANCE_CLAIM' ? amount : 0,
    taxAmount
  };
};

const buildTotals = (items: InvoicePrintLineItem[], fallbackNetAmount: number) => {
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
    netAmount: netAmount || fallbackNetAmount,
    patientShare,
    insuranceShare
  };
};

const resolveVisitNumber = (
  encounterDetails: EncounterInvoiceDetails | null | undefined,
  encounterId: number
) => encounterDetails?.encounterNumber ?? `Visit #${encounterId}`;

const resolveInsuranceFields = (
  parentInvoice: PatientFinancialInvoice,
  eligibilitySnapshot?: BillingEligibilitySnapshot | null
) => ({
  eligibilityReference:
    parentInvoice.eligibilityReference ??
    eligibilitySnapshot?.eligibilityResponseId ??
    undefined,
  claimReference: parentInvoice.claimReference ?? undefined,
  policyNumber: eligibilitySnapshot?.policyNumber ?? undefined,
  memberNumber: eligibilitySnapshot?.memberId ?? undefined,
  benefitClass: eligibilitySnapshot?.network ?? undefined,
  insuranceCompany: eligibilitySnapshot?.policyHolder ?? undefined
});

export const buildAdjustmentPrintData = ({
  adjustment,
  parentInvoice,
  originalInvoiceNumber,
  invoiceLineItems,
  encounterDetails,
  eligibilitySnapshot,
  patient,
  facility,
  chargeContext
}: {
  adjustment: FinancialDocumentAdjustment;
  parentInvoice: PatientFinancialInvoice;
  originalInvoiceNumber: string;
  invoiceLineItems: InvoiceLineItem[];
  encounterDetails?: EncounterInvoiceDetails | null;
  eligibilitySnapshot?: BillingEligibilitySnapshot | null;
  patient?: any;
  facility: FacilityPrintInfo;
  chargeContext: InvoicePrintChargeContext;
}): AdjustmentPrintData => {
  const documentType =
    String(adjustment.documentType ?? '').toUpperCase() === 'DEBIT_NOTE'
      ? 'DEBIT_NOTE'
      : 'CREDIT_NOTE';

  const invoiceType =
    String(adjustment.documentSubtype ?? parentInvoice.documentSubtype ?? 'PATIENT').toUpperCase() ===
    'INSURANCE_CLAIM'
      ? 'INSURANCE_CLAIM'
      : 'PATIENT';

  const items = (adjustment.items ?? []).map(item =>
    mapAdjustmentItemToPrintItem(item, invoiceLineItems, chargeContext, invoiceType)
  );

  const totals = buildTotals(items, formatMoneyValue(adjustment.totalAmount));

  const documentDate = adjustment.createdDate
    ? String(adjustment.createdDate).substring(0, 19).replace('T', ' ')
    : new Date().toLocaleString();

  const insuranceFields = resolveInsuranceFields(parentInvoice, eligibilitySnapshot);
  const composedPatientName = [patient?.firstName, patient?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const patientName =
    encounterDetails?.patient?.fullName ??
    (composedPatientName || patient?.fullName || patient?.name || '-');

  return {
    documentNumber: adjustment.documentNumber,
    documentDate,
    documentType,
    invoiceType,
    originalInvoiceNumber,
    adjustmentReason: adjustment.adjustmentReason ?? undefined,
    status: invoiceStatusLabel(adjustment.status),
    visitNumber: resolveVisitNumber(encounterDetails ?? null, parentInvoice.encounterId),
    visitDate: encounterDetails?.encounterDate
      ? String(encounterDetails.encounterDate).substring(0, 10)
      : undefined,
    facilityName: facility.name,
    facilityAddress: facility.address,
    vatRegistrationNumber: facility.vatRegistrationNumber,
    qrCodePayload: buildQrCodePayload({
      documentType,
      documentNumber: adjustment.documentNumber,
      documentDate,
      originalInvoiceNumber,
      facilityName: facility.name,
      vatRegistrationNumber: facility.vatRegistrationNumber,
      netAmount: totals.netAmount
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
    currency: adjustment.currency ?? parentInvoice.currency ?? 'SAR',
    items,
    totals
  };
};
