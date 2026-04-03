
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi'; 
import { OrganizationHolidayCreateDTO, OrganizationHolidayResponseVM, OrganizationHolidayUpdateDTO } from '@/types/model-types-new';



export const organizationHolidaysService = createApi({
  reducerPath: 'organizationHolidayApi',
  baseQuery: BaseQuery,
  tagTypes: ['OrganizationHoliday'],

  endpoints: (builder) => ({

    // ✅ GET ALL
    getAllOrganizationHolidays: builder.query<OrganizationHolidayResponseVM[], void>({
      query: () => '/api/setup/organization-holiday',
      providesTags: ['OrganizationHoliday'],
    }),

    // ✅ GET BY ID
    getOrganizationHoliday: builder.query<OrganizationHolidayResponseVM, number>({
      query: (id) => `/api/setup/organization-holiday/${id}`,
      providesTags: ['OrganizationHoliday'],
    }),

    // ✅ CREATE
    createOrganizationHoliday: builder.mutation<
      OrganizationHolidayResponseVM,
      OrganizationHolidayCreateDTO
    >({
      query: (body) => ({
        url: '/api/setup/organization-holiday',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OrganizationHoliday'],
    }),

    // ✅ UPDATE
    updateOrganizationHoliday: builder.mutation<
      OrganizationHolidayResponseVM,
      OrganizationHolidayUpdateDTO
    >({
      query: (body) => ({
        url: '/api/setup/organization-holiday',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['OrganizationHoliday'],
    }),

    // ✅ TOGGLE ACTIVE
    toggleOrganizationHoliday: builder.mutation<
      OrganizationHolidayResponseVM,
      number
    >({
      query: (id) => ({
        url: `/api/setup/organization-holiday/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['OrganizationHoliday'],
    }),

    // ✅ SEARCH
    searchOrganizationHolidays: builder.query<
      OrganizationHolidayResponseVM[],
      {
        name?: string;
        holidayType?: string;
        startDate?: string;
        endDate?: string;
        recurring?: boolean;
        allFacilities?: boolean;
        facilityId?: number;
      }
    >({
      query: (params) => ({
        url: '/api/setup/organization-holiday/search',
        params,
      }),
      providesTags: ['OrganizationHoliday'],
    }),

    // ✅ ACTIVE DESC
    getActiveHolidaysDesc: builder.query<OrganizationHolidayResponseVM[], void>({
      query: () => '/api/setup/organization-holiday/active-desc',
      providesTags: ['OrganizationHoliday'],
    }),

    getActiveHolidaysInRange: builder.query<
      OrganizationHolidayResponseVM[],
      { fromDate: string; toDate: string; facilityId: number }
    >({
      query: ({ fromDate, toDate, facilityId }) => ({
        url: '/api/setup/organization-holiday/by-date-range',
        params: { fromDate, toDate, facilityId }
      }),
      providesTags: ['OrganizationHoliday']
    }),

  }),
});

export const {
  useGetAllOrganizationHolidaysQuery,
  useGetOrganizationHolidayQuery,
  useCreateOrganizationHolidayMutation,
  useUpdateOrganizationHolidayMutation,
  useToggleOrganizationHolidayMutation,
  useSearchOrganizationHolidaysQuery,
  useGetActiveHolidaysDescQuery,
  useGetActiveHolidaysInRangeQuery,
} = organizationHolidaysService;