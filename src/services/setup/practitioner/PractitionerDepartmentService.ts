import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";
import { parseLinkHeader } from "@/utils/paginationHelper";

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

const mapPaged = (response: any[], meta: any): PagedResult<any> => {
  const headers = meta?.response?.headers;

  return {
    data: response,
    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
    links: parseLinkHeader(headers?.get("Link")),
  };
};

export const PractitionerDepartmentService = createApi({
  reducerPath: "practitionerDepartmentApi",
  baseQuery: BaseQuery,
  tagTypes: ["PractitionerDepartment"],
  endpoints: (builder) => ({

    // 🔹 Create link between practitioner and department
    createPractitionerDepartment: builder.mutation({
      query: (body) => ({
        url: "/api/setup/practitioner-department",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PractitionerDepartment"],
    }),

    // 🔹 Get all departments linked to a practitioner
    getDepartmentsByPractitioner: builder.query({
      query: (practitionerId) => ({
        url: `/api/setup/practitioner/${practitionerId}/departments`,
        method: "GET",
      }),
      providesTags: ["PractitionerDepartment"],
    }),

    getPractitionersByDepartment: builder.query<
      PagedResult<any>,
      { departmentId: number; page: number; size: number; sort?: string }
    >({
      query: ({ departmentId, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/department/${departmentId}/practitioners`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: any, meta) => {
        const rows = Array.isArray(response)
          ? response
          : (response?.content ?? []);
        return mapPaged(rows, meta);
      },
      providesTags: ["PractitionerDepartment"],
    }),

    deletePractitionerDepartment: builder.mutation({
      query: ({ practitionerId, departmentId }) => ({
        url: `/api/setup/practitioner/${practitionerId}/departments/${departmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PractitionerDepartment"],
    }),
  }),
});

export const {
  useCreatePractitionerDepartmentMutation,
  useGetDepartmentsByPractitionerQuery,
  useGetPractitionersByDepartmentQuery,         
  useLazyGetPractitionersByDepartmentQuery,      
  useDeletePractitionerDepartmentMutation,
} = PractitionerDepartmentService;
