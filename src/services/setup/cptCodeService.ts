import { createApi } from "@reduxjs/toolkit/query/react";
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

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

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;

  return {
    data: response,
    totalCount: Number(headers?.get("X-Total-Count") ?? 0),
    links: parseLinkHeader(headers?.get("Link")),
  };
};

export const cptCodeService = createApi({
  reducerPath: "cptApi",
  baseQuery: BaseQuery,
  tagTypes: ["CPT"],

  endpoints: (builder) => ({

    // ====================== GET ALL ======================

    getAllCpt: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/cpt/all",
        method: "GET",
        params: { page, size, sort },
      }),

      transformResponse: mapPaged,
      providesTags: ["CPT"],
    }),

    // ====================== BY CATEGORY ======================

    getCptByCategory: builder.query<
      PagedResult<any>,
      { category: string } & PagedParams
    >({
      query: ({ category, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/cpt/by-category/${encodeURIComponent(category)}`,
        method: "GET",
        params: { page, size, sort },
      }),

      transformResponse: mapPaged,
      providesTags: ["CPT"],
    }),

    // ====================== BY SERVICE CATEGORY ======================

    getCptByServiceCategory: builder.query<
      PagedResult<any>,
      { serviceCategory: string } & PagedParams
    >({
      query: ({
        serviceCategory,
        page,
        size,
        sort = "id,asc",
      }) => ({
        url: `/api/setup/cpt/by-service-category/${encodeURIComponent(serviceCategory)}`,
        method: "GET",
        params: { page, size, sort },
      }),

      transformResponse: mapPaged,
      providesTags: ["CPT"],
    }),

    // ====================== BY CODE ======================

    getCptByCode: builder.query<
      PagedResult<any>,
      { code: string } & PagedParams
    >({
      query: ({ code, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/cpt/by-code/${encodeURIComponent(code)}`,
        method: "GET",
        params: { page, size, sort },
      }),

      transformResponse: mapPaged,
      providesTags: ["CPT"],
    }),

    // ====================== BY DESCRIPTION ======================

    getCptByDescription: builder.query<
      PagedResult<any>,
      { description: string } & PagedParams
    >({
      query: ({ description, page, size, sort = "id,asc" }) => ({
        url: `/api/setup/cpt/by-description/${encodeURIComponent(description)}`,
        method: "GET",
        params: { page, size, sort },
      }),

      transformResponse: mapPaged,
      providesTags: ["CPT"],
    }),

    // ====================== IMPORT ======================

    importCpt: builder.mutation<
      ImportResult,
      { file: File; overwrite?: boolean }
    >({
      query: ({ file, overwrite = false }) => {

        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/api/setup/cpt/import",
          method: "POST",
          body: formData,
          formData: true,
          params: { overwrite },
          validateStatus: (res) =>
            res.status === 200 || res.status === 409,
        };
      },

      invalidatesTags: ["CPT"],
    }),

  }),
});

export const {
  useGetAllCptQuery,

  useGetCptByCategoryQuery,
  useLazyGetCptByCategoryQuery,

  useGetCptByServiceCategoryQuery,
  useLazyGetCptByServiceCategoryQuery,

  useGetCptByCodeQuery,
  useLazyGetCptByCodeQuery,

  useGetCptByDescriptionQuery,
  useLazyGetCptByDescriptionQuery,

  useImportCptMutation,

} = cptCodeService;