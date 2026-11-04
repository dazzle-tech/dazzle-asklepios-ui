import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
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

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const analyzerService = createApi({
  reducerPath: 'analyzerApi',
  baseQuery: BaseQuery,
  tagTypes: ['Analyzer'],
  endpoints: builder => ({
    getAnalyzers: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/analyzer',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Analyzer']
    }),

    getAllAnalyzers: builder.query<any[], void>({
      query: () => ({
        url: '/api/setup/analyzer',
        params: { page: 0, size: 1000, sort: 'code,asc' }
      }),
      providesTags: ['Analyzer']
    }),

    getAnalyzersByType: builder.query<PagedResult<any>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/analyzer/by-type/${encodeURIComponent(type)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Analyzer']
    }),

    getAnalyzersByCode: builder.query<PagedResult<any>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/analyzer/by-code/${encodeURIComponent(code)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Analyzer']
    }),

    addAnalyzer: builder.mutation<any, any>({
      query: body => ({
        url: '/api/setup/analyzer',
        method: 'POST',
        body: { ...body }
      }),
      invalidatesTags: ['Analyzer']
    }),

    updateAnalyzer: builder.mutation<any, { id: Id } & any>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/analyzer/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['Analyzer']
    }),

    deleteAnalyzer: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/analyzer/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Analyzer']
    }),

    toggleAnalyzerIsActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/analyzer/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Analyzer']
    }),

    getActiveAnalyzers: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/analyzer/active',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Analyzer']
    })
  })
});

export const {
  useGetAnalyzersQuery,
  useGetAllAnalyzersQuery,
  useLazyGetAnalyzersByTypeQuery,
  useGetAnalyzersByTypeQuery,
  useLazyGetAnalyzersByCodeQuery,
  useAddAnalyzerMutation,
  useUpdateAnalyzerMutation,
  useDeleteAnalyzerMutation,
  useToggleAnalyzerIsActiveMutation,
  useGetActiveAnalyzersQuery,
  useLazyGetActiveAnalyzersQuery
} = analyzerService;
