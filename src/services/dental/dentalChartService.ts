import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery as baseQuery, onQueryStarted } from '../../newApi';

import type {
  ChartUpdateDTO,
  DentalChartResponseDTO,
  ProgressNoteDTO,
  ProgressNoteSaveDTO,
  ToothActionCancelDTO,
  ToothActionSaveDTO,
  ToothServiceCancelDTO,
  ToothServiceSaveDTO
} from '@/types/model-types-new';

export const dentalChartService = createApi({
  reducerPath: 'dentalChartApi',
  baseQuery: baseQuery,
  tagTypes: ['DentalChart', 'ProgressNote'],

  endpoints: builder => ({
    getOrCreateChartForEncounter: builder.query<DentalChartResponseDTO, number>({
      query: (encounterId: number) => ({
        url: `/api/patient/dental/charts/by-encounter/${encounterId}`
      }),
      providesTags: ['DentalChart'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response,
      keepUnusedDataFor: 0
    }),

    getChartById: builder.query<DentalChartResponseDTO, number>({
      query: (chartId: number) => ({
        url: `/api/patient/dental/charts/${chartId}`
      }),
      providesTags: ['DentalChart'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response,
      keepUnusedDataFor: 0
    }),

    updateChart: builder.mutation<DentalChartResponseDTO, { chartId: number; body: ChartUpdateDTO }>({
      query: ({ chartId, body }) => ({
        url: `/api/patient/dental/charts/${chartId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DentalChart'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    saveToothAction: builder.mutation<DentalChartResponseDTO, ToothActionSaveDTO>({
      query: (body: ToothActionSaveDTO) => ({
        url: `/api/patient/dental/tooth-actions`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalChart'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    cancelToothAction: builder.mutation<
      DentalChartResponseDTO,
      { id: number; body: ToothActionCancelDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/dental/tooth-actions/${id}/cancel`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalChart'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    saveToothService: builder.mutation<DentalChartResponseDTO, ToothServiceSaveDTO>({
      query: (body: ToothServiceSaveDTO) => ({
        url: `/api/patient/dental/tooth-services`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalChart'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    cancelToothService: builder.mutation<
      DentalChartResponseDTO,
      { id: number; body: ToothServiceCancelDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/dental/tooth-services/${id}/cancel`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalChart'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    getProgressNotesByChart: builder.query<ProgressNoteDTO[], number>({
      query: (chartId: number) => ({
        url: `/api/patient/dental/charts/${chartId}/progress-notes`
      }),
      providesTags: ['ProgressNote'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response,
      keepUnusedDataFor: 0
    }),

    saveProgressNotes: builder.mutation<
      ProgressNoteDTO[],
      { chartId: number; notes: ProgressNoteSaveDTO[] }
    >({
      query: ({ chartId, notes }) => ({
        url: `/api/patient/dental/charts/${chartId}/progress-notes`,
        method: 'PUT',
        body: notes
      }),
      invalidatesTags: ['ProgressNote'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => response
    }),

    deleteProgressNote: builder.mutation<void, number>({
      query: (noteId: number) => ({
        url: `/api/patient/dental/progress-notes/${noteId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ProgressNote'],
      onQueryStarted: onQueryStarted
    })
  })
});

export const {
  useGetOrCreateChartForEncounterQuery,
  useGetChartByIdQuery,
  useUpdateChartMutation,
  useSaveToothActionMutation,
  useCancelToothActionMutation,
  useSaveToothServiceMutation,
  useCancelToothServiceMutation,
  useGetProgressNotesByChartQuery,
  useSaveProgressNotesMutation,
  useDeleteProgressNoteMutation
} = dentalChartService;
