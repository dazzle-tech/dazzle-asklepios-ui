
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ClaimEncounterDiagnosis } from '@/types/model-types-new';

type ClaimEncounterDiagnosisPayload = {
  diagnosisId: number;
  type: string;
  suspected: boolean;
  major: boolean;
};

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

    createClaimEncounterDiagnosis: builder.mutation<
      ClaimEncounterDiagnosis,
      ClaimEncounterDiagnosisPayload & { encounterId: number }
    >({
      query: ({ encounterId, ...body }) => ({
        url: `/api/patient/billing/claim-encounter-diagnoses/encounters/${encounterId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ClaimEncounterDiagnosis']
    }),

    updateClaimEncounterDiagnosis: builder.mutation<
      ClaimEncounterDiagnosis,
      ClaimEncounterDiagnosisPayload & { id: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/billing/claim-encounter-diagnoses/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ClaimEncounterDiagnosis']
    }),

    deleteClaimEncounterDiagnosis: builder.mutation<void, number>({
      query: id => ({
        url: `/api/patient/billing/claim-encounter-diagnoses/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ClaimEncounterDiagnosis']
    })
  })
});

export const {
  useGetClaimEncounterDiagnosesQuery,
  useCreateClaimEncounterDiagnosisMutation,
  useUpdateClaimEncounterDiagnosisMutation,
  useDeleteClaimEncounterDiagnosisMutation
} = claimEncounterDiagnosisService;
