import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
  ApAppointment,
  ApResources,
  ApResourcesAvailabilityTime
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
    getResourcesWithAvailability: builder.query({
      query: (listRequest) => ({
        url: `/appointment/resources-with-availability?${fromListRequestToQueryParams(listRequest)}`
      }),
      keepUnusedDataFor: 5
    }),
    getResourceWithDetails: builder.query({
      query: (id) => ({
        url: `/appointment/resources-with-availability?id=${id}`
      }),
      keepUnusedDataFor: 5
    }),
    getResourcesByResourceId: builder.query({
      query: (resourceKey: string) => ({
        url: `/appointment/resource-by-key`,
        params: {
          resourceKey
        }
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    getResourcesAvailability: builder.query({
      query: ({ resource_key, facility_id }) => ({
        url: `/appointment/resources-availability-list?resource_key=${resource_key}&facility_id=${facility_id}`,
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5,
    }),
    getAppointments: builder.query({
      query: ({ resource_type, facility_id, resources }) => {
        const resourcesParam = resources;
        return {
          url: `/appointment/appointments-list?resource_type=${resource_type}&facility_id=${facility_id}&resources=${resourcesParam}`,
        };
      },
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5,
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
    changeAppointmentStatus: builder.mutation({
      query: (appointment: ApAppointment) => ({
        url: `/appointment/save-appointment`,
        method: 'POST',
        body: appointment
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    saveAppointment: builder.mutation({
      query: (appointment: ApAppointment) => ({
        url: `/appointment/save-appointment`,
        method: 'POST',
        body: appointment
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getResourcesAvailabilityTime: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/appointment/resources-availability-time-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveResourcesAvailabilityTime: builder.mutation({
      query: (resourcesAvailabilityTime: ApResourcesAvailabilityTime) => ({
        url: `/appointment/save-resources-availability-time`,
        method: 'POST',
        body: resourcesAvailabilityTime
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    // TestTest
    deactiveActiveResource: builder.mutation({
      query: (resource: ApResources) => ({
        url: `/appointment/remove-resource`,
        method: 'POST',
        body: resource,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
    saveAvailabilitySlices: builder.mutation({
      query: (requestData) => ({
        url: '/appointment/save',
        method: 'POST',
        body: requestData,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
    }),
  }),



});

export const {
  useSaveAvailabilitySlicesMutation,
  useGetResourcesQuery,
  useGetResourcesWithAvailabilityQuery,
  useGetResourceWithDetailsQuery,
  useGetResourcesByResourceIdQuery,
  useGetResourceTypeQuery,
  useSaveResourcesMutation,
  useGetResourcesAvailabilityTimeQuery,
  useSaveResourcesAvailabilityTimeMutation,
  useSaveAppointmentMutation,
  useGetResourcesAvailabilityQuery,
  useGetAppointmentsQuery,
  useChangeAppointmentStatusMutation,
  useDeactiveActiveResourceMutation


} = appointmentService;