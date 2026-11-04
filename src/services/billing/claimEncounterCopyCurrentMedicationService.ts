import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import {
  ClaimEncounterCopyCurrentMedication,
  ClaimEncounterCopyCurrentMedicationCreateDTO,
  ClaimEncounterCopyCurrentMedicationUpdateDTO
} from '@/types/model-types-new';

export interface ClaimEncounterCopyCurrentMedicationCancelDTO {
  cancellationReason: string;
}

export const claimEncounterCopyCurrentMedicationService = createApi({
  reducerPath: 'claimEncounterCopyCurrentMedicationApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyCurrentMedication'],
  endpoints: builder => ({
    getClaimEncounterCopyCurrentMedications: builder.query<
      ClaimEncounterCopyCurrentMedication[],
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
          ? `/api/patient/billing/claim-encounter-copy-current-medications/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-current-medications/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopyCurrentMedication']
    }),

    createClaimEncounterCopyCurrentMedication: builder.mutation<
      ClaimEncounterCopyCurrentMedication,
      {
        claimEncounterCopyId: number;
        data: ClaimEncounterCopyCurrentMedicationCreateDTO;
      }
    >({
      query: ({ claimEncounterCopyId, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-current-medications/by-copy/${claimEncounterCopyId}`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyCurrentMedication']
    }),

    updateClaimEncounterCopyCurrentMedication: builder.mutation<
      ClaimEncounterCopyCurrentMedication,
      {
        id: number;
        data: ClaimEncounterCopyCurrentMedicationUpdateDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-current-medications/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyCurrentMedication']
    }),

    cancelClaimEncounterCopyCurrentMedication: builder.mutation<
      ClaimEncounterCopyCurrentMedication,
      {
        id: number;
        data: ClaimEncounterCopyCurrentMedicationCancelDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-current-medications/${id}/cancel`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyCurrentMedication']
    })
  })
});

export const {
  useGetClaimEncounterCopyCurrentMedicationsQuery,
  useCreateClaimEncounterCopyCurrentMedicationMutation,
  useUpdateClaimEncounterCopyCurrentMedicationMutation,
  useCancelClaimEncounterCopyCurrentMedicationMutation
} = claimEncounterCopyCurrentMedicationService;
