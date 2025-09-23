import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export const departmentService = createApi({
  reducerPath: 'newDepartmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['Department'],
  endpoints: builder => ({
    getDepartment: builder.query({
      query: () => '/api/setup/department',
    }),

    getDepartmentById: builder.query({
      query: (id) => `/api/setup/department/${id}`,
    }),

    getDepartmentByFacility: builder.query({
      query: (facilityId) => `/api/setup/department/facility/${facilityId}`,
    }),

    getDepartmentByType: builder.query({
      query: (type) => ({
        url: '/api/setup/department/department-list-by-type',
        method: 'GET',
        headers: {
          'type': type, 
        },
      }),
    }),

    getDepartmentByName: builder.query({
      query: (name) => ({
        url: '/api/setup/department/department-list-by-name',
        method: 'GET',
        headers: {
          'name': name,
        },
      }),
    }),

    addDepartment: builder.mutation({
      query: (department) => ({
        url: '/api/setup/department',
        method: 'POST',
        body: department,
      }),
    }),

    updateDepartment: builder.mutation({
      query: (department) => ({
        url: `/api/setup/department/${department.id}`,
        method: 'PUT',
        body: department,
      }),
     
    }),

  }),
});

export const {
  useGetDepartmentQuery,
  useGetDepartmentByIdQuery,
  useGetDepartmentByFacilityQuery,
  useGetDepartmentByTypeQuery,
  useGetDepartmentByNameQuery,
  useAddDepartmentMutation,
  useUpdateDepartmentMutation,
} = departmentService;
