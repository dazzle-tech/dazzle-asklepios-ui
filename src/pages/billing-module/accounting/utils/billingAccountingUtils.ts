import type {
  EncounterBillingItemSummary,
  EncounterBillingSummary,
  PatientEncounter,
  PatientServiceAndProduct,
  BillingPaymentResult
} from '@/types/model-types-new';
import type { PaymentReceiptData } from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  isTechnicalBillingLabel,
  formatBillingItemType,
  resolveBillingItemName
} from '@/pages/patient/patient-profile/PatientQuickAppoinment/paymentPreviewUtils';
import {
  getEncounterLifecycleStatus,
  getEncounterTreatmentStatus
} from '@/utils/encounterStatusHelpers';

export type BillingTimelineEventType =
  | 'ENCOUNTER_REGISTERED'
  | 'TREATMENT_STARTED'
  | 'CHARGE_OPENED'
  | 'SERVICE_CHARGED'
  | 'PRE_AUTH_REJECTED';

export type BillingTimelineEvent = {
  id: string;
  type: BillingTimelineEventType;
  label: string;
  timestamp: string | null;
  detail?: string;
};

export type UnifiedBillingChargeRow = {
  id: string;
  patientServiceProductId: number | null;
  chargeLineId: number | null;
  source: string;
  billingItemType: string;
  itemCode: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  setupUnitPrice?: number | null;
  priceSource?: string | null;
  netAmount: number;
  patientAmount: number;
  insuranceAmount: number;
  outstandingAmount: number;
  reservedAmount?: number;
  allocatedAmount?: number;
  currency: string;
  status: string;
  chargedAt: string | null;
  preAuthorizationStatus?: string | null;
  isBilled: boolean;
};

export type RowPaymentStatus = 'SETTLED' | 'RESERVED' | 'PARTIAL' | 'UNPAID';

export const ROW_PAYMENT_STATUS_LABELS: Record<RowPaymentStatus, string> = {
  SETTLED: 'Settled',
  RESERVED: 'Reserved',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid'
};

export const ROW_PAYMENT_STATUS_COLORS: Record<
  RowPaymentStatus,
  'green' | 'blue' | 'orange' | 'red'
> = {
  SETTLED: 'green',
  RESERVED: 'blue',
  PARTIAL: 'orange',
  UNPAID: 'red'
};

export const toNumericId = (val: unknown): number | null => {
  if (val == null || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const resolvePatientId = (patient: any): number | null =>
  toNumericId(patient?.id) ??
  toNumericId(patient?.patientId) ??
  toNumericId(patient?.key);

export const toNumber = (value: unknown, defaultValue = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

export const extractResponseList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.object)) return response.object;
  return [];
};

export const normalizeBillingError = (error: any): string => {
  const data = error?.data ?? error ?? {};
  const message =
    data?.detail ?? data?.message ?? data?.title ?? error?.error ?? 'Unexpected billing error';
  const traceId = data?.traceId ?? data?.requestId ?? data?.correlationId;
  return traceId ? `${message}\nTrace ID: ${traceId}` : message;
};

export type PrepareServiceRow = {
  id: number;
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
  patientShare?: number | null;
  insuranceShare?: number | null;
};

export type BillingServiceLookup = {
  serviceId: number;
  serviceName: string;
};

export const buildServiceCatalog = (servicesResponse: unknown): BillingServiceLookup[] =>
  extractResponseList(servicesResponse)
    .map((service: any) => ({
      serviceId: toNumber(service?.id ?? service?.serviceId),
      serviceName: String(service?.name ?? service?.serviceName ?? '').trim()
    }))
    .filter(
      (service): service is BillingServiceLookup =>
        service.serviceId > 0 && service.serviceName.length > 0
    );

export const mergeServiceCatalogs = (
  ...catalogs: BillingServiceLookup[][]
): BillingServiceLookup[] => {
  const byId = new Map<number, string>();
  catalogs.flat().forEach(service => {
    byId.set(service.serviceId, service.serviceName);
  });
  return [...byId.entries()].map(([serviceId, serviceName]) => ({
    serviceId,
    serviceName
  }));
};

const getPspSourceId = (
  psp: PatientServiceAndProduct | null | undefined
): number | null => {
  if (!psp) {
    return null;
  }

  const rowAny = psp as PatientServiceAndProduct & {
    sourceId?: number | null;
    SourceId?: number | null;
  };

  return rowAny.sourceId ?? rowAny.SourceId ?? null;
};

