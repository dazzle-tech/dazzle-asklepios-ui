import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

type PatientDataInput = {
  Age: string;
  Gender: string;
  Diagnosis: string;
  Symptoms?: string[];
  Medications?: string[];
  Surgeries?: string[];
  Allergies?: string[];
  Medical_Warnings?: string[];
  Problems?: string[];
  Vitals?: Record<string, string>;
};

export type PatientClinicalSummaryRequest = {
  patientId: number;
  encounterId: number;
};

export type SummaryResponse = {
  request_id?: string | null;
  ClinicalSummary: string;
  processing_metadata?: Record<string, any>;
};
export const clinicalSummaryService = createApi({
  reducerPath: 'clinicalSummaryApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClinicalSummary'],
  endpoints: builder => ({
    summarize:  builder.mutation<
      SummaryResponse,
      PatientClinicalSummaryRequest
    >({
      query: body => ({
        url: '/api/analytics/clinical-summary',
        method: 'POST',
        body
      })
    }),

    health: builder.query<any, void>({
      query: () => ({
        url: '/api/ai/v1/clinical-summary/health',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useSummarizeMutation,
  useHealthQuery,
  useLazyHealthQuery,
} = clinicalSummaryService;