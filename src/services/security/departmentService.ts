import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

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
    getActiveDepartmentByFacilityList: builder.query<any[], { facilityId: number | string }>({
      query: ({ facilityId }) => `/api/setup/department/facility/${facilityId}/active/list`
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
  useGetAllDepartmentsWithoutPaginationQuery,
  useGetDepartmentsByResourceTypeQuery,
  useLazyGetDepartmentsByResourceTypeQuery,
  useGetActiveAppointableDepartmentByTypeQuery,
  useLazyGetActiveAppointableDepartmentByTypeQuery,
  useGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery,
  useLazyGetAppointableActiveDepartmentsByEncounterTypeAndFacilityQuery,
  useGetDepartmentsBulkMutation,
  useGetActiveDepartmentsQuery,
  useLazyGetActiveDepartmentsQuery
} = departmentService;