export const resolveCatalogItemName = (
  billingItemType: string | null | undefined,
  psp: PatientServiceAndProduct | null | undefined,
  sourceId: number | null | undefined,
  serviceCatalog: BillingServiceLookup[] = [],
  medicationNames: Record<number, string> = {}
): string | null => {
  const type = String(billingItemType ?? '').toUpperCase();
  const pspSourceId = getPspSourceId(psp);

  if (type === 'SERVICE' || type === 'CONSULTATION') {
    const candidateIds = [
      psp?.serviceId,
      sourceId,
      pspSourceId
    ]
      .filter((id): id is number => id != null)
      .map(Number);

    for (const id of candidateIds) {
      const serviceName = serviceCatalog
        .find(service => service.serviceId === id)
        ?.serviceName?.trim();
      if (serviceName) {
        return serviceName;
      }
    }
  }

  if (type === 'MEDICATION') {
    const candidateIds = [
      psp?.brandMedicationId,
      sourceId,
      pspSourceId
    ]
      .filter((id): id is number => id != null)
      .map(Number);

    for (const id of candidateIds) {
      const medicationName = medicationNames[id]?.trim();
      if (medicationName) {
        return medicationName;
      }
    }
  }

  return null;
};

export const collectServiceIdsForLookup = (
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[]
): number[] => {
  const ids = new Set<number>();

  pspRows.forEach(row => {
    const billingType = String(row.billingItemType ?? '').toUpperCase();
    if (billingType === 'SERVICE' || billingType === 'CONSULTATION') {
      if (row.serviceId != null) {
        ids.add(Number(row.serviceId));
      }
      const pspSourceId = getPspSourceId(row);
      if (pspSourceId != null) {
        ids.add(Number(pspSourceId));
      }
    }
  });

  (summary?.items ?? []).forEach(item => {
    const billingType = String(item.billingItemType ?? '').toUpperCase();
    if (
      (billingType === 'SERVICE' || billingType === 'CONSULTATION') &&
      item.sourceId != null
    ) {
      ids.add(Number(item.sourceId));
    }
  });

  return [...ids];
};

export const collectMedicationIdsForLookup = (
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[]
): number[] => {
  const ids = new Set<number>();

  pspRows.forEach(row => {
    if (String(row.billingItemType ?? '').toUpperCase() === 'MEDICATION') {
      if (row.brandMedicationId != null) {
        ids.add(Number(row.brandMedicationId));
      }
      const pspSourceId = getPspSourceId(row);
      if (pspSourceId != null) {
        ids.add(Number(pspSourceId));
      }
    }
  });

  (summary?.items ?? []).forEach(item => {
    if (
      String(item.billingItemType ?? '').toUpperCase() === 'MEDICATION' &&
      item.sourceId != null
    ) {
      ids.add(Number(item.sourceId));
    }
  });

  return [...ids];
};

export const buildMedicationNameLookup = (
  medicationsResponse: unknown
): Record<number, string> => {
  const lookup: Record<number, string> = {};

  extractResponseList(medicationsResponse).forEach((medication: any) => {
    const id = toNumber(medication?.id);
    const name = String(medication?.name ?? '').trim();
    if (id > 0 && name) {
      lookup[id] = name;
    }
  });

  return lookup;
};

/** Total open patient obligation across legacy charges, billing, invoices, and debit. */
export const computePatientRemainingBalance = (
  ledgerSummary: { totalDebt?: number } | null | undefined,
  invoiceOutstandingTotal = 0
): number => {
  const ledgerDebt = Number(ledgerSummary?.totalDebt ?? 0);
  const invoiceOutstanding = Number(invoiceOutstandingTotal ?? 0);
  return Math.max(ledgerDebt, invoiceOutstanding);
};

/** Patient-level wallet available — matches Patient Billing Side / ledger summary. */
export const resolvePatientWalletAvailable = (
  ledgerSummary: { walletBalance?: number } | null | undefined,
  encounterWalletAvailable?: number | null,
  legacyWalletBalance?: number | null
): number => {
  if (ledgerSummary != null) {
    return Number(ledgerSummary.walletBalance ?? 0);
  }

  const encounterWallet = Number(encounterWalletAvailable ?? NaN);
  if (Number.isFinite(encounterWallet)) {
    return encounterWallet;
  }

  return Number(legacyWalletBalance ?? 0);
};

/** Patient-level wallet reserved — matches Patient Billing Side / ledger summary. */
export const resolvePatientWalletReserved = (
  ledgerSummary: { reservedBalance?: number } | null | undefined,
  encounterWalletReserved?: number | null
): number => {
  if (ledgerSummary != null) {
    return Number(ledgerSummary.reservedBalance ?? 0);
  }

  return Number(encounterWalletReserved ?? 0);
};

