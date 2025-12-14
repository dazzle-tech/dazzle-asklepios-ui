import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

export const resultReportApi = createApi({
  reducerPath: 'resultReportApi',
  baseQuery: baseQuery,
  tagTypes: ['LabResultsPdf'],
  endpoints: (builder) => ({
    generateLabResultsPdf: builder.mutation<Blob, any>({
      query: (data) => ({
        url: '/pas/generate-results-pdf',
        method: 'POST',
        body: data,
        responseHandler: async (response) => {
          // Check if response is ok
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Lab Results PDF generation failed: ${errorText}`);
          }
          // Return blob for PDF
          return response.blob();
        },
        // Important: Tell RTK Query we're expecting a blob response
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: [{ type: 'LabResultsPdf', id: 'GENERATED' }],
    }),

    // Optional: Health check endpoint
    checkLabResultsServiceHealth: builder.query<
      { status: string; service: string; timestamp: string },
      void
    >({
      query: () => ({
        url: '/pas/results-health',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGenerateLabResultsPdfMutation,
  useLazyCheckLabResultsServiceHealthQuery,
  useCheckLabResultsServiceHealthQuery,
} = resultReportApi;

export default resultReportApi;