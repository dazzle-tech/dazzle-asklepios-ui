import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ClaimEncounterProgressNote } from '@/types/model-types-new';

export const claimEncounterProgressNoteService = createApi({
  reducerPath: 'claimEncounterProgressNoteApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterProgressNote'],
  endpoints: builder => ({
    getClaimEncounterProgressNotes: builder.query<
      ClaimEncounterProgressNote[],
      { claimEncounterCopyId: number; showCancelled?: boolean }
    >({
      query: ({ claimEncounterCopyId, showCancelled = false }) => ({
        url: showCancelled
          ? `/api/patient/billing/claim-encounter-progress-notes/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-progress-notes/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterProgressNote']
    }),

    updateClaimEncounterProgressNote: builder.mutation<
      ClaimEncounterProgressNote,
      {
        id: number;
        noteText: string;
      }
    >({
      query: ({ id, noteText }) => ({
        url: `/api/patient/billing/claim-encounter-progress-notes/${id}`,
        method: 'PUT',
        body: {
          noteText
        }
      }),
      invalidatesTags: ['ClaimEncounterProgressNote']
    }),

    cancelClaimEncounterProgressNote: builder.mutation<
      ClaimEncounterProgressNote,
      {
        id: number;
        cancellationReason: string;
      }
    >({
      query: ({ id, cancellationReason }) => ({
        url: `/api/patient/billing/claim-encounter-progress-notes/${id}/cancel`,
        method: 'PUT',
        body: {
          cancellationReason
        }
      }),
      invalidatesTags: ['ClaimEncounterProgressNote']
    })
  })
});

export const {
  useGetClaimEncounterProgressNotesQuery,
  useUpdateClaimEncounterProgressNoteMutation,
  useCancelClaimEncounterProgressNoteMutation
} = claimEncounterProgressNoteService;