export const formatMoney = (
  amount: number | null | undefined,
  currency = 'SAR'
): string => {
  const value = Number(amount ?? 0);
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`;
};

/** Sum of advance reserved against charge lines on this encounter. */
export const sumEncounterReservedAmount = (
  summary: EncounterBillingSummary | null | undefined
): number =>
  (summary?.items ?? []).reduce(
    (total, item) => total + Number(item.reservedAmount ?? 0),
    0
  );

/** Total patient share for this encounter (charge-level, not patient account). */
export const computeEncounterPatientShare = (
  summary: EncounterBillingSummary | null | undefined,
  chargeRows: UnifiedBillingChargeRow[] = []
): number => {
  const fromSummary = Number(summary?.patientResponsibilityAmount ?? 0);
  const fromItems =
    fromSummary > 0
      ? fromSummary
      : (summary?.items ?? []).reduce(
          (total, item) => total + Number(item.patientResponsibilityAmount ?? 0),
          0
        );

  const unbilledShare = chargeRows
    .filter(isRowAwaitingBilling)
    .reduce(
      (total, row) => total + Number(row.patientAmount ?? row.netAmount ?? 0),
      0
    );

  return fromItems + unbilledShare;
};

export const computeUnbilledEncounterRemaining = (
  chargeRows: UnifiedBillingChargeRow[] = []
): number =>
  chargeRows
    .filter(isRowAwaitingBilling)
    .reduce((total, row) => total + computeRowRemainingAmount(row), 0);

export const computeUnbilledEncounterNetAmount = (
  chargeRows: UnifiedBillingChargeRow[] = []
): number =>
  chargeRows
    .filter(isRowAwaitingBilling)
    .reduce((total, row) => total + Number(row.netAmount ?? 0), 0);

/** Wallet reservation + allocation already applied on this encounter. */
export const computeEncounterCoveredAmount = (
  summary: EncounterBillingSummary | null | undefined
): number => {
  const allocated = Number(summary?.patientAllocatedAmount ?? 0);
  const reserved = sumEncounterReservedAmount(summary);
  return allocated + reserved;
};

/**
 * Remaining amount to collect or post to debit for this encounter only.
 * When an invoice exists, includes invoice outstanding (e.g. invoice-level tax/discount delta).
 */
export const computeEncounterRemainingToPay = (
  summary: EncounterBillingSummary | null | undefined,
  chargeRows: UnifiedBillingChargeRow[] = []
): number => {
  const unbilledRemaining = computeUnbilledEncounterRemaining(chargeRows);

  const invoiceOutstanding = Number(summary?.invoiceOutstandingAmount ?? 0);
  if (invoiceOutstanding > 0) {
    return invoiceOutstanding + unbilledRemaining;
  }

  const debitSettled = Number(summary?.patientDebitSettledAmount ?? 0);
  if (debitSettled > 0 && summary?.chargeStatus === 'CLOSED') {
    return debitSettled + unbilledRemaining;
  }

  const outstanding = Number(summary?.patientOutstandingAmount ?? 0);
  if (outstanding > 0) {
    return computeAmountToCollect(summary) + unbilledRemaining;
  }

  const patientShare = computeEncounterPatientShare(summary, chargeRows);
  const covered = computeEncounterCoveredAmount(summary);
  return Math.max(0, patientShare - covered);
};

/** Patient outstanding minus advance already reserved on this encounter. */
export const computeAmountToCollect = (
  summary: EncounterBillingSummary | null | undefined
): number => {
  const patientDue = Number(summary?.patientOutstandingAmount ?? 0);
  const reservedOnEncounter = sumEncounterReservedAmount(summary);
  return Math.max(0, patientDue - reservedOnEncounter);
};

/** Remaining amount to collect for one charge row after reservations/allocation. */
export const computeRowRemainingAmount = (row: UnifiedBillingChargeRow): number => {
  const outstanding = Number(row.outstandingAmount ?? 0);
  const patientAmount = Number(row.patientAmount ?? 0);
  const reservedAmount = Number(row.reservedAmount ?? 0);
  const allocatedAmount = Number(row.allocatedAmount ?? 0);

  if (outstanding > 0) {
    return Math.max(0, outstanding - reservedAmount);
  }

  return Math.max(0, patientAmount - allocatedAmount - reservedAmount);
};

/** @deprecated use computeRowRemainingAmount */
export const computeRowAmountToCollect = computeRowRemainingAmount;

export const resolveRowPaymentStatus = (
  row: UnifiedBillingChargeRow
): RowPaymentStatus => {
  const patientAmount = Number(row.patientAmount ?? 0);
  const remaining = computeRowRemainingAmount(row);
  const reserved = Number(row.reservedAmount ?? 0);
  const allocated = Number(row.allocatedAmount ?? 0);
  const amountDue = Math.max(patientAmount, remaining + allocated + reserved);

  if (amountDue <= 0) return 'SETTLED';
  if (remaining <= 0 && allocated >= amountDue) return 'SETTLED';
  if (remaining <= 0 && allocated > 0 && allocated < amountDue) return 'PARTIAL';
  if (reserved > 0 && remaining > 0) return 'PARTIAL';
  if (reserved > 0 && remaining <= 0) return 'RESERVED';
  return 'UNPAID';
};

export const isRowCollectable = (row: UnifiedBillingChargeRow): boolean =>
  row.patientServiceProductId != null &&
  resolveRowPaymentStatus(row) !== 'SETTLED' &&
  computeRowRemainingAmount(row) > 0;

/** Row has an amount due but billing has not created a charge line yet. */
export const isRowAwaitingBilling = (row: UnifiedBillingChargeRow): boolean =>
  row.chargeLineId == null && isRowCollectable(row);

export const formatBillingTimestamp = (value?: string | null): string => {
  if (!value) return '-';
  return formatDateWithoutSeconds(value);
};

export const makeRequestId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export type BillingCoverageType = 'SELF_PAY' | 'INSURANCE';

/** True when the encounter summary already has insurance responsibility or balances. */
export const hasEncounterInsuranceBilling = (
  summary: EncounterBillingSummary | null | undefined
): boolean => {
  if (!summary) return false;

  const headerInsurance =
    Number(summary.insuranceResponsibilityAmount ?? 0) +
    Number(summary.insuranceOutstandingAmount ?? 0) +
    Number(summary.insuranceAllocatedAmount ?? 0);

  if (headerInsurance > 0) return true;

  return (summary.items ?? []).some(
    item => Number(item.insuranceResponsibilityAmount ?? 0) > 0
  );
};

/** Show insurance summary metrics when insurance billing applies to this encounter. */
export const shouldShowInsuranceSummary = (
  summary: EncounterBillingSummary | null | undefined,
  coverageType: BillingCoverageType = 'SELF_PAY'
): boolean => coverageType === 'INSURANCE' || hasEncounterInsuranceBilling(summary);

export const resolvePatientDisplayName = (patient: any): string => {
  const composed = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ').trim();
  return composed || patient?.fullName || patient?.name || '-';
};

export const resolvePatientMrn = (patient: any): string =>
  String(patient?.mrn ?? patient?.medicalRecordNumber ?? patient?.patientMrn ?? '-');

export const buildWalletDepositReceipt = ({
  paymentResult,
  patient,
  encounter,
  facilityName = 'Healthcare Facility',
  currency,
  paymentMethodLabel,
  notes
}: {
  paymentResult: BillingPaymentResult;
  patient?: any;
  encounter?: PatientEncounter | null;
  facilityName?: string;
  currency: string;
  paymentMethodLabel: string;
  notes?: string;
}): PaymentReceiptData => {
  const amount = Number(paymentResult.paymentAmount ?? 0);
  const walletAvailable = Number(paymentResult.walletAvailableBalance ?? 0);

  const receiptNotes = [
    notes?.trim(),
    walletAvailable > 0
      ? `Wallet available after deposit: ${formatMoney(walletAvailable, currency)}`
      : null
  ]
    .filter(Boolean)
    .join('\n');

  return {
    receiptNumber: paymentResult.paymentNumber ?? String(paymentResult.paymentId ?? '-'),
    transactionNumber: paymentResult.paymentTransactionNumber ?? '-',
    paymentDate: new Date().toLocaleString(),
    patientName: resolvePatientDisplayName(patient),
    patientMrn: resolvePatientMrn(patient),
    encounterNumber: resolveEncounterNumber(encounter) ?? 'Advance wallet',
    facilityName,
    coverageType: 'Wallet deposit',
    currency,
    paymentAmount: amount,
    paymentMethod: paymentMethodLabel,
    chargeNumber: '-',
    items: [
      {
        name: 'Wallet advance deposit',
        type: 'ADVANCE',
        quantity: 1,
        unitPrice: amount,
        netAmount: amount,
        patientShare: amount
      }
    ],
    totals: {
      grossAmount: amount,
      discountAmount: 0,
      exemptionAmount: 0,
      taxAmount: 0,
      netAmount: amount,
      patientResponsibilityAmount: amount,
      insuranceResponsibilityAmount: 0,
      patientOutstandingAmount: 0,
      isPreview: false
    },
    notes: receiptNotes || undefined
  };
};

export const buildBillingPaymentReceipt = ({
  paymentResult,
  patient,
  encounter,
  facilityName = 'Healthcare Facility',
  billingSummary,
  paymentMethodLabel = 'Payment',
  paymentDate
}: {
  paymentResult: BillingPaymentResult;
  patient?: any;
  encounter?: PatientEncounter | null;
  facilityName?: string;
  billingSummary?: EncounterBillingSummary | null;
  paymentMethodLabel?: string;
  paymentDate?: string;
}): PaymentReceiptData => {
  const currency = String(paymentResult.currency ?? 'SAR');
  const amount = Number(paymentResult.paymentAmount ?? 0);
  const summaryItems = billingSummary?.items ?? [];

  const reservationItems = (paymentResult.reservations ?? [])
    .map(reservation => {
      const summaryItem = summaryItems.find(
        item =>
          Number(item.patientServiceProductId) ===
          Number(reservation.patientServiceProductId)
      );
      const lineAmount =
        Number(reservation.patientResponsibilityAmount ?? 0) ||
        Number(reservation.reservedAmount ?? 0);

      const serviceName =
        reservation.itemDescription?.trim() ||
        summaryItem?.itemName?.trim() ||
        (summaryItem
          ? resolveBillingItemName(summaryItem, [])
          : `Service #${reservation.patientServiceProductId ?? '-'}`);

      const serviceType =
        formatBillingItemType(
          reservation.billingItemType ?? summaryItem?.billingItemType
        ) || 'Service';

      return {
        name: serviceName,
        type: serviceType,
        quantity: 1,
        unitPrice: lineAmount,
        netAmount: lineAmount,
        patientShare: lineAmount
      };
    })
    .filter(item => item.netAmount > 0);

  const items =
    reservationItems.length > 0
      ? reservationItems
      : [
          {
            name: 'Payment collected',
            type: 'PAYMENT',
            quantity: 1,
            unitPrice: amount,
            netAmount: amount,
            patientShare: amount
          }
        ];

  const netAmount = items.reduce((sum, item) => sum + Number(item.netAmount ?? 0), 0);

  return {
    receiptNumber:
      paymentResult.paymentNumber ?? String(paymentResult.paymentId ?? '-'),
    transactionNumber: paymentResult.paymentTransactionNumber ?? '-',
    paymentDate: paymentDate ?? new Date().toLocaleString(),
    patientName: resolvePatientDisplayName(patient),
    patientMrn: resolvePatientMrn(patient),
    encounterNumber: resolveEncounterNumber(encounter) ?? 'Patient payment',
    facilityName,
    coverageType: 'Self Pay',
    currency,
    paymentAmount: amount,
    paymentMethod: paymentMethodLabel,
    chargeNumber: billingSummary?.chargeNumber ?? '-',
    items,
    totals: {
      grossAmount: netAmount,
      discountAmount: 0,
      exemptionAmount: 0,
      taxAmount: 0,
      netAmount,
      patientResponsibilityAmount: netAmount,
      insuranceResponsibilityAmount: 0,
      patientOutstandingAmount: 0,
      isPreview: false
    }
  };
};

