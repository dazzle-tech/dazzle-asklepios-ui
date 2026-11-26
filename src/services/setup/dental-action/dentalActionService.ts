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

export const dentalActionService = createApi({
  reducerPath: "dentalActionApi",
  baseQuery: BaseQuery,
  tagTypes: ["DentalAction"],
  endpoints: (builder) => ({
    // 🔹 Get all DentalActions (paginated)
    // Optional filters are ANDed by the backend; empty ones are left out
    getAllDentalActions: builder.query<
      PagedResult<any>,
      PagedParams & { isActive?: boolean; type?: string; description?: string }
    >({
      query: ({ page, size, sort = "id,asc", isActive, type, description }) => ({
        url: "/api/setup/dental-actions",
        method: "GET",
        params: {
          page,
          size,
          sort,
          isActive,
          type: type || undefined,
          description: description?.trim() || undefined,
        },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DentalAction"],
    }),

    // 🔹 Get DentalActions by Type (paginated)
    getDentalActionsByType: builder.query<PagedResult<any>, { type: string; page: number; size: number }>({
      query: ({ type, page, size }) => ({
        url: `/api/setup/dental-actions/by-type/${type}`,
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
      providesTags: ["DentalAction"],
    }),

    // 🔹 Get DentalActions by Description (paginated)
    getDentalActionsByDescription: builder.query<PagedResult<any>, { description: string; page: number; size: number }>({
      query: ({ description, page, size }) => ({
        url: `/api/setup/dental-actions/by-description/${description}`,
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
      providesTags: ["DentalAction"],
    }),

    // 🔹 Get DentalAction by ID
    getDentalActionById: builder.query<any, number>({
      query: (id) => ({
        url: `/api/setup/dental-actions/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "DentalAction", id }],
    }),

    // 🔹 Create new DentalAction
    createDentalAction: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/setup/dental-actions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DentalAction"],
    }),

    // 🔹 Update existing DentalAction
    updateDentalAction: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/setup/dental-actions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "DentalAction", id },
        "DentalAction",
      ],
    }),

    // 🔹 Delete DentalAction
    deleteDentalAction: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/setup/dental-actions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DentalAction"],
    }),

    toggleDiagnosticTestActive: builder.mutation({
      query: (id) => ({
        url: `/api/setup/dental-actions/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: ["DentalAction"],
    }),
  }),
});

export const {
  useGetAllDentalActionsQuery,
  useGetDentalActionByIdQuery,
  useGetDentalActionsByTypeQuery,
  useGetDentalActionsByDescriptionQuery,
  useCreateDentalActionMutation,
  useUpdateDentalActionMutation,
  useDeleteDentalActionMutation,
  useToggleDiagnosticTestActiveMutation
} = dentalActionService;
