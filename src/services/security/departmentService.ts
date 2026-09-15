import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type { Department, DepartmentResponseVM } from '@/types/model-types-new';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

export const departmentService = createApi({
  reducerPath: 'newDepartmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['Department'],
  endpoints: builder => ({
    // GET /api/setup/department?page=&size=&sort=
    getDepartments: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc', timestamp }) => ({
        url: '/api/setup/department',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: _res => ['Department']
    }),

    // GET /api/setup/department/{id}
    getDepartmentById: builder.query<any, number | string>({
      query: id => `/api/setup/department/${id}`,
      providesTags: (_res, _err, id) => ['Department']
    }),

    // GET /api/setup/department/by-facility/{facilityId}?page=&size=&sort=
    getDepartmentByFacility: builder.query<
      PagedResult<any>,
      { facilityId: number | string } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/by-facility/${facilityId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // GET /api/setup/department/by-type/{type}?page=&size=&sort=
    getDepartmentByType: builder.query<PagedResult<any>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/by-type/${type}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    getActiveDepartmentByType: builder.query<PagedResult<any>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/active/department/by-type/${type}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // GET /api/setup/department/by-type-and-facility/{type}/{facilityId}?page=&size=&sort=
    getDepartmentByTypeAndFacility: builder.query<
      PagedResult<any>,
      { type: string; facilityId: number | string } & PagedParams
    >({
      query: ({ type, facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/by-type-and-facility/${type}/${facilityId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // GET /api/setup/department/by-type-and-facility-and-active/{type}/{facilityId}?page=&size=&sort=
    getDepartmentByTypeAndFacilityAndActive: builder.query<
      PagedResult<any>,
      { type: string; facilityId: number | string } & PagedParams
    >({
      query: ({ type, facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/by-type-and-facility-and-active/${type}/${facilityId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // GET /api/setup/department/appointable/{facilityId}?page=&size=&sort=
    getAppointableDepartments: builder.query<
      PagedResult<any>,
      { facilityId: number | string } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/department/appointable/${facilityId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // GET /api/setup/department/appointable/by-type/{type}/{facilityId}?page=&size=&sort=
    getAppointableDepartmentByType: builder.query<
      PagedResult<any>,
      { type: string; facilityId: number | string } & PagedParams
    >({
      query: ({ type, facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/appointable/by-type/${type}/${facilityId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    getActiveAppointableDepartmentByType: builder.query<
      PagedResult<any>,
      { type: string; facilityId: number | string } & PagedParams
    >({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/appointable/active/by-type/${type}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // GET /api/setup/department/by-name/{name}?page=&size=&sort=
    getDepartmentByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/by-name/${name}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // POST /api/setup/department
    addDepartment: builder.mutation<any, any>({
      query: department => ({
        url: '/api/setup/department',
        method: 'POST',
        body: department
      }),
      invalidatesTags: ['Department']
    }),

    // PUT /api/setup/department/{id}
    updateDepartment: builder.mutation<any, any>({
      query: department => ({
        url: `/api/setup/department/${department.id}`,
        method: 'PUT',
        body: department
      }),
      invalidatesTags: ['Department']
    }),

    // PATCH /api/setup/department/{id}/toggle-active
    toggleDepartmentIsActive: builder.mutation<any, number>({
      query: id => ({
        url: `/api/setup/department/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Department']
    }),

    // GET /api/setup/department/facility/{facilityId}/active/list
    getActiveDepartmentByFacilityList: builder.query<
      DepartmentResponseVM[],
      { facilityId: number | string }
    >({
      query: ({ facilityId }) => `/api/setup/department/facility/${facilityId}/active/list`,
    }),

    // GET /api/setup/department/bookable-departments
    getBookableDepartmentsForLoggedInUser: builder.query<Department[], void>({
      query: () => '/api/setup/department/bookable-departments',
      providesTags: ['Department']
    }),

    // GET /api/setup/department/all
    getAllDepartmentsWithoutPagination: builder.query({
      query: () => `/api/setup/department/all`
    }),

    getDepartmentsByResourceType: builder.query<any[], { resourceType: string }>({
      query: ({ resourceType }) => ({
        url: `/api/setup/department/by-resource-type/${resourceType}`
      }),
      providesTags: ['Department']
    }),

    getAppointableActiveDepartmentsByEncounterTypeAndFacility: builder.query<
      PagedResult<any>,
      { facilityId: number | string; encounterType: string } & PagedParams
    >({
      query: ({ facilityId, encounterType, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/appointable/active/by-encounter-type/${encounterType}/${facilityId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    getDepartmentsBulk: builder.mutation({
      query: (ids: number[]) => ({
        url: '/api/setup/department/bulk',
        method: 'POST',
        body: ids
      })
    }),

    getActiveDepartments: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/department/active',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),


    // GET /api/setup/department/active/by-type-and-facility/{type}/{facilityId}
    // This endpoint returns a plain list WITHOUT pagination
    getActiveDepartmentByTypeAndFacility: builder.query<
      any[],
      { type: string; facilityId: number | string }
    >({
      query: ({ type, facilityId }) => ({
        url: `/api/setup/department/active/by-type-and-facility/${type}/${facilityId}`
      }),
      providesTags: ['Department']
    }),

    getActiveAppointableDepartments: builder.query<
      PagedResult<any>,
      { facilityId: number } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/department/appointable/active',
        params: { facilityId, page, size, sort }
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      providesTags: ['Department']
    }),

    // GET /api/setup/department/{departmentId}/age-allowed?dateOfBirth=YYYY-MM-DD
    isPatientAgeAllowed: builder.query<
      boolean,
      { departmentId: number | string; dateOfBirth: string }
    >({
      query: ({ departmentId, dateOfBirth }) => ({
        url: `/api/setup/department/${departmentId}/age-allowed`,
        params: { dateOfBirth }
      })
    })
  })
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useLazyGetDepartmentByIdQuery,
  useGetDepartmentByFacilityQuery,
  useLazyGetDepartmentByFacilityQuery,
  useGetDepartmentByTypeQuery,
  useLazyGetDepartmentByTypeQuery,
  useGetDepartmentByTypeAndFacilityQuery,
  useLazyGetDepartmentByTypeAndFacilityQuery,
  useGetDepartmentByTypeAndFacilityAndActiveQuery,
  useLazyGetDepartmentByTypeAndFacilityAndActiveQuery,
  useGetAppointableDepartmentsQuery,
  useLazyGetAppointableDepartmentsQuery,
  useGetAppointableDepartmentByTypeQuery,
  useLazyGetAppointableDepartmentByTypeQuery,
  useGetDepartmentByNameQuery,
  useLazyGetDepartmentByNameQuery,
  useAddDepartmentMutation,
  useUpdateDepartmentMutation,
  useToggleDepartmentIsActiveMutation,
  useGetActiveDepartmentByFacilityListQuery,
  useLazyGetActiveDepartmentByFacilityListQuery,
  useGetBookableDepartmentsForLoggedInUserQuery,
  useLazyGetBookableDepartmentsForLoggedInUserQuery,
  useGetAllDepartmentsWithoutPaginationQuery,
  useGetDepartmentsByResourceTypeQuery,
  useLazyGetDepartmentsByResourceTypeQuery,
  useGetActiveAppointableDepartmentByTypeQuery,
  useLazyGetActiveAppointableDepartmentByTypeQuery,
  useGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery,
  useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery,
  useGetDepartmentsBulkMutation,
  useGetActiveDepartmentsQuery,
  useLazyGetActiveDepartmentsQuery,
  useGetActiveDepartmentByTypeQuery,
  useGetActiveDepartmentByTypeAndFacilityQuery,
  useLazyGetActiveDepartmentByTypeAndFacilityQuery,
  useLazyGetActiveDepartmentByTypeQuery,
  useIsPatientAgeAllowedQuery,
  useLazyIsPatientAgeAllowedQuery
} = departmentService;