/** Primary action label for adding cash/card funds to the patient wallet. */
export const WALLET_DEPOSIT_BUTTON_LABEL = 'Add to wallet';

export const BILLING_PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CREDIT_DEBIT_CARD: 'Credit / debit card',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank transfer',
  DEDUCT_FROM_FREE_BALANCE: 'Wallet (use advance balance)'
};

export const resolveBillingPaymentCategory = (paymentMethodCode: string): string => {
  if (paymentMethodCode === 'CREDIT_DEBIT_CARD') return 'CARD';
  if (paymentMethodCode === 'BANK_TRANSFER') return 'BANK_TRANSFER';
  if (paymentMethodCode === 'CHEQUE') return 'CHEQUE';
  if (paymentMethodCode === 'DEDUCT_FROM_FREE_BALANCE') return 'WALLET';
  return 'CASH';
};

export const isWalletPaymentMethod = (paymentMethodCode: string): boolean =>
  paymentMethodCode === 'DEDUCT_FROM_FREE_BALANCE';

export const computeWalletCollectAmounts = (
  amountDue: number,
  walletAvailable: number,
  requestedAmount?: number
) => {
  const due = Math.max(0, Number(amountDue));
  const available = Math.max(0, Number(walletAvailable));
  const requested =
    requestedAmount != null && requestedAmount > 0
      ? Number(requestedAmount)
      : due;
  const applyAmount = Math.min(due, available, requested);

  return {
    applyAmount,
    remainingAfter: Math.max(0, due - applyAmount)
  };
};

