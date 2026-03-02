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

type DiagnosticTest = {
  id: string;
  name: string;
  type: string;
  internalCode?: string;
  price?: number;
  currency?: string;
  specialNotes?: string;
};

export const diagnosticTestService = createApi({
  reducerPath: "newDiagnosticTestApi",
  baseQuery: BaseQuery,
  tagTypes: ["DiagnosticTest"],
  endpoints: (builder) => ({
    // 🔹 Get all diagnostic tests (paginated)
    getAllDiagnosticTests: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/diagnostic-test",
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
      providesTags: ["DiagnosticTest"],
    }),

     getAllActiveDiagnosticTests: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/diagnostic-test/active",
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
      providesTags: ["DiagnosticTest"],
    }),
      getAllActiveAppointableDiagnosticTests: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/diagnostic-test/active-appointable",
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
      providesTags: ["DiagnosticTest"],
    }),
    getAllDiagnosticTestsByNameAndType: builder.query({
      query: ({ type, name, ...params }) => ({
        url: `/api/setup/diagnostic-test/by-type-and-name?type=${type}&name=${name}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DiagnosticTest"],
    }),

    // 🔹 Get diagnostic tests by type
    getDiagnosticTestsByType: builder.query({
      query: ({ type, ...params }) => ({
        url: `/api/setup/diagnostic-test/by-type/${type}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DiagnosticTest"],
    }),

    // 🔹 Get diagnostic tests by name
    getDiagnosticTestsByName: builder.query({
      query: ({ name, ...params }) => ({
        url: `/api/setup/diagnostic-test/by-name/${name}`,
        method: "GET",
        params,
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DiagnosticTest"],
    }),

    // 🔹 Get single diagnostic test
    getDiagnosticTestById: builder.query<
      { data: DiagnosticTest },
      string
    >({
      query: (id) => ({
        url: `/api/setup/diagnostic-test/${id}`,
        method: "GET",
      }),
      transformResponse: (response: DiagnosticTest) => {
        return {
          data: response,
        };
      },
      providesTags: (result, error, id) => [{ type: "DiagnosticTest", id }],
    }),

    // 🔹 Create diagnostic test
    createDiagnosticTest: builder.mutation({
      query: (body) => ({
        url: "/api/setup/diagnostic-test",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticTest"],
    }),

    // 🔹 Update diagnostic test
    updateDiagnosticTest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/setup/diagnostic-test/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DiagnosticTest", id },
        "DiagnosticTest",
      ],
    }),

    getDiagnosticTestsByIds: builder.query<any[], { ids: (number | string)[] }>({
      query: ({ ids }) => ({
        url: "/api/setup/diagnostic-test/by-ids",
        method: "GET",
        params: {
          ids: ids.join(","),
        },
      }),
      providesTags: ["DiagnosticTest"],
    }),



    // 🔹 Toggle active status
    toggleDiagnosticTestActive: builder.mutation({
      query: (id) => ({
        url: `/api/setup/diagnostic-test/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["DiagnosticTest"],
    }),
  }),
});

export const {
  useGetAllDiagnosticTestsQuery,
  useGetDiagnosticTestsByTypeQuery,
  useLazyGetDiagnosticTestsByTypeQuery,
  useLazyGetDiagnosticTestsByNameQuery,
  useGetDiagnosticTestsByNameQuery,
  useGetDiagnosticTestByIdQuery,
  useCreateDiagnosticTestMutation,
  useUpdateDiagnosticTestMutation,
  useToggleDiagnosticTestActiveMutation,
  useGetAllDiagnosticTestsByNameAndTypeQuery,
  useLazyGetDiagnosticTestByIdQuery,
  useGetDiagnosticTestsByIdsQuery,
  useGetAllActiveAppointableDiagnosticTestsQuery
} = diagnosticTestService;
