import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import { ApPatientObservationSummary } from '@/types/model-types';

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
  })
});

export const {
  useGetObservationSummariesQuery,
  useSaveObservationSummaryMutation,
  useRemoveObservationSummaryMutation
} = observationService;
