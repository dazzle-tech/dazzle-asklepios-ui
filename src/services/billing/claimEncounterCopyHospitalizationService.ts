import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import { ClaimEncounterCopyHospitalization, ClaimEncounterCopyHospitalizationCreateDTO, ClaimEncounterCopyHospitalizationUpdateDTO } from '@/types/model-types-new';



export interface ClaimEncounterCopyHospitalizationCancelDTO {
  cancellationReason: string;
}

export const claimEncounterCopyHospitalizationService = createApi({
  reducerPath: 'claimEncounterCopyHospitalizationApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyHospitalization'],
  endpoints: builder => ({
    getClaimEncounterCopyHospitalizations: builder.query<
      ClaimEncounterCopyHospitalization[],
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
          ? `/api/patient/billing/claim-encounter-copy-hospitalizations/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-hospitalizations/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopyHospitalization']
    }),

    createClaimEncounterCopyHospitalization: builder.mutation<
      ClaimEncounterCopyHospitalization,
      {
        claimEncounterCopyId: number;
        data: ClaimEncounterCopyHospitalizationCreateDTO;
      }
    >({
      query: ({ claimEncounterCopyId, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-hospitalizations/by-copy/${claimEncounterCopyId}`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyHospitalization']
    }),

    updateClaimEncounterCopyHospitalization: builder.mutation<
      ClaimEncounterCopyHospitalization,
      {
        id: number;
        data: ClaimEncounterCopyHospitalizationUpdateDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-hospitalizations/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyHospitalization']
    }),

    cancelClaimEncounterCopyHospitalization: builder.mutation<
      ClaimEncounterCopyHospitalization,
      {
        id: number;
        data: ClaimEncounterCopyHospitalizationCancelDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-hospitalizations/${id}/cancel`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyHospitalization']
    })
  })
});

export const {
  useGetClaimEncounterCopyHospitalizationsQuery,
  useCreateClaimEncounterCopyHospitalizationMutation,
  useUpdateClaimEncounterCopyHospitalizationMutation,
  useCancelClaimEncounterCopyHospitalizationMutation
} = claimEncounterCopyHospitalizationService;
