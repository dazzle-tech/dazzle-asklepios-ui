import type {
  EncounterBillingItemSummary,
  EncounterBillingSummary,
  PatientEncounter,
  PatientServiceAndProduct
} from '@/types/model-types-new';
import { formatDateWithoutSeconds } from '@/utils';
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
  summary: EncounterBillingSummary | null | undefined
): number => {
  const fromSummary = Number(summary?.patientResponsibilityAmount ?? 0);
  if (fromSummary > 0) return fromSummary;

  return (summary?.items ?? []).reduce(
    (total, item) => total + Number(item.patientResponsibilityAmount ?? 0),
    0
  );
};

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
 * Invoice / patient-account balance is handled in the Invoices step.
 */
export const computeEncounterRemainingToPay = (
  summary: EncounterBillingSummary | null | undefined
): number => {
  const outstanding = Number(summary?.patientOutstandingAmount ?? 0);
  if (outstanding > 0) {
    return computeAmountToCollect(summary);
  }

  const patientShare = computeEncounterPatientShare(summary);
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

  if (patientAmount <= 0) return 'SETTLED';
  if (remaining <= 0 && allocated >= patientAmount) return 'SETTLED';
  if (remaining <= 0 && allocated > 0) return 'SETTLED';
  if (reserved > 0 && remaining > 0) return 'PARTIAL';
  if (reserved > 0 && remaining <= 0) return 'RESERVED';
  return 'UNPAID';
};

export const isRowCollectable = (row: UnifiedBillingChargeRow): boolean =>
  resolveRowPaymentStatus(row) !== 'SETTLED' &&
  computeRowRemainingAmount(row) > 0;

export const formatBillingTimestamp = (value?: string | null): string => {
  if (!value) return '-';
  return formatDateWithoutSeconds(value);
};

export const makeRequestId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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

export const isPreAuthRejected = (status?: string | null): boolean =>
  String(status ?? '').toUpperCase() === 'REJECTED';

export const buildTimelineEvents = (
  encounter: PatientEncounter | null | undefined,
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[]
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
        encounter.encounterType,
        getEncounterLifecycleStatus(encounter),
        getEncounterTreatmentStatus(encounter)
      ]
        .filter(Boolean)
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

    events.push({
      id: `psp-${row.id}`,
      type: 'SERVICE_CHARGED',
      label: 'Service / product added',
      timestamp: rowAny.createdDate ?? null,
      detail: [
        row.serviceSource,
        row.billingItemType,
        rowAny.itemName ?? `Item #${row.id}`
      ]
        .filter(Boolean)
        .join(' · ')
    });

    if (isPreAuthRejected(rowAny.preAuthorizationStatus)) {
      events.push({
        id: `pre-auth-rejected-${row.id}`,
        type: 'PRE_AUTH_REJECTED',
        label: 'Waseel pre-authorization rejected',
        timestamp: rowAny.createdDate ?? null,
        detail: rowAny.itemName ?? `Item #${row.id}`
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

const resolvePspItemName = (row: PatientServiceAndProduct): string => {
  const rowAny = row as PatientServiceAndProduct & { itemName?: string | null };
  if (rowAny.itemName) return rowAny.itemName;

  if (row.serviceId) return `Service #${row.serviceId}`;
  if (row.procedureId) return `Procedure #${row.procedureId}`;
  if (row.diagnosticTestId) return `Diagnostic #${row.diagnosticTestId}`;
  if (row.brandMedicationId) return `Medication #${row.brandMedicationId}`;
  return `Item #${row.id}`;
};

export const mapSummaryItemToRow = (
  item: EncounterBillingItemSummary
): UnifiedBillingChargeRow => ({
  id: `line-${item.chargeLineId}`,
  patientServiceProductId: item.patientServiceProductId,
  chargeLineId: item.chargeLineId,
  source: item.priceSource ?? 'BILLING_ENGINE',
  billingItemType: item.billingItemType ?? '-',
  itemCode: item.itemCode,
  itemName: item.itemName ?? `Line #${item.chargeLineId}`,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  setupUnitPrice: item.setupUnitPrice,
  priceSource: item.priceSource,
  netAmount: item.netAmount,
  patientAmount: item.patientResponsibilityAmount,
  insuranceAmount: item.insuranceResponsibilityAmount,
  outstandingAmount: item.outstandingAmount,
  reservedAmount: item.reservedAmount,
  allocatedAmount: item.allocatedAmount,
  currency: item.currency ?? 'SAR',
  status: item.status,
  chargedAt: null,
  isBilled: true
});

export const mapPspItemToRow = (
  row: PatientServiceAndProduct
): UnifiedBillingChargeRow => {
  const rowAny = row as PatientServiceAndProduct & {
    createdDate?: string | null;
    preAuthorizationStatus?: string | null;
    itemCode?: string | null;
  };

  const netAmount =
    Number(row.unitPrice ?? 0) * Number(row.quantity ?? 1) -
    Number(row.discountAmount ?? 0) -
    Number(row.exemptionAmount ?? 0) +
    Number(row.taxAmount ?? 0);

  return {
    id: `psp-${row.id}`,
    patientServiceProductId: row.id,
    chargeLineId: null,
    source: row.serviceSource ?? 'SERVICE_AND_PRODUCT',
    billingItemType: row.billingItemType,
    itemCode: rowAny.itemCode ?? null,
    itemName: resolvePspItemName(row),
    quantity: row.quantity,
    unitPrice: row.unitPrice,
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
  pspRows: PatientServiceAndProduct[]
): UnifiedBillingChargeRow[] => {
  const billedPspIds = new Set(
    (summary?.items ?? [])
      .map(item => item.patientServiceProductId)
      .filter((id): id is number => id != null)
  );

  const summaryRows = (summary?.items ?? []).map(mapSummaryItemToRow);
  const unbilledPspRows = pspRows
    .filter(row => !billedPspIds.has(row.id))
    .map(mapPspItemToRow);

  return [...summaryRows, ...unbilledPspRows];
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
