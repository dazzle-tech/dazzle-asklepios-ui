import type {
  EncounterBillingItemSummary,
  EncounterBillingSummary,
  PatientEncounter,
  PatientServiceAndProduct,
  BillingPaymentResult,
  BillingRefundResult
} from '@/types/model-types-new';
import type { InvoiceLineItem } from '@/services/billing/financialDocumentAdjustmentService';
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
  preAuthorizationRequired?: boolean | null;
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
  if (error?.data?.userCancelledUncoveredCash || error?.error?.data?.userCancelledUncoveredCash) {
    return '';
  }

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
  serviceCode?: string;
};

export type BillingCatalogLookups = {
  serviceCatalog: BillingServiceLookup[];
  medicationNames: Record<number, string>;
  medicationCodes: Record<number, string>;
  diagnosticTestNames: Record<number, string>;
  diagnosticTestCodes: Record<number, string>;
  procedureNames: Record<number, string>;
  procedureCodes: Record<number, string>;
};

export const emptyBillingCatalogLookups = (): BillingCatalogLookups => ({
  serviceCatalog: [],
  medicationNames: {},
  medicationCodes: {},
  diagnosticTestNames: {},
  diagnosticTestCodes: {},
  procedureNames: {},
  procedureCodes: {}
});

export const buildServiceCatalog = (servicesResponse: unknown): BillingServiceLookup[] =>
  extractResponseList(servicesResponse)
    .map((service: any) => {
      const serviceCode = String(service?.code ?? service?.serviceCode ?? '').trim();
      return {
        serviceId: toNumber(service?.id ?? service?.serviceId),
        serviceName: String(service?.name ?? service?.serviceName ?? '').trim(),
        ...(serviceCode ? { serviceCode } : {})
      };
    })
    .filter(
      (service): service is BillingServiceLookup =>
        service.serviceId > 0 && service.serviceName.length > 0
    );