export const isPreAuthRejected = (status?: string | null): boolean =>
  String(status ?? '').toUpperCase() === 'REJECTED';

export const buildTimelineEvents = (
  encounter: PatientEncounter | null | undefined,
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[],
  serviceCatalog: BillingServiceLookup[] = [],
  medicationNames: Record<number, string> = {}
): BillingTimelineEvent[] => {
  const events: BillingTimelineEvent[] = [];

  if (encounter) {
    const encounterAny = encounter as PatientEncounter & {
      createdAt?: string | null;
      encounterNumber?: string | null;
    };

    events.push({
      id: 'encounter-registered',
      type: 'ENCOUNTER_REGISTERED',
      label: 'Encounter registered',
      timestamp:
        encounterAny.createdAt ??
        encounter.encounterDate?.toString() ??
        null,
      detail: [
        encounterAny.encounterNumber
          ? `#${encounterAny.encounterNumber}`
          : null,
        formatBillingEnum(encounter.encounterType),
        formatEncounterLifecycleLabel(encounter),
        formatEncounterTreatmentLabel(encounter)
      ]
        .filter(part => part && part !== '-')
        .join(' · ')
    });

    if (encounter.startedDate) {
      events.push({
        id: 'treatment-started',
        type: 'TREATMENT_STARTED',
        label: 'Treatment started',
        timestamp: encounter.startedDate,
        detail: encounter.startedBy
          ? `By ${encounter.startedBy}`
          : undefined
      });
    }
  }

  if (summary?.chargeDate) {
    events.push({
      id: 'charge-opened',
      type: 'CHARGE_OPENED',
      label: 'Charge opened',
      timestamp: summary.chargeDate,
      detail: summary.chargeNumber
        ? `Charge #${summary.chargeNumber}`
        : undefined
    });
  }

  pspRows.forEach(row => {
    const rowAny = row as PatientServiceAndProduct & {
      createdDate?: string | null;
      itemName?: string | null;
      preAuthorizationStatus?: string | null;
    };

    const itemLabel =
      resolveCatalogItemName(
        row.billingItemType,
        row,
        getPspSourceId(row),
        serviceCatalog,
        medicationNames
      ) ??
      (rowAny.itemName &&
      !isTechnicalBillingLabel(rowAny.itemName, row.billingItemType)
        ? rowAny.itemName.trim()
        : null);

    events.push({
      id: `psp-${row.id}`,
      type: 'SERVICE_CHARGED',
      label: 'Service / product added',
      timestamp: rowAny.createdDate ?? null,
      detail: [
        formatBillingSource(row.serviceSource),
        formatBillingItemType(row.billingItemType),
        itemLabel
      ]
        .filter(part => part && part !== '-')
        .join(' · ')
    });

    if (isPreAuthRejected(rowAny.preAuthorizationStatus)) {
      events.push({
        id: `pre-auth-rejected-${row.id}`,
        type: 'PRE_AUTH_REJECTED',
        label: 'Waseel pre-authorization rejected',
        timestamp: rowAny.createdDate ?? null,
        detail:
          itemLabel ??
          (rowAny.itemName &&
          !isTechnicalBillingLabel(rowAny.itemName, row.billingItemType)
            ? rowAny.itemName.trim()
            : undefined)
      });
    }
  });

  return events
    .filter(event => event.timestamp || event.type === 'PRE_AUTH_REJECTED')
    .sort((first, second) => {
      const firstTime = first.timestamp
        ? new Date(first.timestamp).getTime()
        : 0;
      const secondTime = second.timestamp
        ? new Date(second.timestamp).getTime()
        : 0;
      return firstTime - secondTime;
    });
};

