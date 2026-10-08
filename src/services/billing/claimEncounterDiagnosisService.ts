import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ClaimEncounterDiagnosis, UpdateClaimEncounterDiagnosesRequest } from '@/types/model-types-new';


export const claimEncounterDiagnosisService = createApi({
  reducerPath: 'claimEncounterDiagnosisApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterDiagnosis'],
  endpoints: builder => ({
    getClaimEncounterDiagnoses: builder.query<
      ClaimEncounterDiagnosis[],
      { encounterId: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/billing/claim-encounter-diagnoses/encounters/${encounterId}`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterDiagnosis']
    }),

    updateClaimEncounterDiagnoses: builder.mutation<
      ClaimEncounterDiagnosis[],
      UpdateClaimEncounterDiagnosesRequest
    >({
      query: ({ encounterId, diagnoses }) => ({
        url: `/api/patient/billing/claim-encounter-diagnoses/encounters/${encounterId}`,
        method: 'PUT',
        body: diagnoses
      }),
      invalidatesTags: ['ClaimEncounterDiagnosis']
    })
  })
});

export const {
  useGetClaimEncounterDiagnosesQuery,
  useUpdateClaimEncounterDiagnosesMutation
} = claimEncounterDiagnosisService;