export const mergeServiceCatalogs = (
  ...catalogs: BillingServiceLookup[][]
): BillingServiceLookup[] => {
  const byId = new Map<number, BillingServiceLookup>();
  catalogs.flat().forEach(service => {
    const existing = byId.get(service.serviceId);
    byId.set(service.serviceId, {
      serviceId: service.serviceId,
      serviceName: service.serviceName || existing?.serviceName || '',
      serviceCode: service.serviceCode || existing?.serviceCode
    });
  });
  return [...byId.values()].filter(
    service => service.serviceId > 0 && service.serviceName.length > 0
  );
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

const DIAGNOSTIC_BILLING_TYPES = ['LABORATORY', 'RADIOLOGY', 'PATHOLOGY'];

const collectCatalogCandidateIds = (
  psp: PatientServiceAndProduct | null | undefined,
  sourceId: number | null | undefined,
  entityId?: number | null
): number[] =>
  [entityId, sourceId, getPspSourceId(psp)]
    .filter((id): id is number => id != null)
    .map(Number);

export const resolveCatalogItemName = (
  billingItemType: string | null | undefined,
  psp: PatientServiceAndProduct | null | undefined,
  sourceId: number | null | undefined,
  lookups: BillingCatalogLookups = emptyBillingCatalogLookups()
): string | null => {
  const type = String(billingItemType ?? '').toUpperCase();
  const {
    serviceCatalog,
    medicationNames,
    diagnosticTestNames,
    procedureNames
  } = lookups;

  if (type === 'SERVICE' || type === 'CONSULTATION') {
    for (const id of collectCatalogCandidateIds(psp, sourceId, psp?.serviceId)) {
      const serviceName = serviceCatalog
        .find(service => service.serviceId === id)
        ?.serviceName?.trim();
      if (serviceName) {
        return serviceName;
      }
    }
  }

  if (type === 'MEDICATION') {
    for (const id of collectCatalogCandidateIds(
      psp,
      sourceId,
      psp?.brandMedicationId
    )) {
      const medicationName = medicationNames[id]?.trim();
      if (medicationName) {
        return medicationName;
      }
    }
  }

  if (DIAGNOSTIC_BILLING_TYPES.includes(type)) {
    for (const id of collectCatalogCandidateIds(
      psp,
      sourceId,
      psp?.diagnosticTestId
    )) {
      const diagnosticTestName = diagnosticTestNames[id]?.trim();
      if (diagnosticTestName) {
        return diagnosticTestName;
      }
    }
  }

  if (type === 'PROCEDURE') {
    for (const id of collectCatalogCandidateIds(psp, sourceId, psp?.procedureId)) {
      const procedureName = procedureNames[id]?.trim();
      if (procedureName) {
        return procedureName;
      }
    }
  }

  return null;
};

export const resolveCatalogItemCode = (
  billingItemType: string | null | undefined,
  psp: PatientServiceAndProduct | null | undefined,
  sourceId: number | null | undefined,
  lookups: BillingCatalogLookups = emptyBillingCatalogLookups()
): string | null => {
  const type = String(billingItemType ?? '').toUpperCase();
  const {
    serviceCatalog,
    medicationCodes,
    diagnosticTestCodes,
    procedureCodes
  } = lookups;

  if (type === 'SERVICE' || type === 'CONSULTATION') {
    for (const id of collectCatalogCandidateIds(psp, sourceId, psp?.serviceId)) {
      const serviceCode = serviceCatalog
        .find(service => service.serviceId === id)
        ?.serviceCode?.trim();
      if (serviceCode) {
        return serviceCode;
      }
    }
  }

  if (type === 'MEDICATION') {
    for (const id of collectCatalogCandidateIds(
      psp,
      sourceId,
      psp?.brandMedicationId
    )) {
      const medicationCode = medicationCodes[id]?.trim();
      if (medicationCode) {
        return medicationCode;
      }
    }
  }

  if (DIAGNOSTIC_BILLING_TYPES.includes(type)) {
    for (const id of collectCatalogCandidateIds(
      psp,
      sourceId,
      psp?.diagnosticTestId
    )) {
      const diagnosticTestCode = diagnosticTestCodes[id]?.trim();
      if (diagnosticTestCode) {
        return diagnosticTestCode;
      }
    }
  }

  if (type === 'PROCEDURE') {
    for (const id of collectCatalogCandidateIds(psp, sourceId, psp?.procedureId)) {
      const procedureCode = procedureCodes[id]?.trim();
      if (procedureCode) {
        return procedureCode;
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

export const buildMedicationCodeLookup = (
  medicationsResponse: unknown
): Record<number, string> => {
  const lookup: Record<number, string> = {};

  extractResponseList(medicationsResponse).forEach((medication: any) => {
    const id = toNumber(medication?.id);
    const code = String(medication?.code ?? '').trim();
    if (id > 0 && code) {
      lookup[id] = code;
    }
  });

  return lookup;
};

export const collectDiagnosticTestIdsForLookup = (
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[]
): number[] => {
  const ids = new Set<number>();

  pspRows.forEach(row => {
    const billingType = String(row.billingItemType ?? '').toUpperCase();
    if (DIAGNOSTIC_BILLING_TYPES.includes(billingType)) {
      if (row.diagnosticTestId != null) {
        ids.add(Number(row.diagnosticTestId));
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
      DIAGNOSTIC_BILLING_TYPES.includes(billingType) &&
      item.sourceId != null
    ) {
      ids.add(Number(item.sourceId));
    }
  });

  return [...ids];
};

export const collectProcedureIdsForLookup = (
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[]
): number[] => {
  const ids = new Set<number>();

  pspRows.forEach(row => {
    const billingType = String(row.billingItemType ?? '').toUpperCase();
    if (billingType === 'PROCEDURE') {
      if (row.procedureId != null) {
        ids.add(Number(row.procedureId));
      }
      const pspSourceId = getPspSourceId(row);
      if (pspSourceId != null) {
        ids.add(Number(pspSourceId));
      }
    }
  });

  (summary?.items ?? []).forEach(item => {
    if (
      String(item.billingItemType ?? '').toUpperCase() === 'PROCEDURE' &&
      item.sourceId != null
    ) {
      ids.add(Number(item.sourceId));
    }
  });

  return [...ids];
};

export const buildDiagnosticTestNameLookup = (
  diagnosticTestsResponse: unknown
): Record<number, string> => {
  const lookup: Record<number, string> = {};

  extractResponseList(diagnosticTestsResponse).forEach((test: any) => {
    const id = toNumber(test?.id);
    const name = String(test?.name ?? '').trim();
    if (id > 0 && name) {
      lookup[id] = name;
    }
  });

  return lookup;
};

export const buildDiagnosticTestCodeLookup = (
  diagnosticTestsResponse: unknown
): Record<number, string> => {
  const lookup: Record<number, string> = {};

  extractResponseList(diagnosticTestsResponse).forEach((test: any) => {
    const id = toNumber(test?.id);
    const code = String(test?.internalCode ?? test?.code ?? '').trim();
    if (id > 0 && code) {
      lookup[id] = code;
    }
  });

  return lookup;
};

export const buildProcedureNameLookup = (
  proceduresResponse: unknown
): Record<number, string> => {
  const lookup: Record<number, string> = {};

  extractResponseList(proceduresResponse).forEach((procedure: any) => {
    const id = toNumber(procedure?.id);
    const name = String(procedure?.name ?? '').trim();
    if (id > 0 && name) {
      lookup[id] = name;
    }
  });

  return lookup;
};

export const buildProcedureCodeLookup = (
  proceduresResponse: unknown
): Record<number, string> => {
  const lookup: Record<number, string> = {};

  extractResponseList(proceduresResponse).forEach((procedure: any) => {
    const id = toNumber(procedure?.id);
    const code = String(procedure?.code ?? '').trim();
    if (id > 0 && code) {
      lookup[id] = code;
    }
  });

  return lookup;
};

/** Total open patient obligation — ledger summary already includes invoice outstanding. */
export const computePatientRemainingBalance = (
  ledgerSummary: { totalDebt?: number } | null | undefined,
  invoiceOutstandingTotal = 0
): number => {
  if (ledgerSummary != null) {
    return Number(ledgerSummary.totalDebt ?? 0);
  }

  return Number(invoiceOutstandingTotal ?? 0);
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

/** Available + reserved — usable for invoice wallet payments. */
export const resolvePatientWalletSpendable = (
  ledgerSummary:
    | { walletBalance?: number; reservedBalance?: number }
    | null
    | undefined,
  encounterWalletAvailable?: number | null,
  encounterWalletReserved?: number | null
): number =>
  resolvePatientWalletAvailable(
    ledgerSummary,
    encounterWalletAvailable
  ) +
  resolvePatientWalletReserved(ledgerSummary, encounterWalletReserved);

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

export const resolvePaymentReceiptNumber = (paymentResult?: {
  receiptNumber?: string | null;
  paymentNumber?: string | null;
  paymentId?: number | null;
} | null): string =>
  paymentResult?.receiptNumber ??
  paymentResult?.paymentNumber ??
  String(paymentResult?.paymentId ?? '-');

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
  const unbilledShare = encounterHasInvoice(summary)
    ? 0
    : chargeRows
        .filter(isRowAwaitingBilling)
        .reduce(
          (total, row) => total + Number(row.patientAmount ?? 0),
          0
        );

  const hasInvoice = encounterHasInvoice(summary);

  if (hasInvoice) {
    const invoicePaid = Number(summary?.invoicePaidAmount ?? 0);
    const invoiceOutstanding = Number(summary?.invoiceOutstandingAmount ?? 0);
    const invoicedShare = invoicePaid + invoiceOutstanding;

    if (invoicedShare > 0) {
      return invoicedShare + unbilledShare;
    }
  }

  const fromSummary = Number(summary?.patientResponsibilityAmount ?? 0);
  const fromItems =
    fromSummary > 0
      ? fromSummary
      : (summary?.items ?? []).reduce(
          (total, item) => total + Number(item.patientResponsibilityAmount ?? 0),
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

/** Resolve the active patient invoice for an encounter from summary or issued documents. */
export const resolveEncounterPatientInvoiceId = (
  encounterId: number | null | undefined,
  summary: EncounterBillingSummary | null | undefined,
  financialDocuments: Array<{
    id: number;
    encounterId?: number;
    documentType?: string;
    documentSubtype?: string | null;
    status?: string;
  }> = []
): number | null => {
  if (
    encounterId != null &&
    Number(summary?.encounterId) === Number(encounterId) &&
    Number(summary?.invoiceId ?? 0) > 0
  ) {
    return Number(summary.invoiceId);
  }

  if (encounterId == null) {
    return null;
  }

  const match = financialDocuments
    .filter(
      doc =>
        doc.documentType === 'INVOICE' &&
        (doc.documentSubtype === 'PATIENT' || doc.documentSubtype == null) &&
        doc.status !== 'CANCELLED' &&
        Number(doc.encounterId) === Number(encounterId)
    )
    .sort((left, right) => Number(right.id) - Number(left.id))[0];

  return match?.id ?? null;
};

export const mergeEncounterSummaryWithInvoiceContext = (
  summary: EncounterBillingSummary,
  invoiceId: number | null,
  invoiceAdjustments?: {
    documentNumber?: string;
    invoiceTotal?: number;
    totalPaid?: number;
    outstandingBalance?: number;
    currency?: string;
  } | null
): EncounterBillingSummary => {
  if (invoiceId == null && invoiceAdjustments == null) {
    return summary;
  }

  return {
    ...summary,
    invoiceId: invoiceId ?? summary.invoiceId ?? null,
    invoiceNumber: invoiceAdjustments?.documentNumber ?? summary.invoiceNumber ?? null,
    invoiceTotalAmount:
      invoiceAdjustments?.invoiceTotal ?? summary.invoiceTotalAmount ?? 0,
    invoicePaidAmount: invoiceAdjustments?.totalPaid ?? summary.invoicePaidAmount ?? 0,
    invoiceOutstandingAmount:
      invoiceAdjustments?.outstandingBalance ?? summary.invoiceOutstandingAmount ?? 0,
    currency: summary.currency ?? (invoiceAdjustments?.currency as EncounterBillingSummary['currency']) ?? null
  };
};

export const encounterHasInvoice = (
  summary: EncounterBillingSummary | null | undefined
): boolean =>
  Number(summary?.invoiceId ?? 0) > 0 ||
  Boolean(String(summary?.invoiceNumber ?? '').trim()) ||
  Number(summary?.invoiceTotalAmount ?? 0) > 0;

/** Pre-invoice services only — skip once an invoice owns the encounter balance. */
export const computePreInvoiceUnbilledRemaining = (
  summary: EncounterBillingSummary | null | undefined,
  chargeRows: UnifiedBillingChargeRow[] = []
): number =>
  encounterHasInvoice(summary) ? 0 : computeUnbilledEncounterRemaining(chargeRows);

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
  const base = allocated + reserved;

  if (!encounterHasInvoice(summary)) {
    return base;
  }

  const invoicePaid = Number(summary?.invoicePaidAmount ?? 0);
  const walletSettled = Number(summary?.patientWalletSettledAmount ?? 0);

  return Math.max(base, walletSettled, invoicePaid);
};

/**
 * Remaining amount to collect or post to debit for this encounter only.
 * When an invoice exists, invoice outstanding is authoritative once issued —
 * charge-level patient outstanding can stay stale after credit notes / wallet refunds.
 */
export const computeEncounterRemainingToPay = (
  summary: EncounterBillingSummary | null | undefined,
  chargeRows: UnifiedBillingChargeRow[] = [],
  _ledgerTotalDebt?: number | null
): number => {
  const unbilledRemaining = computePreInvoiceUnbilledRemaining(summary, chargeRows);
  const hasInvoice = encounterHasInvoice(summary);
  const invoiceOutstanding = Number(summary?.invoiceOutstandingAmount ?? 0);

  if (hasInvoice) {
    if (invoiceOutstanding > 0) {
      return invoiceOutstanding + unbilledRemaining;
    }

    return unbilledRemaining;
  }

  const headerDue =
    summary?.chargeId != null ? computeAmountToCollect(summary) : 0;
  const rowRemaining = chargeRows.reduce(
    (total, row) => total + computeRowRemainingAmount(row),
    0
  );

  return Math.max(headerDue, rowRemaining, unbilledRemaining);
};

/** Patient outstanding minus advance already reserved on this encounter. */
export const computeAmountToCollect = (
  summary: EncounterBillingSummary | null | undefined
): number => {
  const patientDue = Number(summary?.patientOutstandingAmount ?? 0);
  const reservedOnEncounter = sumEncounterReservedAmount(summary);
  return Math.max(0, patientDue - reservedOnEncounter);
};

/** Remaining patient amount to collect for one charge row after reservations/allocation. */
export const computeRowRemainingAmount = (row: UnifiedBillingChargeRow): number => {
  const patientAmount = Number(row.patientAmount ?? 0);
  const reservedAmount = Number(row.reservedAmount ?? 0);
  const allocatedAmount = Number(row.allocatedAmount ?? 0);

  return Math.max(0, patientAmount - allocatedAmount - reservedAmount);
};

/** @deprecated use computeRowRemainingAmount */
export const computeRowAmountToCollect = computeRowRemainingAmount;

export const resolveRowPaymentStatus = (
  row: UnifiedBillingChargeRow,
  summary?: EncounterBillingSummary | null
): RowPaymentStatus => {
  const paidOnInvoice = Number(row.allocatedAmount ?? 0);
  const remainingOnInvoice = Number(row.outstandingAmount ?? NaN);

  if (
    Number.isFinite(remainingOnInvoice) &&
    remainingOnInvoice <= 0 &&
    paidOnInvoice > 0
  ) {
    return 'SETTLED';
  }

  if (
    encounterHasInvoice(summary) &&
    Number(summary?.invoiceOutstandingAmount ?? 0) <= 0 &&
    Number(row.patientAmount ?? 0) > 0 &&
    (row.chargeLineId != null || row.source === 'INVOICE' || row.source === 'DEBIT_NOTE')
  ) {
    return 'SETTLED';
  }

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

export const isRowCollectable = (
  row: UnifiedBillingChargeRow,
  summary?: EncounterBillingSummary | null
): boolean => {
  if (isEncounterChargeCollectionComplete(summary)) {
    return false;
  }

  if (resolveRowPaymentStatus(row, summary) === 'RESERVED') {
    return false;
  }

  if (isPreAuthRequiredRow(row)) {
    const status = row.preAuthorizationStatus;
    if (
      !status ||
      isPreAuthPending(status) ||
      isPreAuthPartial(status)
    ) {
      return false;
    }
  }

  return (
    row.patientServiceProductId != null &&
    resolveRowPaymentStatus(row, summary) !== 'SETTLED' &&
    computeRowRemainingAmount(row) > 0
  );
};

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

export const normalizeBillingCoverageType = (
  value?: string | null
): BillingCoverageType =>
  String(value ?? '').toUpperCase() === 'INSURANCE' ? 'INSURANCE' : 'SELF_PAY';

export const formatBillingCoverageType = (
  value?: string | null
): string => {
  switch (normalizeBillingCoverageType(value)) {
    case 'INSURANCE':
      return 'Insurance';
    case 'SELF_PAY':
      return 'Self Pay';
    default:
      return '-';
  }
};

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
    receiptNumber: resolvePaymentReceiptNumber(paymentResult),
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

export const buildWalletRefundReceipt = ({
  refundResult,
  patient,
  encounter,
  facilityName = 'Healthcare Facility',
  currency,
  paymentMethodLabel,
  notes
}: {
  refundResult: BillingRefundResult;
  patient?: any;
  encounter?: PatientEncounter | null;
  facilityName?: string;
  currency: string;
  paymentMethodLabel: string;
  notes?: string;
}): PaymentReceiptData => {
  const amount = Number(refundResult.refundedAmount ?? refundResult.requestedAmount ?? 0);
  const walletAvailable = Number(refundResult.walletAvailableBalance ?? 0);

  const receiptNotes = [
    notes?.trim(),
    `Wallet available after refund: ${formatMoney(walletAvailable, currency)}`
  ]
    .filter(Boolean)
    .join('\n');

  return {
    receiptNumber:
      refundResult.documentNumber ?? refundResult.refundNumber ?? '-',
    transactionNumber: refundResult.refundPaymentTransactionNumber ?? '-',
    paymentDate: new Date().toLocaleString(),
    patientName: resolvePatientDisplayName(patient),
    patientMrn: resolvePatientMrn(patient),
    encounterNumber: resolveEncounterNumber(encounter) ?? 'Wallet refund',
    facilityName,
    coverageType: 'Wallet refund',
    currency,
    paymentAmount: amount,
    paymentMethod: paymentMethodLabel,
    chargeNumber: '-',
    items: [
      {
        name: 'Available wallet refund',
        type: 'REFUND',
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

export const buildIssuedRefundReceipt = ({
  document,
  patient,
  encounterNumber,
  facilityName = 'Healthcare Facility'
}: {
  document: {
    documentNumber?: string | null;
    totalAmount?: number | null;
    currency?: string | null;
    createdDate?: string | null;
    adjustmentReason?: string | null;
    encounterNumber?: string | null;
  };
  patient?: any;
  encounterNumber?: string | null;
  facilityName?: string;
}): PaymentReceiptData => {
  const amount = Number(document.totalAmount ?? 0);
  const currency = document.currency ?? 'SAR';

  return {
    receiptNumber: document.documentNumber ?? '-',
    transactionNumber: document.documentNumber ?? '-',
    paymentDate: document.createdDate
      ? formatBillingTimestamp(document.createdDate)
      : new Date().toLocaleString(),
    patientName: resolvePatientDisplayName(patient),
    patientMrn: resolvePatientMrn(patient),
    encounterNumber:
      encounterNumber ?? document.encounterNumber ?? 'Wallet refund',
    facilityName,
    coverageType: 'Wallet refund',
    currency,
    paymentAmount: amount,
    paymentMethod: 'Refund',
    chargeNumber: '-',
    items: [
      {
        name: 'Available wallet refund',
        type: 'REFUND',
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
    notes: document.adjustmentReason?.trim() || undefined
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
    receiptNumber: resolvePaymentReceiptNumber(paymentResult),
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

/** Primary action label for returning available wallet funds to the patient. */
export const WALLET_REFUND_BUTTON_LABEL = 'Refund to patient';

export const BILLING_PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  CREDIT_CARD: 'Credit card',
  CREDIT_DEBIT_CARD: 'Credit card',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank transfer',
  DEDUCT_FROM_FREE_BALANCE: 'Deduct from free balance'
};

export type BillingPaymentMethodOption = {
  value: string;
  label: string;
  id?: number | string;
  key?: number | string;
  valueId?: number | string;
};

const BILLING_PAYMENT_METHOD_ORDER = [
  'CASH',
  'CREDIT_CARD',
  'CREDIT_DEBIT_CARD',
  'CHEQUE',
  'BANK_TRANSFER',
  'DEDUCT_FROM_FREE_BALANCE'
];

export const STANDARD_BILLING_PAYMENT_METHODS: BillingPaymentMethodOption[] = [
  { value: 'CASH', label: BILLING_PAYMENT_METHOD_LABELS.CASH },
  { value: 'CREDIT_CARD', label: BILLING_PAYMENT_METHOD_LABELS.CREDIT_CARD },
  {
    value: 'DEDUCT_FROM_FREE_BALANCE',
    label: BILLING_PAYMENT_METHOD_LABELS.DEDUCT_FROM_FREE_BALANCE
  }
];

export const mergeBillingPaymentMethodOptions = (
  enumOptions: BillingPaymentMethodOption[] = [],
  options: {
    exclude?: string[];
  } = {}
): BillingPaymentMethodOption[] => {
  const exclude = new Set(options.exclude ?? []);
  const merged = new Map<string, BillingPaymentMethodOption>();

  enumOptions.forEach(option => {
    if (!option?.value || exclude.has(option.value)) {
      return;
    }

    merged.set(option.value, {
      ...option,
      label:
        BILLING_PAYMENT_METHOD_LABELS[option.value] ??
        option.label ??
        option.value
    });
  });

  STANDARD_BILLING_PAYMENT_METHODS.forEach(option => {
    if (exclude.has(option.value) || merged.has(option.value)) {
      return;
    }

    merged.set(option.value, option);
  });

  return Array.from(merged.values()).sort((left, right) => {
    const leftIndex = BILLING_PAYMENT_METHOD_ORDER.indexOf(left.value);
    const rightIndex = BILLING_PAYMENT_METHOD_ORDER.indexOf(right.value);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.label.localeCompare(right.label);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
};

export const resolveBillingPaymentCategory = (paymentMethodCode: string): string => {
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

export const isPreAuthPartial = (status?: string | null): boolean => {
  const normalized = String(status ?? '').toUpperCase();
  return normalized === 'PARTIAL' || normalized === 'PARTIAL_APPROVAL';
};

export const isPreAuthApproved = (status?: string | null): boolean =>
  String(status ?? '').toUpperCase() === 'APPROVED';

export const isPreAuthPending = (status?: string | null): boolean => {
  const normalized = String(status ?? '').toUpperCase();
  return normalized === 'PENDING_APPROVAL' || normalized === 'PENDING';
};

export const isPreAuthRequiredRow = (
  row: Pick<UnifiedBillingChargeRow, 'preAuthorizationRequired'>
): boolean => row.preAuthorizationRequired === true;

export const isRowFullyReserved = (
  row: UnifiedBillingChargeRow,
  summary?: EncounterBillingSummary | null
): boolean => resolveRowPaymentStatus(row, summary) === 'RESERVED';

export const shouldShowPreAuthRowActions = (
  row: UnifiedBillingChargeRow,
  summary?: EncounterBillingSummary | null
): boolean =>
  isPreAuthRequiredRow(row) &&
  !isRowFullyReserved(row, summary) &&
  (isPreAuthRejected(row.preAuthorizationStatus) ||
    isPreAuthPartial(row.preAuthorizationStatus));

export const findPendingPreAuthItems = (
  pspRows: PatientServiceAndProduct[]
): PatientServiceAndProduct[] =>
  pspRows.filter(row => {
    const rowAny = row as PatientServiceAndProduct & {
      preAuthorizationRequired?: boolean | null;
      preAuthorizationStatus?: string | null;
    };

    if (rowAny.preAuthorizationRequired !== true) {
      return false;
    }

    return (
      isPreAuthPending(rowAny.preAuthorizationStatus) ||
      isPreAuthPartial(rowAny.preAuthorizationStatus)
    );
  });

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
      resolvePspDisplayName(row) !== '-'
        ? resolvePspDisplayName(row)
        : (rowAny.itemName?.trim() || null);

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

const readChargeLineText = (
  item: EncounterBillingItemSummary | Record<string, unknown>,
  ...keys: string[]
): string | null => {
  for (const key of keys) {
    const value = String((item as Record<string, unknown>)?.[key] ?? '').trim();
    if (value) {
      return value;
    }
  }
  return null;
};

const readChargeLineNumber = (
  item: EncounterBillingItemSummary | Record<string, unknown>,
  ...keys: string[]
): number | null => {
  for (const key of keys) {
    const raw = (item as Record<string, unknown>)?.[key];
    if (raw == null || raw === '') {
      continue;
    }
    const value = Number(raw);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

const resolveChargeLineDisplayCode = (
  item: EncounterBillingItemSummary,
  linkedPsp?: PatientServiceAndProduct | null
): string | null =>
  readChargeLineText(item, 'itemCode', 'item_code') ??
  readChargeLineText(linkedPsp ?? {}, 'itemCode', 'item_code');

const resolveChargeLineDisplayName = (
  item: EncounterBillingItemSummary,
  linkedPsp?: PatientServiceAndProduct | null
): string =>
  readChargeLineText(
    item,
    'itemName',
    'item_name',
    'itemDescription',
    'item_description'
  ) ??
  readChargeLineText(linkedPsp ?? {}, 'itemName', 'item_name') ??
  resolveChargeLineDisplayCode(item, linkedPsp) ??
  '-';

const resolveChargeLineServiceSource = (
  item: EncounterBillingItemSummary,
  linkedPsp?: PatientServiceAndProduct | null
): string =>
  readChargeLineText(item, 'serviceSource', 'service_source') ??
  linkedPsp?.serviceSource ??
  'BILLING_ENGINE';

const resolvePspDisplayCode = (
  row: PatientServiceAndProduct,
  lookups: BillingCatalogLookups = emptyBillingCatalogLookups()
): string | null => {
  const rowAny = row as PatientServiceAndProduct & { itemCode?: string | null };
  if (rowAny.itemCode?.trim()) {
    return rowAny.itemCode.trim();
  }

  const catalogCode = resolveCatalogItemCode(
    row.billingItemType,
    row,
    getPspSourceId(row),
    lookups
  );
  if (catalogCode) {
    return catalogCode;
  }

  return null;
};

const resolvePspDisplayName = (
  row: PatientServiceAndProduct,
  lookups: BillingCatalogLookups = emptyBillingCatalogLookups()
): string => {
  const rowAny = row as PatientServiceAndProduct & { itemName?: string | null };
  if (rowAny.itemName?.trim()) {
    return rowAny.itemName.trim();
  }

  const catalogName = resolveCatalogItemName(
    row.billingItemType,
    row,
    getPspSourceId(row),
    lookups
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

/** Billing is locked only when nothing remains to collect — not when the clinical visit is completed. */
export const isEncounterClosedForBilling = (
  encounter:
    | {
        encounterStatus?: string | null;
        billingStatus?: string | null;
        financiallyClosedAt?: string | null;
      }
    | null
    | undefined,
  options?: {
    chargeRows?: UnifiedBillingChargeRow[];
  }
): boolean => {
  const chargeRows = options?.chargeRows ?? [];
  if (chargeRows.some(row => isRowCollectable(row))) {
    return false;
  }

  const billingStatus = String(encounter?.billingStatus ?? '').toUpperCase();
  if (billingStatus === 'FINANCIALLY_CLOSED' || billingStatus === 'INVOICED') {
    return true;
  }

  if (encounter?.financiallyClosedAt) {
    return true;
  }

  return false;
};

export const isBillingChargeFinalized = (
  summary: EncounterBillingSummary | null | undefined
): boolean => String(summary?.chargeStatus ?? '').toUpperCase() === 'CLOSED';

/**
 * Charge-level collection is finished — no more row selection, collect payment, or re-checkout.
 * Stays true after debit/credit notes even when charge rows still show patient outstanding.
 */
export const isEncounterChargeCollectionComplete = (
  summary: EncounterBillingSummary | null | undefined,
  encounter?:
    | {
        billingStatus?: string | null;
        financiallyClosedAt?: string | null;
      }
    | null
): boolean => {
  if (isBillingChargeFinalized(summary)) {
    return true;
  }

  if (encounterHasInvoice(summary)) {
    return true;
  }

  const billingStatus = String(encounter?.billingStatus ?? '').toUpperCase();
  if (billingStatus === 'FINANCIALLY_CLOSED' || billingStatus === 'INVOICED') {
    return true;
  }

  if (encounter?.financiallyClosedAt) {
    return true;
  }

  return false;
};

/** Step 2 services table is view-only after checkout finalize or invoice issuance. */
export const isBillingServicesLocked = (
  summary: EncounterBillingSummary | null | undefined,
  encounter:
    | {
        billingStatus?: string | null;
        financiallyClosedAt?: string | null;
      }
    | null
    | undefined,
  _chargeRows: UnifiedBillingChargeRow[] = []
): boolean => isEncounterChargeCollectionComplete(summary, encounter);

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
  const fromChargeLine = readChargeLineText(
    item,
    'priceSource',
    'price_source'
  );
  if (fromChargeLine) {
    return fromChargeLine;
  }

  if (readChargeLineText(item, 'priceListItemCode', 'price_list_item_code')) {
    return 'PRICE_LIST';
  }

  const pspPriceSource = (
    linkedPsp as PatientServiceAndProduct & { priceSource?: string | null }
  )?.priceSource;

  if (pspPriceSource?.trim()) {
    return pspPriceSource.trim();
  }

  return null;
};

export const mapSummaryItemToRow = (
  item: EncounterBillingItemSummary,
  pspRows: PatientServiceAndProduct[] = [],
  chargeDate?: string | null
): UnifiedBillingChargeRow => {
  const linkedPsp = pspRows.find(row => row.id === item.patientServiceProductId);
  const patientAmount = Number(item.patientResponsibilityAmount ?? 0);
  const allocatedAmount = Number(item.allocatedAmount ?? 0);
  const reservedAmount = Number(item.reservedAmount ?? 0);
  const patientOutstandingAmount = Math.max(
    0,
    patientAmount - allocatedAmount - reservedAmount
  );

  return {
  id:
    item.chargeLineId != null
      ? `line-${item.chargeLineId}`
      : `psp-${item.patientServiceProductId}`,
  patientServiceProductId: item.patientServiceProductId,
  chargeLineId: item.chargeLineId,
  source: resolveChargeLineServiceSource(item, linkedPsp),
  billingItemType: item.billingItemType ?? '-',
  itemCode: resolveChargeLineDisplayCode(item, linkedPsp),
  itemName: resolveChargeLineDisplayName(item, linkedPsp),
  quantity: readChargeLineNumber(item, 'quantity') ?? item.quantity ?? 1,
  unitPrice: readChargeLineNumber(item, 'unitPrice', 'unit_price') ?? item.unitPrice ?? 0,
  setupUnitPrice:
    readChargeLineNumber(item, 'setupUnitPrice', 'setup_unit_price') ??
    item.setupUnitPrice ??
    null,
  priceSource: resolveChargeRowPriceSource(item, linkedPsp),
  netAmount: readChargeLineNumber(item, 'netAmount', 'net_amount') ?? item.netAmount ?? 0,
  patientAmount,
  insuranceAmount: item.insuranceResponsibilityAmount,
  outstandingAmount: patientOutstandingAmount,
  reservedAmount: item.reservedAmount,
  allocatedAmount: item.allocatedAmount,
  currency: item.currency ?? 'SAR',
  status: item.status,
  chargedAt: item.chargedAt ?? chargeDate ?? null,
  preAuthorizationStatus:
    (
      linkedPsp as PatientServiceAndProduct & {
        preAuthorizationStatus?: string | null;
      }
    )?.preAuthorizationStatus ?? null,
  preAuthorizationRequired:
    (
      linkedPsp as PatientServiceAndProduct & {
        preAuthorizationRequired?: boolean | null;
      }
    )?.preAuthorizationRequired ?? null,
  isBilled: item.chargeLineId != null
};
};

export const mapPspItemToRow = (
  row: PatientServiceAndProduct,
  lookups: BillingCatalogLookups = emptyBillingCatalogLookups()
): UnifiedBillingChargeRow => {
  const rowAny = row as PatientServiceAndProduct & {
    createdDate?: string | null;
    preAuthorizationStatus?: string | null;
    preAuthorizationRequired?: boolean | null;
    itemCode?: string | null;
    itemName?: string | null;
    priceSource?: string | null;
  };

  const netAmount =
    Number(row.netAmount ?? 0) ||
    Number(row.unitPrice ?? 0) * Number(row.quantity ?? 1) -
      Number(row.discountAmount ?? 0) -
      Number(row.exemptionAmount ?? 0) +
      Number(row.taxAmount ?? 0);

  const patientShare = Number(row.patientShareAmount ?? 0);
  const insuranceShare = Number(row.insuranceShareAmount ?? 0);
  const hasStoredSplit = patientShare > 0 || insuranceShare > 0;
  const patientAmount = hasStoredSplit ? patientShare : netAmount;

  return {
    id: `psp-${row.id}`,
    patientServiceProductId: row.id,
    chargeLineId: null,
    source: row.serviceSource ?? 'SERVICE_AND_PRODUCT',
    billingItemType: row.billingItemType,
    itemCode: resolvePspDisplayCode(row, lookups),
    itemName: resolvePspDisplayName(row, lookups),
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    priceSource: rowAny.priceSource?.trim() || null,
    netAmount,
    patientAmount,
    insuranceAmount: hasStoredSplit ? insuranceShare : 0,
    outstandingAmount: patientAmount,
    currency: row.currency ?? 'SAR',
    status: row.isBilled ? 'BILLED' : 'PENDING',
    chargedAt: rowAny.createdDate ?? null,
    preAuthorizationStatus: rowAny.preAuthorizationStatus ?? null,
    preAuthorizationRequired: rowAny.preAuthorizationRequired ?? null,
    isBilled: row.isBilled
  };
};

export const mapInvoiceLineItemToRow = (item: InvoiceLineItem): UnifiedBillingChargeRow => {
  const paidAmount = Number(item.paidAmount ?? 0);
  const remainingAmount = Number(item.remainingAmount ?? 0);
  const netAmount = Number(item.netAmount ?? 0);

  return {
    id: `invoice-item-${item.id}`,
    patientServiceProductId: item.patientServiceProductId ?? null,
    chargeLineId: item.chargeLineId ?? null,
    source:
      item.lineSource === 'DEBIT_NOTE'
        ? 'DEBIT_NOTE'
        : item.lineSource === 'INVOICE'
          ? 'INVOICE'
          : 'SERVICE_AND_PRODUCT',
    billingItemType: 'SERVICE',
    itemCode: item.itemCode ?? null,
    itemName: item.itemDescription?.trim() || item.itemCode?.trim() || 'Service',
    quantity: Number(item.quantity ?? 1),
    unitPrice: Number(item.unitPrice ?? 0),
    netAmount,
    patientAmount: netAmount,
    insuranceAmount: 0,
    outstandingAmount: remainingAmount,
    reservedAmount: 0,
    allocatedAmount: paidAmount,
    currency: item.currency ?? 'SAR',
    status: item.status ?? 'BILLED',
    chargedAt: null,
    isBilled: true
  };
};

export const resolveDisplayChargeRows = (
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[],
  invoiceLineItems: InvoiceLineItem[] = [],
  resolvedInvoiceId?: number | null
): UnifiedBillingChargeRow[] => {
  const hasIssuedInvoice =
    encounterHasInvoice(summary) ||
    (resolvedInvoiceId != null && resolvedInvoiceId > 0);

  if (hasIssuedInvoice && invoiceLineItems.length > 0) {
    return invoiceLineItems.map(mapInvoiceLineItemToRow);
  }

  return mergeBillingChargeRows(summary, pspRows, emptyBillingCatalogLookups());
};

export const mergeBillingChargeRows = (
  summary: EncounterBillingSummary | null | undefined,
  pspRows: PatientServiceAndProduct[] = [],
  lookups: BillingCatalogLookups = emptyBillingCatalogLookups()
): UnifiedBillingChargeRow[] => {
  const summaryItems = summary?.items ?? [];

  if (summaryItems.length > 0) {
    return summaryItems.map(item =>
      mapSummaryItemToRow(item, pspRows, summary?.chargeDate ?? null)
    );
  }

  const summaryPspIds = new Set(
    summaryItems
      .map(item => item.patientServiceProductId)
      .filter((id): id is number => id != null)
  );

  const unbilledPspRows = pspRows
    .filter(row => {
      if (summaryPspIds.has(row.id)) {
        return false;
      }

      if (
        encounterHasInvoice(summary) &&
        (row.isBilled ||
          row.billingInvoiceId === summary?.invoiceId ||
          row.billingInvoiceItemId != null)
      ) {
        return false;
      }

      return true;
    })
    .map(row => mapPspItemToRow(row, lookups));

  return unbilledPspRows;
};

export const findRejectedPreAuthItems = (
  pspRows: PatientServiceAndProduct[]
): PatientServiceAndProduct[] =>
  pspRows.filter(row => {
    const rowAny = row as PatientServiceAndProduct & {
      preAuthorizationRequired?: boolean | null;
      preAuthorizationStatus?: string | null;
    };

    return (
      rowAny.preAuthorizationRequired === true &&
      isPreAuthRejected(rowAny.preAuthorizationStatus)
    );
  });
