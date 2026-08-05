import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export type BillableVisit = {
  encounterId: number;
  encounterNumber: string;
  encounterDate?: string;
  departmentId?: number;
  encounterType?: string;
  coverageType: 'SELF_PAY' | 'INSURANCE' | string;
  billingStatus: 'OPEN' | 'FINANCIALLY_CLOSED' | 'INVOICED' | string;
  chargeStatus?: string;
  serviceCount: number;
  netAmount: number;
  currency?: string;
  hasFinalInvoice: boolean;
  invoiceReady: boolean;
  eligibleForBilling: boolean;
};

export type EncounterInvoiceDetails = {
  encounterId: number;
  encounterNumber: string;
  encounterDate?: string;
  departmentId?: number;
  encounterType?: string;
  billingStatus: string;
  financiallyClosedAt?: string;
  financiallyClosedBy?: string;
  coverageType: string;
  eligibilityReference?: string;
  eligibilitySnapshot?: BillingEligibilitySnapshot | null;
  patient: {
    patientId: number;
    medicalRecordNumber?: string;
    fullName?: string;
    nationalId?: string;
    mobileNumber?: string;
  };
  billingSummary: {
    netAmount?: number;
    taxAmount?: number;
    patientOutstandingAmount?: number;
    insuranceOutstandingAmount?: number;
    chargeStatus?: string;
    items?: Array<{
      chargeLineId?: number;
      itemCode?: string;
      itemName?: string;
      quantity?: number;
      unitPrice?: number;
      grossAmount?: number;
      taxAmount?: number;
      netAmount?: number;
      patientResponsibilityAmount?: number;
      insuranceResponsibilityAmount?: number;
    }>;
  };
};

export type PatientFinancialInvoice = {
  id: number;
  documentNumber: string;
  documentType: string;
  documentSubtype?: 'PATIENT' | 'INSURANCE_CLAIM' | string;
  status: string;
  patientId: number;
  encounterId: number;
  totalAmount: number;
  currency?: string;
  eligibilityReference?: string;
  claimReference?: string;
  createdDate?: string;
  parentDocumentId?: number | null;
  adjustmentReason?: string | null;
  billingPaymentId?: number | null;
  encounterNumber?: string | null;
};

export type BillingEligibilitySnapshot = {
  id: number;
  encounterId: number;
  patientId: number;
  patientInsuranceId?: number;
  waseelEligibilityRequestId: number;
  eligibilityResponseId: string;
  memberId?: string;
  policyNumber?: string;
  policyHolder?: string;
  network?: string;
  coverageStatus?: string;
  inforce?: string;
  copaymentPercent?: number;
  copaymentCap?: number;
  frozenAt?: string;
  frozenBy?: string;
  frozen: boolean;
};

export type GenerateInvoiceResult = {
  encounterId: number;
  billingStatus: string;
  coverageType: string;
  invoices: PatientFinancialInvoice[];
};

export type FinancialCloseResult = {
  encounterId: number;
  billingStatus: string;
  financiallyClosedAt?: string;
  financiallyClosedBy?: string;
};

export type FinancialCloseRequest = {
  encounterId: number;
  requestId: string;
};

export type GenerateInvoicesRequest = {
  encounterId: number;
  requestId: string;
};

