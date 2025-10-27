import { BaseQuery } from "@/newApi";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

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
        body, // { practitionerId, departmentId }
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

    // 🔹 Delete link between practitioner and department
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
  useDeletePractitionerDepartmentMutation,
} = PractitionerDepartmentService;
