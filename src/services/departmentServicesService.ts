import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../newApi';

type Id = number | string;
type EncounterReason = string;

export interface DepartmentServicesResponse {
  id: number;
  service: EncounterReason;
}

export interface ReplaceDepartmentServicesRequest {
  departmentId: Id;
  services: EncounterReason[];
}

export const departmentServicesService = createApi({
  reducerPath: 'departmentServicesApi',
  baseQuery: BaseQuery,
  tagTypes: ['DepartmentServices'],
  endpoints: (builder) => ({
    getDepartmentServices: builder.query<
      DepartmentServicesResponse[],
      { departmentId: Id }
    >({
      query: ({ departmentId }) => ({
        url: `/api/setup/departmentServices/${encodeURIComponent(
          String(departmentId)
        )}/services`,
        method: 'GET',
      }),
      providesTags: (result, _err, { departmentId }) =>
        result
          ? [
              ...result.map((item) => ({
                type: 'DepartmentServices' as const,
                id: item.id,
              })),
              { type: 'DepartmentServices', id: `LIST_${departmentId}` },
            ]
          : [{ type: 'DepartmentServices', id: `LIST_${departmentId}` }],
    }),

    replaceDepartmentServices: builder.mutation<
      DepartmentServicesResponse[],
      ReplaceDepartmentServicesRequest
    >({
      query: ({ departmentId, services }) => ({
        url: `/api/setup/departmentServices/${encodeURIComponent(
          String(departmentId)
        )}/services`,
        method: 'PUT',
        body: { services },
      }),
      invalidatesTags: (_res, _err, { departmentId }) => [
        { type: 'DepartmentServices', id: `LIST_${departmentId}` },
      ],
    }),
  }),
});

export const {
  useGetDepartmentServicesQuery,
  useLazyGetDepartmentServicesQuery,
  useReplaceDepartmentServicesMutation,
} = departmentServicesService;
