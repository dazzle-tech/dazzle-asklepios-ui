import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

type PagedParams = { page: number; size: number; sort?: string };
type PagedResult<T> = { data: T[]; totalCount: number };

export const departmentService = createApi({
  reducerPath: 'newDepartmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['Department'],
  endpoints: builder => ({
    // GET /api/setup/department?page=&size=&sort=
    getDepartments: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/department',
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: (_res) => ['Department'],
    }),

    // GET /api/setup/department/{id}
    getDepartmentById: builder.query<any, number | string>({
      query: (id) => `/api/setup/department/${id}`,
      providesTags: (_res, _err, id) => ['Department'],
    }),

    // GET /api/setup/department/facility/{facilityId}?page=&size=&sort=
    getDepartmentByFacility: builder.query<PagedResult<any>, { facilityId: number | string } & PagedParams>({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/department/facility/${facilityId}`,
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Department'],
    }),

    // GET /api/setup/department/department-list-by-type?type=&page=&size=&sort=
    getDepartmentByType: builder.query<PagedResult<any>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/department/department-list-by-type',
        params: { type, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Department'],
    }),

    // GET /api/setup/department/department-list-by-name?name=&page=&size=&sort=
    getDepartmentByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/department/department-list-by-name',
        params: { name, page, size, sort },
      }),
      transformResponse: (response: any[], meta): PagedResult<any> => ({
        data: response,
        totalCount: Number(meta?.response?.headers.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['Department'],
    }),

    // POST /api/setup/department
    addDepartment: builder.mutation<any, any>({
      query: (department) => ({
        url: '/api/setup/department',
        method: 'POST',
        body: department,
      }),
      invalidatesTags: ['Department'],
    }),

    // PUT /api/setup/department/{id}
    updateDepartment: builder.mutation<any, any>({
      query: (department) => ({
        url: `/api/setup/department/${department.id}`,
        method: 'PUT',
        body: department,
      }),
      invalidatesTags: ['Department'],
    }),

    // PATCH /api/setup/department/{id}/toggle-active
    toggleDepartmentIsActive: builder.mutation<any, number>({
      query: (id) => ({
        url: `/api/setup/department/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Department'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useGetDepartmentByFacilityQuery,
  useLazyGetDepartmentByFacilityQuery,
  useGetDepartmentByTypeQuery,
  useLazyGetDepartmentByTypeQuery,
  useGetDepartmentByNameQuery,
  useLazyGetDepartmentByNameQuery,
  useAddDepartmentMutation,
  useUpdateDepartmentMutation,
  useToggleDepartmentIsActiveMutation,
} = departmentService;
