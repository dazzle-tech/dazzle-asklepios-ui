import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ClaimEncounterCopySocialHistory } from '@/types/model-types-new';

export const claimEncounterCopySocialHistoryService = createApi({
  reducerPath: 'claimEncounterCopySocialHistoryApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopySocialHistory'],
  endpoints: builder => ({
    getClaimEncounterCopySocialHistories: builder.query<
      ClaimEncounterCopySocialHistory[],
      { claimEncounterCopyId: number; showCancelled?: boolean }
    >({
      query: ({ claimEncounterCopyId, showCancelled = false }) => ({
        url: showCancelled
          ? `/api/patient/billing/claim-encounter-copy-social-histories/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-social-histories/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopySocialHistory']
    }),

    updateClaimEncounterCopySocialHistory: builder.mutation<
      ClaimEncounterCopySocialHistory,
      {
        id: number;
        isCurrentSmoker?: boolean | null;
        smokeStartDate?: string | null;
        cigaretteAmount?: number | null;
        cigaretteType?: string | null;
        isPreviousSmoker?: boolean | null;
        smokeQuitDate?: string | null;
        exposureToSecondHandSmoke?: boolean | null;
        alcoholConsumption?: boolean | null;
        typeOfAlcohol?: string | null;
        alcoholSinceWhen?: string | null;
        substanceUse?: boolean | null;
        route?: string | null;
        frequency?: string | null;
        physicalLimitation?: string | null;
        diagnosedEatingDisorders?: string | null;
        patientIsFree: boolean;
        freeText?: string | null;
      }
    >({
      query: ({
        id,
        isCurrentSmoker,
        smokeStartDate,
        cigaretteAmount,
        cigaretteType,
        isPreviousSmoker,
        smokeQuitDate,
        exposureToSecondHandSmoke,
        alcoholConsumption,
        typeOfAlcohol,
        alcoholSinceWhen,
        substanceUse,
        route,
        frequency,
        physicalLimitation,
        diagnosedEatingDisorders,
        patientIsFree,
        freeText
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-social-histories/${id}`,
        method: 'PUT',
        body: {
          isCurrentSmoker,
          smokeStartDate,
          cigaretteAmount,
          cigaretteType,
          isPreviousSmoker,
          smokeQuitDate,
          exposureToSecondHandSmoke,
          alcoholConsumption,
          typeOfAlcohol,
          alcoholSinceWhen,
          substanceUse,
          route,
          frequency,
          physicalLimitation,
          diagnosedEatingDisorders,
          patientIsFree,
          freeText
        }
      }),
      invalidatesTags: ['ClaimEncounterCopySocialHistory']
    }),

    cancelClaimEncounterCopySocialHistory: builder.mutation<
      ClaimEncounterCopySocialHistory,
      {
        id: number;
        cancellationReason: string;
      }
    >({
      query: ({ id, cancellationReason }) => ({
        url: `/api/patient/billing/claim-encounter-copy-social-histories/${id}/cancel`,
        method: 'PUT',
        body: {
          cancellationReason
        }
      }),
      invalidatesTags: ['ClaimEncounterCopySocialHistory']
    }),
    createClaimEncounterCopySocialHistory: builder.mutation<
  ClaimEncounterCopySocialHistory,
  {
    claimEncounterCopyId: number;
    isCurrentSmoker?: boolean | null;
    smokeStartDate?: string | null;
    cigaretteAmount?: number | null;
    cigaretteType?: string | null;
    isPreviousSmoker?: boolean | null;
    smokeQuitDate?: string | null;
    exposureToSecondHandSmoke?: boolean | null;
    alcoholConsumption?: boolean | null;
    typeOfAlcohol?: string | null;
    alcoholSinceWhen?: string | null;
    substanceUse?: boolean | null;
    route?: string | null;
    frequency?: string | null;
    physicalLimitation?: string | null;
    diagnosedEatingDisorders?: string | null;
    patientIsFree: boolean;
    freeText?: string | null;
  }
>({
  query: ({
    claimEncounterCopyId,
    ...body
  }) => ({
    url: `/api/patient/billing/claim-encounter-copy-social-histories/by-copy/${claimEncounterCopyId}`,
    method: 'POST',
    body
  }),
  invalidatesTags: ['ClaimEncounterCopySocialHistory']
}),
  })
});

export const {
  useGetClaimEncounterCopySocialHistoriesQuery,
  useUpdateClaimEncounterCopySocialHistoryMutation,
  useCancelClaimEncounterCopySocialHistoryMutation,
  useCreateClaimEncounterCopySocialHistoryMutation
} = claimEncounterCopySocialHistoryService;