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

export const radiologyService = createApi({
  reducerPath: "newRadiologyApi",
  baseQuery: BaseQuery,
  tagTypes: ["Radiology"],

  endpoints: (builder) => ({
    // 🔹 Get all radiology tests (paginated)
    getAllRadiologies: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/diagnostic-test-radiology",
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
      providesTags: ["Radiology"],
    }),

    // 🔹 Get by ID
    getRadiologyById: builder.query<any, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-radiology/${id}`,
        method: "GET",
      }),
      providesTags: ["Radiology"],
    }),

    // 🔹 Get by testId
    getRadiologyByTestId: builder.query<any, number>({
      query: (testId) => ({
        url: `/api/setup/diagnostic-test-radiology/by-test/${testId}`,
        method: "GET",
      }),
      providesTags: ["Radiology"],
    }),

    // 🔹 Create new radiology record
    createRadiology: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/setup/diagnostic-test-radiology",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Radiology"],
    }),

    // 🔹 Update radiology record
    updateRadiology: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/setup/diagnostic-test-radiology/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Radiology"],
    }),

    // 🔹 Delete radiology record
    deleteRadiology: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/diagnostic-test-radiology/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Radiology"],
    }),
  }),
});

export const {
  useGetAllRadiologiesQuery,
  useGetRadiologyByIdQuery,
  useGetRadiologyByTestIdQuery,
  useCreateRadiologyMutation,
  useUpdateRadiologyMutation,
  useDeleteRadiologyMutation,
} = radiologyService;