const resolvePspItemName = (
  row: PatientServiceAndProduct,
  serviceCatalog: BillingServiceLookup[] = [],
  medicationNames: Record<number, string> = {}
): string => {
  const rowAny = row as PatientServiceAndProduct & { itemName?: string | null };
  if (
    rowAny.itemName?.trim() &&
    !isTechnicalBillingLabel(rowAny.itemName, row.billingItemType)
  ) {
    return rowAny.itemName.trim();
  }

  const catalogName = resolveCatalogItemName(
    row.billingItemType,
    row,
    getPspSourceId(row),
    serviceCatalog,
    medicationNames
  );
  if (catalogName) {
    return catalogName;
  }

  return '-';
};

export const formatBillingEnum = (
  value: string | null | undefined
): string => {
  const formatted = formatEnumString(String(value ?? '').trim());
  return formatted || '-';
};

export const formatEncounterLifecycleLabel = (
  encounter: PatientEncounter | null | undefined
): string => formatBillingEnum(getEncounterLifecycleStatus(encounter));

export const formatEncounterTreatmentLabel = (
  encounter: PatientEncounter | null | undefined
): string => formatBillingEnum(getEncounterTreatmentStatus(encounter));

export const formatBillingChargeStatus = (
  status: string | null | undefined
): string => formatBillingEnum(status);

