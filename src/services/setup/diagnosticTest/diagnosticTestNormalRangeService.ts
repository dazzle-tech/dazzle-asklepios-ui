import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

export const diagnosticTestNormalRangeService = createApi({
  reducerPath: "diagnosticTestNormalRangeApi",
  baseQuery: BaseQuery,
  tagTypes: ["DiagnosticTestNormalRange"],
  endpoints: (builder) => ({
    // 🔹 Get all normal ranges (paginated)
    getAllDiagnosticTestNormalRanges: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/diagnostic-test-normal-ranges",
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
      providesTags: ["DiagnosticTestNormalRange"],
    }),

    // 🔹 Get by testId (paginated)
    getDiagnosticTestNormalRangesByTestId: builder.query<PagedResult<any>, { testId: number; page: number; size: number }>({
      query: ({ testId, page, size }) => ({
        url: `/api/setup/diagnostic-test-normal-ranges/by-test/${testId}`,
        method: "GET",
        params: { page, size },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DiagnosticTestNormalRange"],
    }),

    // 🔹 Get by ID
    getDiagnosticTestNormalRangeById: builder.query<any, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-normal-ranges/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "DiagnosticTestNormalRange", id }],
    }),

    // 🔹 Create new
    createDiagnosticTestNormalRange: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/setup/diagnostic-test-normal-ranges",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticTestNormalRange"],
    }),

    // 🔹 Update existing
    updateDiagnosticTestNormalRange: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/setup/diagnostic-test-normal-ranges/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DiagnosticTestNormalRange", id },
        "DiagnosticTestNormalRange",
      ],
    }),

    // 🔹 Delete
    deleteDiagnosticTestNormalRange: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-normal-ranges/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DiagnosticTestNormalRange"],
    }),
     // 🔹 Get LOVs by normalRangeId
    getLovsByNormalRangeId: builder.query<string[], number>({
      query: (normalRangeId) => ({
        url: `/api/setup/diagnostic-test-normal-ranges/${normalRangeId}/lovs`,
        method: "GET",
      }),
      providesTags: ["DiagnosticTestNormalRange"],
    }),
  }),
});

export const {
  useGetAllDiagnosticTestNormalRangesQuery,
  useGetDiagnosticTestNormalRangesByTestIdQuery,
  useGetDiagnosticTestNormalRangeByIdQuery,
  useCreateDiagnosticTestNormalRangeMutation,
  useUpdateDiagnosticTestNormalRangeMutation,
  useDeleteDiagnosticTestNormalRangeMutation,
  useGetLovsByNormalRangeIdQuery
} = diagnosticTestNormalRangeService;
