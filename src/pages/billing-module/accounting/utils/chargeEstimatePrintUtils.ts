import type { EncounterInvoiceDetails } from '@/services/billing/invoiceGenerationService';
import type { PatientEncounter } from '@/types/model-types-new';
import { formatBillingItemType } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import type { FacilityPrintInfo } from '@/pages/billing-module/invoices/invoicePrintUtils';

import {
  computeRowRemainingAmount,
  formatBillingTimestamp,
  resolveEncounterNumber,
  resolvePatientDisplayName,
  resolvePatientMrn,
  type BillingCoverageType,
  type UnifiedBillingChargeRow
} from './billingAccountingUtils';

export type ChargeEstimatePrintLine = {
  itemCode: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  patientShare: number;
  insuranceShare: number;
  appliedAmount: number;
  reservedAmount: number;
  remainingAmount: number;
};

export type ChargeEstimatePrintData = {
  printedAt: string;
  coverageType: BillingCoverageType;
  visitNumber: string;
  visitDate?: string;
  facilityName: string;
  facilityAddress?: string;
  vatRegistrationNumber?: string;
  patientName: string;
  patientMrn: string;
  nationalId?: string;
  mobileNumber?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  memberNumber?: string;
  benefitClass?: string;
  currency: string;
  items: ChargeEstimatePrintLine[];
  totals: {
    netAmount: number;
    patientShare: number;
    insuranceShare: number;
    appliedAmount: number;
    reservedAmount: number;
    remainingAmount: number;
  };
};

type ChargeEstimateInsuranceSource = {
  payerName?: string | null;
  insuranceCompanyName?: string | null;
  insuranceCompany?: string | null;
  policyNumber?: string | null;
  memberId?: string | null;
  membershipNumber?: string | null;
  memberNumber?: string | null;
  className?: string | null;
  policyClassName?: string | null;
};

const toMoney = (value?: number | null) => Number(value ?? 0);

const firstText = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const trimmed = String(value ?? '').trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
};

const formatVisitDate = (value?: string | Date | null) => {
  if (value == null || value === '') {
    return undefined;
  }

  const formatted = formatBillingTimestamp(String(value));
  return formatted === '-' ? undefined : formatted;
};

const resolveVisitNumber = (
  encounterDetails?: EncounterInvoiceDetails | null,
  encounter?: PatientEncounter | null,
  encounterId?: number | null
) =>
  firstText(
    encounterDetails?.encounterNumber,
    resolveEncounterNumber(encounter)
  ) ?? (encounterId != null ? `#${encounterId}` : '-');

const resolveInsuranceFields = (
  coverageType: BillingCoverageType,
  insurance?: ChargeEstimateInsuranceSource | null,
  encounterDetails?: EncounterInvoiceDetails | null
) => {
  if (coverageType !== 'INSURANCE') {
    return {};
  }

  const snapshot = encounterDetails?.eligibilitySnapshot;

  return {
    insuranceCompany: firstText(
      insurance?.payerName,
      insurance?.insuranceCompanyName,
      insurance?.insuranceCompany,
      snapshot?.policyHolder
    ),
    policyNumber: firstText(insurance?.policyNumber, snapshot?.policyNumber),
    memberNumber: firstText(
      insurance?.memberId,
      insurance?.membershipNumber,
      insurance?.memberNumber,
      snapshot?.memberId
    ),
    benefitClass: firstText(
      snapshot?.policyClassName,
      snapshot?.network,
      insurance?.policyClassName,
      insurance?.className
    )
  };
};

const mapChargeRowToEstimateLine = (
  row: UnifiedBillingChargeRow
): ChargeEstimatePrintLine => {
  const quantity = Number(row.quantity ?? 1);

  return {
    itemCode: firstText(row.itemCode) ?? '-',
    itemName: firstText(row.itemName) ?? '-',
    itemType: formatBillingItemType(row.billingItemType),
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unitPrice: toMoney(row.unitPrice),
    netAmount: toMoney(row.netAmount),
    patientShare: toMoney(row.patientAmount),
    insuranceShare: toMoney(row.insuranceAmount),
    appliedAmount: toMoney(row.allocatedAmount),
    reservedAmount: toMoney(row.reservedAmount),
    remainingAmount: computeRowRemainingAmount(row)
  };
};

export const formatEstimateQuantity = (quantity: number) =>
  Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);

export const buildChargeEstimatePrintData = ({
  rows,
  patient,
  encounter,
  encounterDetails,
  facility,
  coverageType,
  insurance,
  encounterId,
  currency
}: {
  rows: UnifiedBillingChargeRow[];
  patient?: any;
  encounter?: PatientEncounter | null;
  encounterDetails?: EncounterInvoiceDetails | null;
  facility: FacilityPrintInfo;
  coverageType: BillingCoverageType;
  insurance?: ChargeEstimateInsuranceSource | null;
  encounterId?: number | null;
  currency: string;
}): ChargeEstimatePrintData => {
  const items = rows.map(mapChargeRowToEstimateLine);
  const encounterAny = encounter as
    | (PatientEncounter & {
        encounterDate?: string | Date | null;
        visitDate?: string | Date | null;
      })
    | null
    | undefined;

  const totals = items.reduce(
    (acc, item) => ({
      netAmount: acc.netAmount + item.netAmount,
      patientShare: acc.patientShare + item.patientShare,
      insuranceShare: acc.insuranceShare + item.insuranceShare,
      appliedAmount: acc.appliedAmount + item.appliedAmount,
      reservedAmount: acc.reservedAmount + item.reservedAmount,
      remainingAmount: acc.remainingAmount + item.remainingAmount
    }),
    {
      netAmount: 0,
      patientShare: 0,
      insuranceShare: 0,
      appliedAmount: 0,
      reservedAmount: 0,
      remainingAmount: 0
    }
  );

  return {
    printedAt: new Date().toLocaleString(),
    coverageType,
    visitNumber: resolveVisitNumber(encounterDetails, encounter, encounterId),
    visitDate: formatVisitDate(
      encounterDetails?.encounterDate ??
        encounterAny?.encounterDate ??
        encounterAny?.visitDate ??
        encounter?.createdDate
    ),
    facilityName: facility.name,
    facilityAddress: facility.address,
    vatRegistrationNumber: facility.vatRegistrationNumber,
    patientName:
      firstText(encounterDetails?.patient?.fullName, resolvePatientDisplayName(patient)) ??
      '-',
    patientMrn:
      firstText(
        encounterDetails?.patient?.medicalRecordNumber,
        resolvePatientMrn(patient)
      ) ?? '-',
    nationalId: firstText(
      encounterDetails?.patient?.nationalId,
      patient?.nationalId
    ),
    mobileNumber: firstText(
      encounterDetails?.patient?.mobileNumber,
      patient?.mobileNumber,
      patient?.phoneNumber
    ),
    ...resolveInsuranceFields(coverageType, insurance, encounterDetails),
    currency,
    items,
    totals
  };
};
