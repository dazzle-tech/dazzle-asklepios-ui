import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import { ApPatientObservationSummary, ApVisitAllergies, ApVisitWarning,ApEncounterVaccination } from '@/types/model-types';

export const observationService = createApi({
  reducerPath: 'observationApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getObservationSummaries: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/observation/observation-summary-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),
    saveObservationSummary: builder.mutation({
      query: ({ observation, listRequest }) => ({
        url: `/observation/save-observation-summary?${fromListRequestToQueryParams(listRequest)}`,
        method: 'POST',
        body: observation, 
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response) => {
        return response; 
      },
    }),
    
    removeObservationSummary: builder.mutation({
      query: (observation: ApPatientObservationSummary) => ({
        url: `/observation/remove-observation-summary`,
        method: 'POST',
        body: observation
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
    ,
    getAllergies: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/observation/allergies-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
   saveAllergies: builder.mutation({
      query: (allergies:ApVisitAllergies) => ({
        url: `/observation/save-allergies`,
        method: 'POST',
        body: allergies
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getWarnings: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/observation/warnings-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
   saveWarnings: builder.mutation({
      query: (allergies:ApVisitWarning) => ({
        url: `/observation/save-warnings`,
        method: 'POST',
        body: allergies
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    saveEncounterVaccine: builder.mutation({
      query: (encounterVaccination: ApEncounterVaccination) => ({
        url: `/observation/save-encounter-vaccine`,
        method: 'POST',
        body: encounterVaccination
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }

  }),  getEncounterVaccine: builder.query({
    query: (listRequest: ListRequest) => ({
      url: `/observation/encounter-vaccine-list?${fromListRequestToQueryParams(listRequest)}`
    }),
    onQueryStarted: onQueryStarted,
    keepUnusedDataFor: 5
  }),})
});

export const {
  useGetObservationSummariesQuery,
  useSaveObservationSummaryMutation,
  useRemoveObservationSummaryMutation,
   useGetAllergiesQuery,
   useSaveAllergiesMutation,
   useGetWarningsQuery,
   useSaveWarningsMutation,
   useSaveEncounterVaccineMutation,
   useGetEncounterVaccineQuery
} = observationService;
