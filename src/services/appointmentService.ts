import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
  ApResources
} from '@/types/model-types';

export const appointmentService = createApi({
  reducerPath: 'appointmentSetupApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getResources: builder.query({
        query: (listRequest: ListRequest) => ({
          url: `/appointment/resources-list?${fromListRequestToQueryParams(listRequest)}`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
      }),
      getResourceType: builder.query({
        query: (resource_type: string) => ({
          headers: {
            resource_type
          },
          url: `/appointment/resource-type-list`
        }),
        onQueryStarted: onQueryStarted,
        keepUnusedDataFor: 5
       
      }),
      saveResources: builder.mutation({
        query: (resources: ApResources) => ({
          url: `/appointment/save-resources`,
          method: 'POST',
          body: resources
        }),
        onQueryStarted: onQueryStarted,
        transformResponse: (response: any) => {
          return response.object;
        }
      }),
    })
});

export const {
  
    useGetResourcesQuery,
    useGetResourceTypeQuery,
    useSaveResourcesMutation

 
} = appointmentService;