// src/services/setup/catalogDiagnosticTestService.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { CatalogAddTestsVM, CatalogDiagnosticTest } from '@/types/model-types-new';

export type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
export type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
export type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };


export const catalogDiagnosticTestService = createApi({
  reducerPath: 'newCatalogDiagnosticTestApi',
  baseQuery: BaseQuery,
  tagTypes: ['CatalogTests'],
  endpoints: (builder) => ({
    /** LIST all links (admin) — GET /api/setup/catalog-diagnostic-test?page=&size=&sort= */
    getAllCatalogDiagnosticTests: builder.query<PagedResult<CatalogDiagnosticTest>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/catalog-diagnostic-test',
        params: { page, size, sort },
      }),
      transformResponse: (response: CatalogDiagnosticTest[], meta): PagedResult<CatalogDiagnosticTest> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['CatalogTests'],
    }),

    /** LIST by catalog — GET /api/setup/catalog/{catalogId}/tests?page=&size=&sort= */
    getCatalogTests: builder.query<
      PagedResult<CatalogDiagnosticTest>,
      { catalogId: number | string } & PagedParams
    >({
      query: ({ catalogId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/catalog/${catalogId}/tests`,
        params: { page, size, sort },
      }),
      transformResponse: (response: CatalogDiagnosticTest[], meta): PagedResult<CatalogDiagnosticTest> => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: (_res, _err, args) => ['CatalogTests'],
    }),

    /** BULK ADD — POST /api/setup/catalog/{catalogId}/tests  (body: { testIds: number[] }) */
    addTestsToCatalog: builder.mutation<void, { catalogId: number | string; body: CatalogAddTestsVM }>({
      query: ({ catalogId, body }) => ({
        url: `/api/setup/catalog/${catalogId}/tests`,
        method: 'POST',
        body: {
          catalogId: [catalogId],
          testIds: body
        },
      }),
      // Invalidate list-by-catalog so the modal refreshes
      invalidatesTags: ['CatalogTests'],
    }),

    /** DELETE by composite — DELETE /api/setup/catalog/{catalogId}/tests/{testId} */
    removeTestFromCatalog: builder.mutation<void, { catalogId: number | string; testId: number | string }>({
      query: ({ catalogId, testId }) => ({
        url: `/api/setup/catalog/${catalogId}/tests/${testId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CatalogTests'],
    }),

    /** DELETE by link id — DELETE /api/setup/catalog-diagnostic-test/{id}
     *  */
    deleteCatalogDiagnosticLink: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/api/setup/catalog-diagnostic-test/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CatalogTests'],
    }),
  }),
});

export const {
  useGetAllCatalogDiagnosticTestsQuery,
  useGetCatalogTestsQuery,
  useLazyGetCatalogTestsQuery,
  useAddTestsToCatalogMutation,
  useRemoveTestFromCatalogMutation,
  useDeleteCatalogDiagnosticLinkMutation,
} = catalogDiagnosticTestService;
