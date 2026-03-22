import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ProfileTestGroupedHistoryVM } from '@/types/model-types-new';

export interface PatientResultsHistoryParams {
  patientId: number;
  from: string; // ISO Instant
  to: string;   // ISO Instant
  profileTestId?: number;
}

export const patientDiagnosticResultHistoryService = createApi({
  reducerPath: 'patientDiagnosticResultHistoryApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientResultsHistory'],
  endpoints: builder => ({

    getPatientResultsHistory: builder.query<
      ProfileTestGroupedHistoryVM[],
      PatientResultsHistoryParams
    >({
      query: ({ patientId, from, to, profileTestId }) => ({
        url: `/api/patient/diagnostic-test-results-history/${patientId}`,
        method: 'GET',
        params: {
          from,
          to,
          profileTestId
        },
      }),
      providesTags: (_r, _e, { patientId }) => [
        { type: 'PatientResultsHistory', id: `patient-${patientId}` }
      ],
    }),

  }),
});

export const {
  useGetPatientResultsHistoryQuery,
  useLazyGetPatientResultsHistoryQuery,
} = patientDiagnosticResultHistoryService;