export const resolveEncounterNumber = (
  encounter: PatientEncounter | null | undefined
): string | null => {
  if (!encounter) {
    return null;
  }

  const encounterAny = encounter as PatientEncounter & {
    encounterNumber?: string | null;
    visitId?: string | null;
  };

  const value = String(
    encounterAny.encounterNumber ?? encounterAny.visitId ?? ''
  ).trim();

  return value || null;
};

/** User-facing encounter label such as #E00069 — never the internal database id. */
export const isEncounterClosedForBilling = (
  encounter: { encounterStatus?: string | null } | null | undefined
): boolean => getEncounterLifecycleStatus(encounter) === 'CLOSED';

export const formatEncounterDisplayLabel = (
  encounter: PatientEncounter | null | undefined,
  options?: { withHash?: boolean }
): string | null => {
  const encounterNumber = resolveEncounterNumber(encounter);
  if (!encounterNumber) {
    return null;
  }

  return options?.withHash === false
    ? encounterNumber
    : `#${encounterNumber}`;
};

export const formatBillingSource = (source: string | null | undefined): string =>
  formatBillingEnum(source);

export const formatBillingPriceSource = (
  priceSource: string | null | undefined
): string => {
  const normalized = String(priceSource ?? '').trim();
  return normalized ? formatBillingEnum(normalized) : '-';
};

const resolveChargeRowPriceSource = (
  item: EncounterBillingItemSummary,
  linkedPsp?: PatientServiceAndProduct | null
): string | null => {
  if (item.priceSource?.trim()) {
    return item.priceSource.trim();
  }

  const pspPriceSource = (
    linkedPsp as PatientServiceAndProduct & { priceSource?: string | null }
  )?.priceSource;

  if (pspPriceSource?.trim()) {
    return pspPriceSource.trim();
  }

  if (item.priceListItemCode?.trim()) {
    return 'PRICE_LIST';
  }

  return null;
};

const resolveChargeRowItemName = (
  item: EncounterBillingItemSummary,
  pspRows: PatientServiceAndProduct[] = [],
  serviceCatalog: BillingServiceLookup[] = [],
  medicationNames: Record<number, string> = {}
): string => {
  if (
    item.itemName?.trim() &&
    !isTechnicalBillingLabel(item.itemName, item.billingItemType)
  ) {
    return item.itemName.trim();
  }

  const linkedPsp = pspRows.find(
    row => row.id === item.patientServiceProductId
  );
  const linkedPspName = (
    linkedPsp as PatientServiceAndProduct & { itemName?: string | null }
  )?.itemName;

  if (
    linkedPspName?.trim() &&
    !isTechnicalBillingLabel(linkedPspName, item.billingItemType)
  ) {
    return linkedPspName.trim();
  }

  const catalogName = resolveCatalogItemName(
    item.billingItemType,
    linkedPsp,
    item.sourceId,
    serviceCatalog,
    medicationNames
  );
  if (catalogName) {
    return catalogName;
  }

  if (linkedPsp) {
    const pspName = resolvePspItemName(
      linkedPsp,
      serviceCatalog,
      medicationNames
    );
    if (pspName !== '-') {
      return pspName;
    }
  }

  const serviceRows: PrepareServiceRow[] = serviceCatalog.map(service => ({
    id: service.serviceId,
    serviceId: service.serviceId,
    serviceType: 'SERVICE',
    serviceName: service.serviceName,
    selected: true,
    isExempted: false,
    quantity: 1,
    sequence: 1
  }));

  const resolvedName = resolveBillingItemName(item, serviceRows);
  if (resolvedName !== '-') {
    return resolvedName;
  }

  return '-';
};

