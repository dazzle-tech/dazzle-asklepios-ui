import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
  ApDvmRule,
  ApMetadata,
  ApMetadataField,
  ApScreenMetadata, 
} from '@/types/model-types';

export const dvmService = createApi({
  reducerPath: 'dvmApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getScreenMetadata: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/dvm/screen-metadata-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveScreenMetadata: builder.mutation({
      query: (screenMetadata: ApScreenMetadata) => ({
        url: `/dvm/save-screen-metadata`,
        method: 'POST',
        body: screenMetadata
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getDvmRules: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/dvm/dvm-rule-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveDvmRule: builder.mutation({
      query: (dvmRule: ApDvmRule) => ({
        url: `/dvm/save-dvm-rule`,
        method: 'POST',
        body: dvmRule
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
  })
});

export const {
  useGetScreenMetadataQuery,
  useSaveScreenMetadataMutation,
  useGetDvmRulesQuery,
  useSaveDvmRuleMutation
} = dvmService;
