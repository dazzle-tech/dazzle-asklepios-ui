import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery as baseQuery, onQueryStarted } from '../../newApi';

import type {
  DentalPlannedTreatmentStatusLogDTO,
  DentalTreatmentPlanResponseDTO,
  DentalTreatmentPlanSaveDTO,
  DentalTreatmentPlanStatusLogDTO,
  DentalTreatmentPlanSummaryDTO,
  DentalTreatmentSessionDTO,
  PlannedTreatmentBatchSaveDTO,
  PlannedTreatmentCancelDTO,
  PlannedTreatmentDTO,
  PlannedTreatmentSaveDTO
} from '@/types/model-types-new';

export const dentalTreatmentPlanService = createApi({
  reducerPath: 'dentalTreatmentPlanApi',
  baseQuery: baseQuery,
  tagTypes: ['DentalTreatmentPlan'],

  endpoints: builder => ({
    getTreatmentSessionsByPatient: builder.query<number[], number>({
      query: (patientId: number) => ({
        url: `/api/patient/dental/treatment-plan/sessions/by-patient/${patientId}`
      }),
      providesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    getTreatmentsByPlan: builder.query<PlannedTreatmentDTO[], number>({
      query: (planId: number) => ({
        url: `/api/patient/dental/treatment-plan/by-plan/${planId}`
      }),
      providesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response,
      keepUnusedDataFor: 0
    }),

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

    createPlannedTreatmentsBatch: builder.mutation<
      PlannedTreatmentDTO[],
      PlannedTreatmentBatchSaveDTO
    >({
      query: (body: PlannedTreatmentBatchSaveDTO) => ({
        url: `/api/patient/dental/treatment-plan/batch`,
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
    }),

    startPlannedTreatment: builder.mutation<
      PlannedTreatmentDTO,
      { id: number; executionEncounterId: number }
    >({
      query: ({ id, executionEncounterId }) => ({
        url: `/api/patient/dental/treatment-plan/${id}/start`,
        method: 'POST',
        body: { executionEncounterId }
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    completePlannedTreatment: builder.mutation<
      PlannedTreatmentDTO,
      { id: number; executionEncounterId: number }
    >({
      query: ({ id, executionEncounterId }) => ({
        url: `/api/patient/dental/treatment-plan/${id}/complete`,
        method: 'POST',
        body: { executionEncounterId }
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    getTreatmentPlansByPatient: builder.query<DentalTreatmentPlanSummaryDTO[], number>({
      query: (patientId: number) => ({
        url: `/api/patient/dental/treatment-plans/by-patient/${patientId}`
      }),
      providesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    getTreatmentPlanSessions: builder.query<DentalTreatmentSessionDTO[], number>({
      query: (planId: number) => ({
        url: `/api/patient/dental/treatment-plans/${planId}/sessions`
      }),
      providesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    getTreatmentPlanStatusLog: builder.query<DentalTreatmentPlanStatusLogDTO[], number>({
      query: (planId: number) => ({
        url: `/api/patient/dental/treatment-plans/${planId}/status-log`
      }),
      providesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    getTreatmentPlanTreatmentHistory: builder.query<
      DentalPlannedTreatmentStatusLogDTO[],
      number
    >({
      query: (planId: number) => ({
        url: `/api/patient/dental/treatment-plans/${planId}/treatment-history`
      }),
      providesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    createTreatmentPlan: builder.mutation<
      DentalTreatmentPlanSummaryDTO,
      DentalTreatmentPlanSaveDTO
    >({
      query: body => ({
        url: `/api/patient/dental/treatment-plans`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    updateTreatmentPlanHeader: builder.mutation<
      DentalTreatmentPlanSummaryDTO,
      { id: number; body: DentalTreatmentPlanSaveDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/dental/treatment-plans/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    proposeTreatmentPlan: builder.mutation<DentalTreatmentPlanSummaryDTO, number>({
      query: id => ({
        url: `/api/patient/dental/treatment-plans/${id}/propose`,
        method: 'POST'
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    acceptTreatmentPlan: builder.mutation<DentalTreatmentPlanSummaryDTO, number>({
      query: id => ({
        url: `/api/patient/dental/treatment-plans/${id}/accept`,
        method: 'POST'
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    returnTreatmentPlanToDraft: builder.mutation<
      DentalTreatmentPlanSummaryDTO,
      { id: number; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/api/patient/dental/treatment-plans/${id}/return-to-draft`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    holdTreatmentPlan: builder.mutation<
      DentalTreatmentPlanSummaryDTO,
      { id: number; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/api/patient/dental/treatment-plans/${id}/hold`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    resumeTreatmentPlan: builder.mutation<DentalTreatmentPlanSummaryDTO, number>({
      query: id => ({
        url: `/api/patient/dental/treatment-plans/${id}/resume`,
        method: 'POST'
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    cancelTreatmentPlan: builder.mutation<
      DentalTreatmentPlanSummaryDTO,
      { id: number; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/api/patient/dental/treatment-plans/${id}/cancel`,
        method: 'POST',
        body: { reason }
      }),
      invalidatesTags: ['DentalTreatmentPlan'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    })
  })
});

export const {
  useGetTreatmentPlanByEncounterQuery,
  useGetTreatmentsByPlanQuery,
  useCreatePlannedTreatmentMutation,
  useCreatePlannedTreatmentsBatchMutation,
  useUpdatePlannedTreatmentMutation,
  useCancelPlannedTreatmentMutation,
  useStartPlannedTreatmentMutation,
  useCompletePlannedTreatmentMutation,
  useGetTreatmentSessionsByPatientQuery,
  useGetTreatmentPlansByPatientQuery,
  useGetTreatmentPlanSessionsQuery,
  useGetTreatmentPlanStatusLogQuery,
  useGetTreatmentPlanTreatmentHistoryQuery,
  useCreateTreatmentPlanMutation,
  useUpdateTreatmentPlanHeaderMutation,
  useProposeTreatmentPlanMutation,
  useAcceptTreatmentPlanMutation,
  useReturnTreatmentPlanToDraftMutation,
  useHoldTreatmentPlanMutation,
  useResumeTreatmentPlanMutation,
  useCancelTreatmentPlanMutation
} = dentalTreatmentPlanService;
