import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
export type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

export type LoincCode = {
  id: number;
  code: string;
  category?: string;
  description: string;
  lastUpdated?: string;
};

export type Conflict = {
  code: string;
  incomingDescription: string;
  incomingCategory: string;  
  existingDescription: string;
  existingCategory: string;  
};

export type ImportResult = {
  totalRows: number;
  inserted: number;
  updated?: number;
  conflicts: Conflict[];
};

export type LioncCategory = "BOTH" | "ORDER" | "OBSERVATION";

const mapPaged = (response: LoincCode[], meta: any): PagedResult<LoincCode> => {
  const headers = meta?.response?.headers;
  return {
    data: response ?? [],
    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
    links: parseLinkHeader(headers?.get("Link")),
  };
};

export const loincCodeService = createApi({
  reducerPath: "loincApi",
  baseQuery: BaseQuery,
  tagTypes: ["LOINC"],

  endpoints: (builder) => ({
    getAllLoinc: builder.query<PagedResult<LoincCode>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/loinc/all",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
    }),

    getLoincById: builder.query<LoincCode, { id: number; timestamp?: number }>({
      query: ({ id }) => ({
        url: `/api/setup/loinc/${id}`,
        method: "GET",
      }),
      providesTags: ["LOINC"],
    }),

    getLoincByCategory: builder.query<PagedResult<LoincCode>, { category: LioncCategory } & PagedParams>({
      query: ({ category, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/loinc/by-category/${encodeURIComponent(category)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
    }),

    getLoincByCode: builder.query<PagedResult<LoincCode>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/loinc/by-code/${encodeURIComponent(code)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
    }),

    getLoincByDescription: builder.query<PagedResult<LoincCode>, { description: string } & PagedParams>({
      query: ({ description, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/loinc/by-description/${encodeURIComponent(description)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
    }),

    createLoinc: builder.mutation<LoincCode, { code: string; category: LioncCategory; description: string }>({
      query: (body) => ({
        url: "/api/setup/loinc",
        method: "POST",
            body,
      }),
      invalidatesTags: ["LOINC"],
    }),

    updateLoinc: builder.mutation<LoincCode, { id: number; code: string; category: LioncCategory; description: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/loinc/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["LOINC"],
    }),

    importLoinc: builder.mutation<ImportResult, { file: File; overwrite?: boolean }>({
      query: ({ file, overwrite = false }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/api/setup/loinc/import",
          method: "POST",
          body: formData,
          formData: true,
          params: { overwrite },
          validateStatus: (res) => res.status === 200 || res.status === 409,
        };
      },
      invalidatesTags: ["LOINC"],
    }),
  }),
});

export const {
  useGetAllLoincQuery,
  useGetLoincByIdQuery,
  useLazyGetLoincByIdQuery,
  useGetLoincByCategoryQuery,
  useLazyGetLoincByCategoryQuery,
  useGetLoincByCodeQuery,
  useLazyGetLoincByCodeQuery,
  useGetLoincByDescriptionQuery,
  useLazyGetLoincByDescriptionQuery,
  useCreateLoincMutation,
  useUpdateLoincMutation,
  useImportLoincMutation,
} = loincCodeService;