export const mapSummaryItemToRow = (
  item: EncounterBillingItemSummary,
  pspRows: PatientServiceAndProduct[] = [],
  chargeDate?: string | null,
  serviceCatalog: BillingServiceLookup[] = [],
  medicationNames: Record<number, string> = {}
): UnifiedBillingChargeRow => {
  const linkedPsp = pspRows.find(row => row.id === item.patientServiceProductId);

  return {
  id:
    item.chargeLineId != null
      ? `line-${item.chargeLineId}`
      : `psp-${item.patientServiceProductId}`,
  patientServiceProductId: item.patientServiceProductId,
  chargeLineId: item.chargeLineId,
  source: linkedPsp?.serviceSource ?? 'BILLING_ENGINE',
  billingItemType: item.billingItemType ?? '-',
  itemCode: item.itemCode,
  itemName: resolveChargeRowItemName(
    item,
    pspRows,
    serviceCatalog,
    medicationNames
  ),
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  setupUnitPrice: item.setupUnitPrice,
  priceSource: resolveChargeRowPriceSource(item, linkedPsp),
  netAmount: item.netAmount,
  patientAmount: Math.max(
    Number(item.patientResponsibilityAmount ?? 0),
    Number(item.outstandingAmount ?? 0)
  ),
  insuranceAmount: item.insuranceResponsibilityAmount,
  outstandingAmount: item.outstandingAmount,
  reservedAmount: item.reservedAmount,
  allocatedAmount: item.allocatedAmount,
  currency: item.currency ?? 'SAR',
  status: item.status,
  chargedAt: item.chargedAt ?? chargeDate ?? null,
  isBilled: item.chargeLineId != null
};
};

export const mapPspItemToRow = (
  row: PatientServiceAndProduct,
  serviceCatalog: BillingServiceLookup[] = [],
  medicationNames: Record<number, string> = {}
): UnifiedBillingChargeRow => {
  const rowAny = row as PatientServiceAndProduct & {
    createdDate?: string | null;
    preAuthorizationStatus?: string | null;
    itemCode?: string | null;
    priceSource?: string | null;
  };

  const netAmount =
    Number(row.unitPrice ?? 0) * Number(row.quantity ?? 1) -
    Number(row.discountAmount ?? 0) -
    Number(row.exemptionAmount ?? 0) +
    Number(row.taxAmount ?? 0);

  const itemName = resolvePspItemName(row, serviceCatalog, medicationNames);

  return {
    id: `psp-${row.id}`,
    patientServiceProductId: row.id,
    chargeLineId: null,
    source: row.serviceSource ?? 'SERVICE_AND_PRODUCT',
    billingItemType: row.billingItemType,
    itemCode: rowAny.itemCode ?? null,
    itemName,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    priceSource: rowAny.priceSource?.trim() || null,
    netAmount,
    patientAmount: netAmount,
    insuranceAmount: 0,
    outstandingAmount: netAmount,
    currency: row.currency ?? 'SAR',
    status: row.isBilled ? 'BILLED' : 'PENDING',
    chargedAt: rowAny.createdDate ?? null,
    preAuthorizationStatus: rowAny.preAuthorizationStatus ?? null,
    isBilled: row.isBilled
  };
};

export const mergeBillingChargeRows = (
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[],
  serviceCatalog: BillingServiceLookup[] = [],
  medicationNames: Record<number, string> = {}
): UnifiedBillingChargeRow[] => {
  const summaryPspIds = new Set(
    (summary?.items ?? [])
      .map(item => item.patientServiceProductId)
      .filter((id): id is number => id != null)
  );

  const summaryRows = (summary?.items ?? []).map(item =>
    mapSummaryItemToRow(
      item,
      pspRows,
      summary?.chargeDate ?? null,
      serviceCatalog,
      medicationNames
    )
  );
  const unbilledPspRows = pspRows
    .filter(row => !summaryPspIds.has(row.id))
    .map(row => mapPspItemToRow(row, serviceCatalog, medicationNames));

  const merged = [...summaryRows, ...unbilledPspRows];
  const seenPspIds = new Set<number>();
  return merged.filter(row => {
    const pspId = row.patientServiceProductId;
    if (pspId == null) {
      return true;
    }
    if (seenPspIds.has(pspId)) {
      return false;
    }
    seenPspIds.add(pspId);
    return true;
  });
};

export const findRejectedPreAuthItems = (
  pspRows: PatientServiceAndProduct[]
): PatientServiceAndProduct[] =>
  pspRows.filter(row =>
    isPreAuthRejected(
      (row as PatientServiceAndProduct & { preAuthorizationStatus?: string })
        .preAuthorizationStatus
    )
  );
