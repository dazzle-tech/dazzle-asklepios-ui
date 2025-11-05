import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

// ---- CDT-specific types ----
export type CdtConflict = {
  code: string;
  incomingDescription: string;
  incomingClass: string;
  incomingIsActive: boolean;
  existingDescription: string;
  existingClass: string;
  existingIsActive: boolean;
};

export type CdtImportResult = {
  totalRows: number;
  inserted: number;
  updated?: number;
  conflicts: CdtConflict[];
};

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
    links: parseLinkHeader(headers?.get("Link")),
  };
};

export const cdtCodeService = createApi({
  reducerPath: "cdtApi",
  baseQuery: BaseQuery,
  tagTypes: ["CDT"],

  endpoints: (builder) => ({
    // GET /api/setup/cdt/all
    getAllCdt: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/cdt/all",
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["CDT"],
    }),

    // GET /api/setup/cdt/by-class/{cdtClass}
    getCdtByClass: builder.query<PagedResult<any>, { cdtClass: string } & PagedParams>({
      query: ({ cdtClass, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/cdt/by-class/${encodeURIComponent(cdtClass)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["CDT"],
    }),

    // GET /api/setup/cdt/by-active/{active}
    getCdtByActive: builder.query<PagedResult<any>, { active: boolean } & PagedParams>({
      query: ({ active, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/cdt/by-active/${encodeURIComponent(String(active))}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["CDT"],
    }),

    // GET /api/setup/cdt/by-code/{code}
    getCdtByCode: builder.query<PagedResult<any>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/cdt/by-code/${encodeURIComponent(code)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["CDT"],
    }),

    // GET /api/setup/cdt/by-description/{description}
    getCdtByDescription: builder.query<PagedResult<any>, { description: string } & PagedParams>({
      query: ({ description, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/cdt/by-description/${encodeURIComponent(description)}`,
        method: "GET",
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ["CDT"],
    }),

    // POST /api/setup/cdt/import
    importCdt: builder.mutation<CdtImportResult, { file: File; overwrite?: boolean }>({
      query: ({ file, overwrite = false }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/api/setup/cdt/import",
          method: "POST",
          body: formData,
          formData: true,
          params: { overwrite },
          // back end returns 200 OK or 409 CONFLICT (with conflicts list)
          validateStatus: (res) => res.status === 200 || res.status === 409,
        };
      },
      invalidatesTags: ["CDT"],
    }),
  }),
});

export const {
  useGetAllCdtQuery,
  useGetCdtByClassQuery,
  useLazyGetCdtByClassQuery,
  useGetCdtByActiveQuery,
  useLazyGetCdtByActiveQuery,
  useGetCdtByCodeQuery,
  useLazyGetCdtByCodeQuery,
  useGetCdtByDescriptionQuery,
  useLazyGetCdtByDescriptionQuery,
  useImportCdtMutation,
} = cdtCodeService;
