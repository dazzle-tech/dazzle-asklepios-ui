import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

// Define the discharge data structure
export interface DischargeData {
  patient: {
    fullName: string;
    patientMrn: string;
    dob: string;
    age: string;
    gender: string;
  };
  encounter: {
    chiefComplain: string;
    admissionDate: string;
  };
  user: {
    fullName: string;
    email: string;
  };
  facility: {
    name: string;
  };
  diagnoses: Array<{
    diagnoseType: string;
    icdCode: string;
    description: string;
  }>;
  reviewSystems: Array<{
    system: string;
    systemDetail: string;
    notes: string;
  }>;
  procedures: Array<{
    procedureName: string;
    procedureId: string;
  }>;
  prescriptions: Array<{
    medicationName: string;
    instructions: string;
  }>;
  diagnosticTests: Array<{
    testName: string;
    processingStatus: string;
  }>;
}

export const dischargePService = createApi({
  reducerPath: 'dischargeApi',
  baseQuery: baseQuery,
  tagTypes: ['DischargePdf'],
  endpoints: (builder) => ({
    generateDischargePdf: builder.mutation<Blob, DischargeData>({
      query: (dischargeData) => ({
        url: '/pas/generate-discharge-pdf',
        method: 'POST',
        body: dischargeData,
        responseHandler: async (response) => {
          if (!response.ok) {
            let errorText = 'Unknown error';
            try {
              const errorJson = await response.json();
              errorText = errorJson.error || errorJson.message || errorText;
            } catch {
              errorText = await response.text();
            }
            throw new Error(`Discharge PDF generation failed: ${errorText}`);
          }
          return response.blob();
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
      }),
      invalidatesTags: [{ type: 'DischargePdf', id: 'GENERATED' }],
    }),

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
