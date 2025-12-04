import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

export type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

export type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

export const BillingService = createApi({
  reducerPath: "billingApi",
  baseQuery: BaseQuery,
  tagTypes: [
    "BillingInvoice",
    "BillingInvoiceItem",
    "PatientPayment",
    "PaymentAllocation",
    "PatientAccount",
  ],
  endpoints: (builder) => ({
    // ---------- INVOICES ----------

    getInvoices: builder.query({
      query: ({ page, size, sort = "id,desc", patientKey, facilityId, status }) => ({
        url: "/api/billing/invoice",
        method: "GET",
        params: {
          page,
          size,
          sort,
          patientKey,
          facilityId,
          status,
        },
      }),
      transformResponse: (response: [], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["BillingInvoice"],
    }),

    getInvoiceById: builder.query({
      query: (id) => ({
        url: `/api/billing/invoice/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "BillingInvoice", id }],
    }),

    createInvoice: builder.mutation({
      query: (body) => ({
        url: "/api/billing/invoice",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BillingInvoice"],
    }),

    updateInvoice: builder.mutation({
      query: ({ id, body }) => ({
        url: `/api/billing/invoice/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        "BillingInvoice",
        { type: "BillingInvoice", id },
      ],
    }),

    // ---------- INVOICE ITEMS ----------

    getInvoiceItems: builder.query<
      PagedResult<any>,
      any
    >({
      query: ({ page, size, sort = "id,asc", invoiceId }) => ({
        url: "/api/billing/invoice-item",
        method: "GET",
        params: { page, size, sort, invoiceId },
      }),
      transformResponse: (response: [], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["BillingInvoiceItem"],
    }),

    getInvoiceItemById: builder.query<any, number>({
      query: (id) => ({
        url: `/api/billing/invoice-item/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "BillingInvoiceItem", id }],
    }),

    createInvoiceItem: builder.mutation<
      any,
      Partial<any>
    >({
      query: (body) => ({
        url: "/api/billing/invoice-item",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BillingInvoiceItem", "BillingInvoice"],
    }),

    updateInvoiceItem: builder.mutation<
      any,
      { id: number; body: Partial<any> }
    >({
      query: ({ id, body }) => ({
        url: `/api/billing/invoice-item/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        "BillingInvoiceItem",
        { type: "BillingInvoiceItem", id },
      ],
    }),

    // ---------- PAYMENTS ----------

    getPayments: builder.query<PagedResult<any>, any>({
      query: ({ page, size, sort = "id,desc", patientKey, facilityId, paymentType }) => ({
        url: "/api/billing/payment",
        method: "GET",
        params: {
          page,
          size,
          sort,
          patientKey,
          facilityId,
          paymentType,
        },
      }),
      transformResponse: (response: [], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PatientPayment"],
    }),

    getPaymentById: builder.query<any, number>({
      query: (id) => ({
        url: `/api/billing/payment/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "PatientPayment", id }],
    }),

    createPayment: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: "/api/billing/payment",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PatientPayment", "BillingInvoice", "PatientAccount"],
    }),

    updatePayment: builder.mutation<
      any,
      { id: number; body: Partial<any> }
    >({
      query: ({ id, body }) => ({
        url: `/api/billing/payment/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        "PatientPayment",
        { type: "PatientPayment", id },
        "PatientAccount",
      ],
    }),

    // ---------- PAYMENT ALLOCATIONS ----------

    getPaymentAllocations: builder.query<
      PagedResult<any>,
      any
    >({
      query: ({ page, size, sort = "id,desc", paymentId, invoiceId }) => ({
        url: "/api/billing/payment-allocation",
        method: "GET",
        params: {
          page,
          size,
          sort,
          paymentId,
          invoiceId,
        },
      }),
      transformResponse: (response: [], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["PaymentAllocation"],
    }),

    getPaymentAllocationById: builder.query<any, number>({
      query: (id) => ({
        url: `/api/billing/payment-allocation/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [{ type: "PaymentAllocation", id }],
    }),

    createPaymentAllocation: builder.mutation<
      any,
      Partial<any>
    >({
      query: (body) => ({
        url: "/api/billing/payment-allocation",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "PaymentAllocation",
        "BillingInvoice",
        "PatientPayment",
        "PatientAccount",
      ],
    }),

    updatePaymentAllocation: builder.mutation<
      any,
      { id: number; body: Partial<any> }
    >({
      query: ({ id, body }) => ({
        url: `/api/billing/payment-allocation/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (r, e, { id }) => [
        "PaymentAllocation",
        { type: "PaymentAllocation", id },
        "PatientAccount",
      ],
    }),

    // ---------- PATIENT ACCOUNT SUMMARY ----------

    getPatientAccountSummary: builder.query<
      any,
      { patientKey: string }
    >({
      query: ({ patientKey }) => ({
        url: `/api/billing/patient-account/${patientKey}`,
        method: "GET",
      }),
      providesTags: (r, e, { patientKey }) => [
        { type: "PatientAccount", id: patientKey },
      ],
    }),
  }),
});

export const {
  // invoices
  useGetInvoicesQuery,
  useLazyGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,

  // invoice items
  useGetInvoiceItemsQuery,
  useLazyGetInvoiceItemsQuery,
  useGetInvoiceItemByIdQuery,
  useCreateInvoiceItemMutation,
  useUpdateInvoiceItemMutation,

  // payments
  useGetPaymentsQuery,
  useLazyGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,

  // allocations
  useGetPaymentAllocationsQuery,
  useLazyGetPaymentAllocationsQuery,
  useGetPaymentAllocationByIdQuery,
  useCreatePaymentAllocationMutation,
  useUpdatePaymentAllocationMutation,

  // patient account
  useGetPatientAccountSummaryQuery,
} = BillingService;
