import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
  ApDentalChart,
  ApDentalChartProgressNote,
  ApDentalPlannedTreatment
} from '@/types/model-types';

export const dentalService = createApi({
  reducerPath: 'dentalApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getActions: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/dental/dental-action-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getDentalChartsByEncounter: builder.query({
      query: (encounterKey: any) => ({
        headers: {
          "encounter-key": encounterKey
        },
        url: `/dental/dental-charts-by-encounter`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),
    modifyToothAction: builder.mutation({
      query: (request: any) => ({
        url: `/dental/modify-tooth-action`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveChart: builder.mutation({
      query: (chart: ApDentalChart) => ({
        url: `/dental/save-chart`,
        method: 'POST',
        body: chart
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveProgressNotes: builder.mutation({
      query: (notes: any) => ({
        url: `/dental/save-progress-notes`,
        method: 'POST',
        body: notes
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    deleteProgressNote: builder.mutation({
      query: (note: ApDentalChartProgressNote) => ({
        url: `/dental/delete-progress-note`,
        method: 'POST',
        body: note
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getChartData: builder.query({
      query: (chartKey: any) => ({
        headers: {
          "chart-key": chartKey
        },
        url: `/dental/fetch-chart-data`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 60 * 5
    }),
    modifyToothService: builder.mutation({
      query: (request: any) => ({
        url: `/dental/modify-tooth-service`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    fetchTreatmentPlan: builder.query({
      query: (data: any) => ({
        headers: {
          "encounter-key": data.encounterKey
        },
        url: `/dental/fetch-treatment-plan`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),
    savePlannedTreatment: builder.mutation({
      query: (request: ApDentalPlannedTreatment) => ({
        url: `/dental/save-planned-treatment`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    deletePlannedTreatment: builder.mutation({
      query: (request: ApDentalPlannedTreatment) => ({
        url: `/dental/delete-planned-treatment`,
        method: 'POST',
        body: request
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
  })
});

export const {
  useGetActionsQuery,
  useGetDentalChartsByEncounterQuery,
  useModifyToothActionMutation,
  useSaveChartMutation,
  useSaveProgressNotesMutation,
  useDeleteProgressNoteMutation,
  useGetChartDataQuery,
  useModifyToothServiceMutation,
  useFetchTreatmentPlanQuery,
  useSavePlannedTreatmentMutation,
  useDeletePlannedTreatmentMutation, 
} = dentalService;
