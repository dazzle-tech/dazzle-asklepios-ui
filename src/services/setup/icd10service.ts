import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from "@/utils/paginationHelper";
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

export const Icd10Service = createApi({
  reducerPath: 'icd10Api',
  baseQuery: BaseQuery,
  tagTypes: ['ICD10'],
  endpoints: (builder) => ({
    getAllIcd10: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = "id,asc" }) => ({
        url: "/api/setup/icd10/all",
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
    }),

    importIcd10: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/api/setup/icd10/import',
          method: 'POST',
          body: formData,
          responseHandler: (response) => response.text(),
        };
      },
      invalidatesTags: ['ICD10'],
    }),

   searchIcd10: builder.query<PagedResult<any>, { keyword: string } &  PagedParams>({
  query: ({ keyword, page, size, sort = "id,asc" }) => ({
    url: `/api/setup/icd10/search/${keyword}`,
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
  providesTags: ['ICD10'],
}),


  }),
});

export const { useGetAllIcd10Query, useImportIcd10Mutation
  ,useSearchIcd10Query
 } = Icd10Service;
