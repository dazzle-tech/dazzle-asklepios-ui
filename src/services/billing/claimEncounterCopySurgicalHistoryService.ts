import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ClaimEncounterCopySurgicalHistory } from '@/types/model-types-new';

export const claimEncounterCopySurgicalHistoryService = createApi({
  reducerPath: 'claimEncounterCopySurgicalHistoryApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopySurgicalHistory'],
  endpoints: builder => ({
    getClaimEncounterCopySurgicalHistories: builder.query<
      ClaimEncounterCopySurgicalHistory[],
      { claimEncounterCopyId: number; showCancelled?: boolean }
    >({
      query: ({ claimEncounterCopyId, showCancelled = false }) => ({
        url: showCancelled
          ? `/api/patient/billing/claim-encounter-copy-surgical-histories/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-surgical-histories/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopySurgicalHistory']
    }),

    updateClaimEncounterCopySurgicalHistory: builder.mutation<
      ClaimEncounterCopySurgicalHistory,
      {
        id: number;
        surgery?: string | null;
        dateOfSurgery?: string | null;
        facility?: string | null;
        anesthesiaType?: string | null;
        complications?: string | null;
        adverseReactionsToAnesthesia?: string | null;
        hasImplantsOrDevices?: boolean | null;
        implantsOrDevicesDescription?: string | null;
        patientIsFree: boolean;
        freeText?: string | null;
      }
    >({
      query: ({
        id,
        surgery,
        dateOfSurgery,
        facility,
        anesthesiaType,
        complications,
        adverseReactionsToAnesthesia,
        hasImplantsOrDevices,
        implantsOrDevicesDescription,
        patientIsFree,
        freeText
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-surgical-histories/${id}`,
        method: 'PUT',
        body: {
          surgery,
          dateOfSurgery,
          facility,
          anesthesiaType,
          complications,
          adverseReactionsToAnesthesia,
          hasImplantsOrDevices,
          implantsOrDevicesDescription,
          patientIsFree,
          freeText
        }
      }),
      invalidatesTags: ['ClaimEncounterCopySurgicalHistory']
    }),

    cancelClaimEncounterCopySurgicalHistory: builder.mutation<
      ClaimEncounterCopySurgicalHistory,
      {
        id: number;
        cancellationReason: string;
      }
    >({
      query: ({ id, cancellationReason }) => ({
        url: `/api/patient/billing/claim-encounter-copy-surgical-histories/${id}/cancel`,
        method: 'PUT',
        body: {
          cancellationReason
        }
      }),
      invalidatesTags: ['ClaimEncounterCopySurgicalHistory']
    }),

    createClaimEncounterCopySurgicalHistory: builder.mutation<
      ClaimEncounterCopySurgicalHistory,
      {
        claimEncounterCopyId: number;
        surgery?: string | null;
        dateOfSurgery?: string | null;
        facility?: string | null;
        anesthesiaType?: string | null;
        complications?: string | null;
        adverseReactionsToAnesthesia?: string | null;
        hasImplantsOrDevices?: boolean | null;
        implantsOrDevicesDescription?: string | null;
        patientIsFree: boolean;
        freeText?: string | null;
      }
    >({
      query: ({
        claimEncounterCopyId,
        ...body
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-surgical-histories/by-copy/${claimEncounterCopyId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['ClaimEncounterCopySurgicalHistory']
    })
  })
});

export const {
  useGetClaimEncounterCopySurgicalHistoriesQuery,
  useUpdateClaimEncounterCopySurgicalHistoryMutation,
  useCancelClaimEncounterCopySurgicalHistoryMutation,
  useCreateClaimEncounterCopySurgicalHistoryMutation
} = claimEncounterCopySurgicalHistoryService;
