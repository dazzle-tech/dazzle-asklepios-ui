import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';

export const facilityService = createApi({
  reducerPath: 'facilityApi',
   tagTypes: ['Facilities'],
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

    // Facilities screen: same list with optional filters ANDed by the backend; empty ones are left out
    searchFacilities: builder.query<
      any[],
      { code?: string; name?: string; type?: string; emailAddress?: string; isActive?: boolean }
    >({
      query: ({ code, name, type, emailAddress, isActive }) => ({
        url: '/api/setup/facility',
        method: 'GET',
        params: {
          code: code?.trim() || undefined,
          name: name?.trim() || undefined,
          type: type || undefined,
          emailAddress: emailAddress?.trim() || undefined,
          isActive
        }
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

    getActiveFacilities: builder.query<any[], void>({
      query: () => ({
        url: '/api/setup/facility/active',
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return response;
        }
        return response?.value ?? response?.data ?? response?.content ?? [];
      },
      providesTags: ['Facilities']
    })
  })
});
export const {
  useAddFacilityMutation,
  useDeleteFacilityMutation,
  useUpdateFacilityMutation,
  useGetAllFacilitiesQuery,
  useSearchFacilitiesQuery,
  useGetFacilityByIdQuery,
  useLazyGetFacilityByIdQuery,
  useGetFacilityTypesQuery,
  useGetActiveFacilitiesQuery
} = facilityService;
