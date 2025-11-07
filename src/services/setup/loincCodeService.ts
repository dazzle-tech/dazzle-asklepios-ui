import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

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

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
    links: parseLinkHeader(headers?.get("Link")),
  };
};

export const loincCodeService = createApi({
  reducerPath: "loincApi",
  baseQuery: BaseQuery,
  tagTypes: ["LOINC"],

  endpoints: (builder) => ({
    getAllLoinc: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/loinc/all",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
    }),

    getLoincByCategory: builder.query<PagedResult<any>, { category: LioncCategory } & PagedParams>({
      query: ({ category, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/loinc/by-category/${encodeURIComponent(category)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
    }),

    getLoincByCode: builder.query<PagedResult<any>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/loinc/by-code/${encodeURIComponent(code)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
    }),

    getLoincByDescription: builder.query<PagedResult<any>, { description: string } & PagedParams>({
      query: ({ description, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/loinc/by-description/${encodeURIComponent(description)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["LOINC"],
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
  useGetLoincByCategoryQuery,
  useLazyGetLoincByCategoryQuery,
  useGetLoincByCodeQuery,
  useLazyGetLoincByCodeQuery,
  useGetLoincByDescriptionQuery,
  useLazyGetLoincByDescriptionQuery,
  useImportLoincMutation,
} = loincCodeService;
