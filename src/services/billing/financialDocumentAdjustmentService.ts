import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { sanitizeAdjustmentRequest } from '@/pages/billing-module/invoices/adjustmentRequestUtils';

export type FinancialDocumentAdjustmentItem = {
  id: number;
  adjustmentAction?: 'REMOVE' | 'PARTIAL_CREDIT' | 'REDUCE' | 'ADD' | 'INCREASE' | string;
  parentDocumentItemId?: number | null;
  chargeLineId?: number | null;
  itemCode?: string | null;
  itemDescription?: string | null;
  quantity?: number;
  unitPrice?: number;
  netAmount?: number;
  currency?: string;
};

export type FinancialDocumentAdjustment = {
  id: number;
  documentNumber: string;
  documentType: 'CREDIT_NOTE' | 'DEBIT_NOTE' | string;
  documentSubtype?: 'PATIENT' | 'INSURANCE_CLAIM' | string;
  status: string;
  parentDocumentId: number;
  totalAmount: number;
  currency?: string;
  adjustmentReason?: string | null;
  createdDate?: string;
  items?: FinancialDocumentAdjustmentItem[];
};

export type InvoiceLineItem = {
  id: number;
  patientServiceProductId: number;
  chargeLineId?: number | null;
  itemCode?: string | null;
  itemDescription?: string | null;
  quantity: number;
  unitPrice: number;
  grossAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  netAmount: number;
  paidAmount?: number;
  remainingAmount: number;
  status?: string;
  currency?: string;
};

export type AddableChargeLine = {
  chargeLineId: number;
  patientServiceProductId: number;
  itemCode?: string | null;
  itemDescription?: string | null;
  quantity?: number;
  unitPrice?: number;
  netAmount?: number;
  patientShareAmount?: number;
  insuranceShareAmount?: number;
  currency?: string;
};

export type InvoiceAdjustmentSummary = {
  invoiceId: number;
  documentNumber: string;
  documentSubtype?: 'PATIENT' | 'INSURANCE_CLAIM' | string;
  status: string;
  invoiceTotal: number;
  totalCreditNotes: number;
  totalDebitNotes: number;
  totalPaid: number;
  outstandingBalance: number;
  currency?: string;
  adjustments: FinancialDocumentAdjustment[];
};

export type InvoiceLineAdjustmentRequest = {
  action: 'REMOVE' | 'PARTIAL_CREDIT' | 'REDUCE' | 'ADD' | 'ADD_NEW' | 'INCREASE';
  documentItemId?: number;
  chargeLineId?: number;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
  billingItemType?: string;
  brandMedicationId?: number;
  diagnosticTestId?: number;
  serviceId?: number;
  procedureId?: number;
  currency?: string;
  serviceSource?: string;
  sourceId?: number;
  notes?: string;
  itemLabel?: string;
};

export type CreateAdjustmentRequest = {
  reason?: string;
  lines: InvoiceLineAdjustmentRequest[];
};

export type CreateFinancialDocumentAdjustmentRequest = {
  invoiceId: number;
  body: CreateAdjustmentRequest;
};

export const financialDocumentAdjustmentService = createApi({
  reducerPath: 'financialDocumentAdjustmentService',
  baseQuery: BaseQuery,
  tagTypes: [
    'InvoiceAdjustments',
    'InvoiceLineItems',
    'AddableChargeLines',
    'PatientFinancialInvoices',
    'EncounterBillingSummary',
    'BillingWallet',
    'PatientLedgerSummary',
    'PatientBalance'
  ],
  endpoints: builder => ({
    getInvoiceLineItems: builder.query<InvoiceLineItem[], number>({
      query: invoiceId => ({
        url: `/api/patient/financial-documents/${invoiceId}/items`,
        method: 'GET'
      }),
      providesTags: (_result, _error, invoiceId) => [
        { type: 'InvoiceLineItems', id: invoiceId }
      ]
    }),

    getAddableChargeLines: builder.query<AddableChargeLine[], number>({
      query: invoiceId => ({
        url: `/api/patient/financial-documents/${invoiceId}/addable-charge-lines`,
        method: 'GET'
      }),
      providesTags: (_result, _error, invoiceId) => [
        { type: 'AddableChargeLines', id: invoiceId }
      ]
    }),

    getInvoiceAdjustments: builder.query<InvoiceAdjustmentSummary, number>({
      query: invoiceId => ({
        url: `/api/patient/financial-documents/${invoiceId}/adjustments`,
        method: 'GET'
      }),
      providesTags: (_result, _error, invoiceId) => [
        { type: 'InvoiceAdjustments', id: invoiceId }
      ]
    }),

    createCreditNote: builder.mutation<
      FinancialDocumentAdjustment,
      CreateFinancialDocumentAdjustmentRequest
    >({
      query: ({ invoiceId, body }) => ({
        url: `/api/patient/financial-documents/${invoiceId}/credit-note`,
        method: 'POST',
        body: sanitizeAdjustmentRequest(body)
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: 'InvoiceAdjustments', id: invoiceId },
        { type: 'InvoiceLineItems', id: invoiceId },
        { type: 'AddableChargeLines', id: invoiceId },
        'PatientFinancialInvoices',
        'EncounterBillingSummary',
        'BillingWallet',
        'PatientLedgerSummary',
        'PatientBalance'
      ]
    }),

    createDebitNote: builder.mutation<
      FinancialDocumentAdjustment,
      CreateFinancialDocumentAdjustmentRequest
    >({
      query: ({ invoiceId, body }) => ({
        url: `/api/patient/financial-documents/${invoiceId}/debit-note`,
        method: 'POST',
        body: sanitizeAdjustmentRequest(body)
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: 'InvoiceAdjustments', id: invoiceId },
        { type: 'InvoiceLineItems', id: invoiceId },
        { type: 'AddableChargeLines', id: invoiceId },
        'PatientFinancialInvoices',
        'EncounterBillingSummary',
        'BillingWallet',
        'PatientLedgerSummary',
        'PatientBalance'
      ]
    })
  })
});

export const {
  useGetInvoiceLineItemsQuery,
  useLazyGetInvoiceLineItemsQuery,
  useGetAddableChargeLinesQuery,
  useGetInvoiceAdjustmentsQuery,
  useCreateCreditNoteMutation,
  useCreateDebitNoteMutation
} = financialDocumentAdjustmentService;
