import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

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

export const laboratoryService = createApi({
  reducerPath: "newLaboratoryApi",
  baseQuery: BaseQuery,
  tagTypes: ["Laboratory"],

  endpoints: (builder) => ({
    // 🔹 Get all laboratories (paginated)
    getAllLaboratories: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/diagnostic-test-laboratories",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["Laboratory"],
    }),

    // 🔹 Get laboratory by id
    getLaboratoryById: builder.query<any, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-laboratories/${id}`,
        method: "GET",
      }),
      providesTags: ["Laboratory"],
    }),

    // 🔹 Get laboratory by testId
    getLaboratoryByTestId: builder.query<any, number>({
      query: (testId) => ({
        url: `/api/setup/diagnostic-test-laboratories/by-test/${testId}`,
        method: "GET",
      }),
      providesTags: ["Laboratory"],
    }),

    // 🔹 Create new laboratory
    createLaboratory: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/setup/diagnostic-test-laboratories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Laboratory"],
    }),

    // 🔹 Update laboratory
    updateLaboratory: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/setup/diagnostic-test-laboratories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Laboratory"],
    }),

    // 🔹 Delete laboratory
    deleteLaboratory: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-laboratories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Laboratory"],
    }),
  }),
});

export const {
  useGetAllLaboratoriesQuery,
  useGetLaboratoryByIdQuery,
  useGetLaboratoryByTestIdQuery, 
  useCreateLaboratoryMutation,
  useUpdateLaboratoryMutation,
  useDeleteLaboratoryMutation,
} = laboratoryService;