export const invoiceGenerationService = createApi({
  reducerPath: 'invoiceGenerationService',
  baseQuery: BaseQuery,
  tagTypes: ['BillableVisits', 'EncounterInvoiceDetails', 'PatientFinancialInvoices', 'EligibilitySnapshot'],
  endpoints: builder => ({
    getBillableVisits: builder.query<BillableVisit[], number>({
      query: patientId => ({
        url: `/api/patient/billing/invoice-generation/patients/${patientId}/billable-visits`,
        method: 'GET'
      }),
      providesTags: (_result, _error, patientId) => [
        { type: 'BillableVisits', id: patientId }
      ]
    }),

    getEncounterInvoiceDetails: builder.query<EncounterInvoiceDetails, number>({
      query: encounterId => ({
        url: `/api/patient/billing/invoice-generation/encounters/${encounterId}/details`,
        method: 'GET'
      }),
      providesTags: (_result, _error, encounterId) => [
        { type: 'EncounterInvoiceDetails', id: encounterId }
      ]
    }),

    getPatientFinancialInvoices: builder.query<PatientFinancialInvoice[], number>({
      query: patientId => ({
        url: `/api/patient/billing/invoice-generation/patients/${patientId}/invoices`,
        method: 'GET'
      }),
      providesTags: (_result, _error, patientId) => [
        { type: 'PatientFinancialInvoices', id: patientId }
      ]
    }),

    getPatientFinancialDocuments: builder.query<PatientFinancialInvoice[], number>({
      query: patientId => ({
        url: `/api/patient/billing/invoice-generation/patients/${patientId}/documents`,
        method: 'GET'
      }),
      providesTags: (_result, _error, patientId) => [
        { type: 'PatientFinancialInvoices', id: patientId }
      ]
    }),

    financialCloseEncounter: builder.mutation<
      FinancialCloseResult,
      FinancialCloseRequest
    >({
      query: ({ encounterId, requestId }) => ({
        url: `/api/patient/billing/invoice-generation/encounters/${encounterId}/financial-close`,
        method: 'POST',
        body: { requestId }
      }),
      invalidatesTags: (_result, _error, { encounterId }) => [
        'BillableVisits',
        'PatientFinancialInvoices',
        { type: 'EncounterInvoiceDetails', id: encounterId },
        { type: 'EligibilitySnapshot', id: encounterId }
      ]
    }),

    generateInvoices: builder.mutation<
      GenerateInvoiceResult,
      GenerateInvoicesRequest
    >({
      query: ({ encounterId, requestId }) => ({
        url: `/api/patient/billing/invoice-generation/encounters/${encounterId}/generate-invoices`,
        method: 'POST',
        body: { requestId }
      }),
      invalidatesTags: (_result, _error, { encounterId }) => [
        'BillableVisits',
        'PatientFinancialInvoices',
        { type: 'EncounterInvoiceDetails', id: encounterId },
        { type: 'EncounterBillingSummary', id: String(encounterId) },
        'EncounterBillingSummary',
        'InvoiceAdjustments',
        'InvoiceLineItems'
      ]
    }),

    getEligibilitySnapshot: builder.query<BillingEligibilitySnapshot | null, number>({
      query: encounterId => ({
        url: `/api/patient/billing/invoice-generation/encounters/${encounterId}/eligibility-snapshot`,
        method: 'GET'
      }),
      transformResponse: (response: BillingEligibilitySnapshot | null, meta) => {
        if (meta?.response?.status === 204) {
          return null;
        }
        return response ?? null;
      },
      providesTags: (_result, _error, encounterId) => [
        { type: 'EligibilitySnapshot', id: encounterId }
      ]
    }),

    freezeEligibilitySnapshot: builder.mutation<
      BillingEligibilitySnapshot,
      { encounterId: number; requestId: string; patientInsuranceId?: number | null }
    >({
      query: ({ encounterId, requestId, patientInsuranceId }) => ({
        url: `/api/patient/billing/invoice-generation/encounters/${encounterId}/eligibility-snapshot`,
        method: 'POST',
        body: {
          requestId,
          patientInsuranceId: patientInsuranceId ?? undefined
        }
      }),
      invalidatesTags: (_result, _error, { encounterId }) => [
        { type: 'EligibilitySnapshot', id: encounterId },
        { type: 'EncounterInvoiceDetails', id: encounterId }
      ]
    })
  })
});

export const {
  useGetBillableVisitsQuery,
  useGetEncounterInvoiceDetailsQuery,
  useGetPatientFinancialInvoicesQuery,
  useGetPatientFinancialDocumentsQuery,
  useLazyGetEncounterInvoiceDetailsQuery,
  useFinancialCloseEncounterMutation,
  useGenerateInvoicesMutation,
  useGetEligibilitySnapshotQuery,
  useFreezeEligibilitySnapshotMutation
} = invoiceGenerationService;
