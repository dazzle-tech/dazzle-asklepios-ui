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

export const ResourceService = createApi({
  reducerPath: "resourceApi",
  baseQuery: BaseQuery,
  tagTypes: ["Resource"],
  endpoints: (builder) => ({
    // 🔹 Get all resources (paginated)
    getAllResources: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/resource",
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

      providesTags: ["Resource"],
    }),

    getResourcesByType: builder.query({
      query: ({ resourceType, ...params }) => ({
        url: `/api/setup/resource/by-type/${resourceType}`,
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
      providesTags: ["Resource"],
    }),

    getResourceById: builder.query({
      query: (id) => ({
        url: `/api/setup/resource/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Resource", id }],
    }),

    createResource: builder.mutation({
      query: (body) => ({
        url: "/api/setup/resource",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Resource"],
    }),

    updateResource: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/setup/resource/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Resource", id },
        "Resource",
      ],
    }),

    toggleResourceActive: builder.mutation({
      query: (id) => ({
        url: `/api/setup/resource/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["Resource"],
    }),
  }),
});

export const {
  useGetAllResourcesQuery,
  useLazyGetResourcesByTypeQuery,
  useGetResourcesByTypeQuery,
  useGetResourceByIdQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useToggleResourceActiveMutation,
} = ResourceService;

