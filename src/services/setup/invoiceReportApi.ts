import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

export const invoiceReportApi = createApi({
  reducerPath: 'invoiceReportApi',
  baseQuery: baseQuery,
  tagTypes: ['InvoicePdf'],
  endpoints: (builder) => ({
    generateInvoicePdf: builder.mutation<Blob, any>({
      query: (data) => ({
        url: '/pas/generate-invoice-pdf',
        method: 'POST',
        body: data,
        responseHandler: async (response) => {
          // Check if response is ok
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Invoice PDF generation failed: ${errorText}`);
          }
          // Return blob for PDF
          return response.blob();
        },
        // Important: Tell RTK Query we're expecting a blob response
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: [{ type: 'InvoicePdf', id: 'GENERATED' }],
    }),

    // Health check endpoint
    checkInvoiceServiceHealth: builder.query<
      { status: string; service: string; timestamp: string },
      void
    >({
      query: () => ({
        url: '/pas/invoice-health',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGenerateInvoicePdfMutation,
  useLazyCheckInvoiceServiceHealthQuery,
  useCheckInvoiceServiceHealthQuery,
} = invoiceReportApi;

export default invoiceReportApi;