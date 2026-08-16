import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';
import type { NphiesPayer } from '@/types/model-types-new';

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

export const NphiesPayerService = createApi({
  reducerPath: 'nphiesPayerApi',
  baseQuery: BaseQuery,
  tagTypes: ['NphiesPayer'],
  endpoints: builder => ({
    getAllNphiesPayers: builder.query<PagedResult<NphiesPayer>, PagedParams>({
      query: ({ page, size, sort = 'id,desc' }) => ({
        url: '/api/setup/nphies-payers',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: NphiesPayer[], meta) => {
        const h = meta?.response?.headers;

        return {
          data: res,
          totalCount: Number(h?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(h?.get('Link'))
        };
      },
      providesTags: ['NphiesPayer']
    }),

    getNphiesPayersByNphiesId: builder.query<
      PagedResult<NphiesPayer>,
      { nphiesId: string } & PagedParams
    >({
      query: ({ nphiesId, page, size, sort = 'id,desc' }) => ({
        url: `/api/setup/nphies-payers/by-nphies-id/${nphiesId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: NphiesPayer[], meta) => {
        const h = meta?.response?.headers;

        return {
          data: res,
          totalCount: Number(h?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(h?.get('Link'))
        };
      },
      providesTags: ['NphiesPayer']
    }),

    getNphiesPayersByNameEn: builder.query<
      PagedResult<NphiesPayer>,
      { nameEn: string } & PagedParams
    >({
      query: ({ nameEn, page, size, sort = 'id,desc' }) => ({
        url: `/api/setup/nphies-payers/by-name-en/${nameEn}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: NphiesPayer[], meta) => {
        const h = meta?.response?.headers;

        return {
          data: res,
          totalCount: Number(h?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(h?.get('Link'))
        };
      },
      providesTags: ['NphiesPayer']
    }),

    getNphiesPayersByNameAr: builder.query<
      PagedResult<NphiesPayer>,
      { nameAr: string } & PagedParams
    >({
      query: ({ nameAr, page, size, sort = 'id,desc' }) => ({
        url: `/api/setup/nphies-payers/by-name-ar/${nameAr}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: NphiesPayer[], meta) => {
        const h = meta?.response?.headers;

        return {
          data: res,
          totalCount: Number(h?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(h?.get('Link'))
        };
      },
      providesTags: ['NphiesPayer']
    })
  })
});

export const {
  useGetAllNphiesPayersQuery,
  useLazyGetAllNphiesPayersQuery,

  useGetNphiesPayersByNphiesIdQuery,
  useLazyGetNphiesPayersByNphiesIdQuery,

  useGetNphiesPayersByNameEnQuery,
  useLazyGetNphiesPayersByNameEnQuery,

  useGetNphiesPayersByNameArQuery,
  useLazyGetNphiesPayersByNameArQuery
} = NphiesPayerService;