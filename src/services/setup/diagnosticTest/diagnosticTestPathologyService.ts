// src/services/diagnosticTestPathologyService.ts

import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";
import { Pathology } from "@/types/model-types-new";

type PagedParams = { page: number; size: number; sort?: string };
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

export const diagnosticTestPathologyService = createApi({
  reducerPath: "diagnosticTestPathologyApi",
  baseQuery: BaseQuery,
  tagTypes: ["Pathology"],

  endpoints: (builder) => ({
    // 🔹 Get all Pathology records
    getAllPathologies: builder.query<PagedResult<Pathology>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/diagnostic-test-pathology",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: (response: Pathology[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["Pathology"],
    }),

    // 🔹 Get Pathology by ID
    getPathologyById: builder.query<Pathology, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-pathology/${id}`,
        method: "GET",
      }),
      providesTags: ["Pathology"],
    }),

    // 🔹 Get Pathology by TestId
    getPathologyByTestId: builder.query<Pathology, number>({
      query: (testId) => ({
        url: `/api/setup/diagnostic-test-pathology/by-test/${testId}`,
        method: "GET",
      }),
      providesTags: ["Pathology"],
    }),

    // 🔹 Create new Pathology
    createPathology: builder.mutation<Pathology, Partial<Pathology>>({
      query: (body) => ({
        url: "/api/setup/diagnostic-test-pathology",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Pathology"],
    }),

    // 🔹 Update Pathology
    updatePathology: builder.mutation<Pathology, { id: number; body: Pathology } >({
      query: ({ id, body }) => ({
        url: `/api/setup/diagnostic-test-pathology/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Pathology"],
    }),

    // 🔹 Delete Pathology
    deletePathology: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-pathology/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Pathology"],
    }),
  }),
});

export const {
  useGetAllPathologiesQuery,
  useGetPathologyByIdQuery,
  useGetPathologyByTestIdQuery,
  useCreatePathologyMutation,
  useUpdatePathologyMutation,
  useDeletePathologyMutation,
} = diagnosticTestPathologyService;
