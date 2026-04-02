import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export const facilityService = createApi({
  reducerPath: 'facilityApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    addFacility: builder.mutation({
      query: facility => ({
        url: '/api/setup/facility',
        method: 'POST',
        body: facility
      })
    }),
    deleteFacility: builder.mutation({
      query: facilityId => ({
        url: `/api/setup/facility/${facilityId}`,
        method: 'DELETE'
      })
    }),
    updateFacility: builder.mutation({
      query: facility => ({
        url: `/api/setup/facility/${facility.id}`,
        method: 'PUT',
        body: facility
      })
    }),

    getAllFacilities: builder.query({
      query: () => ({
        url: '/api/setup/facility',
        method: 'GET'
      })
    }),

    getFacilityById: builder.query({
      query: facilityId => ({
        url: `/api/setup/facility/${facilityId}`,
        method: 'GET'
      })
    }),
    getFacilityTypes: builder.query({
      query: () => ({
        url: '/api/setup/facility/facility-types',
        method: 'GET'
      })
    }),

    getActiveFacilities: builder.query({
      query: () => ({
        url: '/api/setup/facility/active',
        method: 'GET'
      })
    })
  })
});
export const {
  useAddFacilityMutation,
  useDeleteFacilityMutation,
  useUpdateFacilityMutation,
  useGetAllFacilitiesQuery,
  useGetFacilityByIdQuery,
  useGetFacilityTypesQuery,
  useGetActiveFacilitiesQuery
} = facilityService;
