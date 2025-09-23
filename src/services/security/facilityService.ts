import { createApi } from '@reduxjs/toolkit/query/react';
import {BaseQuery } from '../../newApi';

export const facilityService = createApi({
  reducerPath: 'facilityApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    addFacility: builder.mutation({
      query: facility => ({
        url: '/api/setup/facility',
        method: 'POST',
        body: facility,
      }),
    }),
    deleteFacility: builder.mutation({
      query: (facilityId) => ({
        url: `/api/setup/facility/${facilityId}`,
        method: 'DELETE',
      }),
    }),
    updateFacility: builder.mutation({
      query: (facilityId) => ({
        url: `/api/setup/facility/${facilityId}`,
        method: 'PUT'
      }),
    }),

    getAllFacilities: builder.query({
      query: () => ({
        url: '/api/setup/facility',
        method: 'GET',
      }),
    }),

    getFacility: builder.mutation({
      query: (facilityId) => ({
        url: `/api/setup/facility/${facilityId}`,
        method: 'GET',
      }),
    }),


    getFacilityTypes: builder.query({
      query: () => ({
        url: '/api/setup/facility/facility-types',
        method: 'GET',
      }),
    }),


  }),


});
export const {
    useAddFacilityMutation, 
    useDeleteFacilityMutation,
    useUpdateFacilityMutation,
    useGetAllFacilitiesQuery,
    useGetFacilityMutation,
    useGetFacilityTypesQuery


} = facilityService;