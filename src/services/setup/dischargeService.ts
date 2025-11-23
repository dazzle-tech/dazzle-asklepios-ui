import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

export const dischargePService = createApi({
  reducerPath: 'dischargeApi',
  baseQuery: baseQuery,
  tagTypes: ['DischargePdf'],
  endpoints: (builder) => ({
    generateDischargePdf: builder.mutation<Blob, void>({
      query: () => ({
        url: '/pas/generate-discharge-pdf',
        method: 'POST',
        responseHandler: async (response) => {
          // Check if response is ok
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Discharge PDF generation failed: ${errorText}`);
          }
          // Return blob for PDF
          return response.blob();
        },
        // Important: Tell RTK Query we're expecting a blob response
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: [{ type: 'DischargePdf', id: 'GENERATED' }],
    }),

    // Optional: Health check endpoint
    checkDischargeServiceHealth: builder.query<
      { status: string; service: string; timestamp: string },
      void
    >({
      query: () => ({
        url: '/pas/discharge-health',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGenerateDischargePdfMutation,
  useLazyCheckDischargeServiceHealthQuery,
  useCheckDischargeServiceHealthQuery,
} = dischargePService;

export default dischargePService;