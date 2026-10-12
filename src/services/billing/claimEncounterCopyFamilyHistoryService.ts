import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import { ClaimEncounterCopyFamilyHistory } from '@/types/model-types-new';

export const claimEncounterCopyFamilyHistoryService = createApi({
  reducerPath: 'claimEncounterCopyFamilyHistoryApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyFamilyHistory'],
  endpoints: builder => ({
    getClaimEncounterCopyFamilyHistories: builder.query<
      ClaimEncounterCopyFamilyHistory[],
      {
        claimEncounterCopyId: number;
        showCancelled?: boolean;
      }
    >({
      query: ({
        claimEncounterCopyId,
        showCancelled = false
      }) => ({
        url: showCancelled
          ? `/api/patient/billing/claim-encounter-copy-family-histories/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-family-histories/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopyFamilyHistory']
    }),

    updateClaimEncounterCopyFamilyHistory: builder.mutation<
      ClaimEncounterCopyFamilyHistory,
      {
        id: number;
        condition?: string | null;
        relation?: string | null;
        inheritedDiseases?: boolean | null;
        patientIsFree: boolean;
        freeText?: string | null;
      }
    >({
      query: ({
        id,
        condition,
        relation,
        inheritedDiseases,
        patientIsFree,
        freeText
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-family-histories/${id}`,
        method: 'PUT',
        body: {
          condition,
          relation,
          inheritedDiseases,
          patientIsFree,
          freeText
        }
      }),
      invalidatesTags: ['ClaimEncounterCopyFamilyHistory']
    }),

    cancelClaimEncounterCopyFamilyHistory: builder.mutation<
      ClaimEncounterCopyFamilyHistory,
      {
        id: number;
        cancellationReason: string;
      }
    >({
      query: ({
        id,
        cancellationReason
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-family-histories/${id}/cancel`,
        method: 'PUT',
        body: {
          cancellationReason
        }
      }),
      invalidatesTags: ['ClaimEncounterCopyFamilyHistory']
    }),

    createClaimEncounterCopyFamilyHistory: builder.mutation<
      ClaimEncounterCopyFamilyHistory,
      {
        claimEncounterCopyId: number;
        condition?: string | null;
        relation?: string | null;
        inheritedDiseases?: boolean | null;
        patientIsFree: boolean;
        freeText?: string | null;
      }
    >({
      query: ({
        claimEncounterCopyId,
        ...body
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-family-histories/by-copy/${claimEncounterCopyId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ClaimEncounterCopyFamilyHistory']
    })
  })
});

export const {
  useGetClaimEncounterCopyFamilyHistoriesQuery,
  useUpdateClaimEncounterCopyFamilyHistoryMutation,
  useCancelClaimEncounterCopyFamilyHistoryMutation,
  useCreateClaimEncounterCopyFamilyHistoryMutation
} = claimEncounterCopyFamilyHistoryService;