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
  grossAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
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

export type InvoicePricingSummary = {
  invoiceId: number;
  documentNumber: string;
  currency?: string;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  discountRules: AppliedDiscountRule[];
  taxRules: AppliedTaxRule[];
};

export type AppliedDiscountRule = {
  ruleId?: number | null;
  code?: string | null;
  name?: string | null;
  applicableOn?: string | null;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | string | null;
  rate?: number | null;
  fixedAmount?: number | null;
  appliedAmount?: number | null;
};

export type AppliedTaxRule = {
  ruleId?: number | null;
  code?: string | null;
  name?: string | null;
  applicableOn?: string | null;
  taxType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'EXEMPT' | string | null;
  calculationType?: 'EXCLUSIVE' | 'INCLUSIVE' | string | null;
  rate?: number | null;
  fixedAmount?: number | null;
  appliedAmount?: number | null;
};

export type InvoiceLineAppliedDiscount = {
  source?: string | null;
  ruleId?: number | null;
  code?: string | null;
  name?: string | null;
  applicableOn?: string | null;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | string | null;
  rate?: number | null;
  fixedAmount?: number | null;
  appliedAmount?: number | null;
};

export type InvoiceLineAppliedTax = {
  source?: string | null;
  ruleId?: number | null;
  code?: string | null;
  name?: string | null;
  applicableOn?: string | null;
  taxType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'EXEMPT' | string | null;
  calculationType?: 'EXCLUSIVE' | 'INCLUSIVE' | string | null;
  rate?: number | null;
  fixedAmount?: number | null;
  appliedAmount?: number | null;
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
  appliedDiscounts?: InvoiceLineAppliedDiscount[];
  appliedTaxes?: InvoiceLineAppliedTax[];
  lineSource?: 'INVOICE' | 'DEBIT_NOTE' | string | null;
};

export type CollectInvoiceBalanceRequest = {
  amount?: number | null;
  paymentMethodCode: string;
  paymentMethodId: number;
  requestId: string;
  notes?: string | null;
};

export type CollectInvoiceBalanceResult = {
  invoiceId: number;
  documentNumber: string;
  currency?: string;
  collectedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  paymentId?: number | null;
  paymentNumber?: string | null;
  paymentTransactionNumber?: string | null;
  walletAvailableBalance?: number | null;
};

export type AddableChargeLine = {
  chargeLineId: number;
  patientServiceProductId: number;
  itemCode?: string | null;
  itemDescription?: string | null;
  quantity?: number;
  unitPrice?: number;
  netAmount?: number;
  grossAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
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
  creditNoteAllowed?: boolean;
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

export type PreviewCatalogItemPricingRequest = {
  patientId: number;
  encounterId: number;
  facilityId: number;
  currency?: string;
  billingItemType: string;
  brandMedicationId?: number;
  diagnosticTestId?: number;
  serviceId?: number;
  procedureId?: number;
  quantity?: number;
  coverageType?: 'SELF_PAY' | 'INSURANCE';
  patientInsuranceId?: number | null;
  invoiceId?: number | null;
};

export type PreviewCatalogItemPricingResult = {
  setupUnitPrice: number | null;
  unitPrice: number | null;
  priceSource: string | null;
  priceListItemCode: string | null;
  currency?: string;
  grossAmount?: number | null;
  discountAmount?: number | null;
  taxAmount?: number | null;
  netAmount?: number | null;
  itemGrossAmount?: number | null;
  itemDiscountAmount?: number | null;
  itemTaxAmount?: number | null;
  invoiceDiscountAmount?: number | null;
  invoiceTaxAmount?: number | null;
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
    'BillingPayment',
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

    getInvoicePricingSummary: builder.query<InvoicePricingSummary, number>({
      query: invoiceId => ({
        url: `/api/patient/financial-documents/${invoiceId}/pricing-summary`,
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

    previewCatalogItemPricing: builder.mutation<
      PreviewCatalogItemPricingResult,
      PreviewCatalogItemPricingRequest
    >({
      query: body => ({
        url: '/api/patient/financial-documents/preview-catalog-item-pricing',
        method: 'POST',
        body
      })
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
    }),

    collectInvoiceBalance: builder.mutation<
      CollectInvoiceBalanceResult,
      { invoiceId: number; body: CollectInvoiceBalanceRequest }
    >({
      query: ({ invoiceId, body }) => ({
        url: `/api/patient/financial-documents/${invoiceId}/collect-balance`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [
        { type: 'InvoiceAdjustments', id: invoiceId },
        { type: 'InvoiceLineItems', id: invoiceId },
        'PatientFinancialInvoices',
        'EncounterBillingSummary',
        'BillingWallet',
        'BillingPayment',
        'PatientBalance',
        'PatientLedgerSummary'
      ]
    }),

    syncInvoicePayments: builder.mutation<
      { invoiceId: number; paidAmount: number; outstandingAmount: number },
      number
    >({
      query: invoiceId => ({
        url: `/api/patient/financial-documents/${invoiceId}/sync-payments`,
        method: 'POST'
      }),
      invalidatesTags: (_result, _error, invoiceId) => [
        { type: 'InvoiceAdjustments', id: invoiceId },
        { type: 'InvoiceLineItems', id: invoiceId },
        'PatientFinancialInvoices',
        'EncounterBillingSummary',
        'PatientLedgerSummary'
      ]
    })
  })
});

export const {
  useGetInvoiceLineItemsQuery,
  useLazyGetInvoiceLineItemsQuery,
  useGetInvoicePricingSummaryQuery,
  useLazyGetInvoicePricingSummaryQuery,
  useGetAddableChargeLinesQuery,
  useGetInvoiceAdjustmentsQuery,
  useLazyGetInvoiceAdjustmentsQuery,
  usePreviewCatalogItemPricingMutation,
  useCreateCreditNoteMutation,
  useCreateDebitNoteMutation,
  useCollectInvoiceBalanceMutation,
  useSyncInvoicePaymentsMutation
} = financialDocumentAdjustmentService;
