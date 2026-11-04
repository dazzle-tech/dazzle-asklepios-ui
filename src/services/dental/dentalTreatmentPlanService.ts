import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery as baseQuery, onQueryStarted } from '../../newApi';

import type {
  DentalTreatmentPlanResponseDTO,
  PlannedTreatmentCancelDTO,
  PlannedTreatmentDTO,
  PlannedTreatmentSaveDTO
} from '@/types/model-types-new';

export const dentalTreatmentPlanService = createApi({
  reducerPath: 'dentalTreatmentPlanApi',
  baseQuery: baseQuery,
  tagTypes: ['DentalTreatmentPlan'],

  endpoints: builder => ({
    getTreatmentPlanByEncounter: builder.query<DentalTreatmentPlanResponseDTO, number>({
      query: (encounterId: number) => ({
        url: `/api/patient/dental/treatment-plan/by-encounter/${encounterId}`
      }),
      providesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response,
      keepUnusedDataFor: 0
    }),

    createPlannedTreatment: builder.mutation<PlannedTreatmentDTO, PlannedTreatmentSaveDTO>({
      query: (body: PlannedTreatmentSaveDTO) => ({
        url: `/api/patient/dental/treatment-plan`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    updatePlannedTreatment: builder.mutation<
      PlannedTreatmentDTO,
      { id: number; body: PlannedTreatmentSaveDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/dental/treatment-plan/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    cancelPlannedTreatment: builder.mutation<
      PlannedTreatmentDTO,
      { id: number; body: PlannedTreatmentCancelDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/dental/treatment-plan/${id}/cancel`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    })
  })
});

export const {
  useGetTreatmentPlanByEncounterQuery,
  useCreatePlannedTreatmentMutation,
  useUpdatePlannedTreatmentMutation,
  useCancelPlannedTreatmentMutation
} = dentalTreatmentPlanService;
