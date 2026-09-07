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
  tagTypes: ['NphiesPayer', 'TpaDefinition'],
  endpoints: builder => ({
    getAllNphiesPayers: builder.query<PagedResult<NphiesPayer>, PagedParams>({
      query: ({ page, size, sort = 'id,desc' }) => ({
        url: '/api/setup/nphies-payers',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: any, meta) => {
        const h = meta?.response?.headers;
        const data = Array.isArray(res) ? res : res?.data ?? res?.content ?? [];

        return {
          data,
          totalCount: Number(h?.get('X-Total-Count') ?? data.length),
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
    }),

    getNphiesPayerById: builder.query<NphiesPayer, number | string>({
      query: id => ({
        url: `/api/setup/nphies-payers/${id}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'NphiesPayer', id }]
    }),

    getActiveNphiesPayers: builder.query<NphiesPayer[], void>({
      query: () => ({
        url: '/api/setup/nphies-payers/active',
        method: 'GET'
      }),
      transformResponse: (res: any) =>
        Array.isArray(res) ? res : res?.data ?? res?.content ?? [],
      providesTags: ['NphiesPayer']
    }),

    getAvailableTpasForPayer: builder.query<
      Array<{ id: number; tpaCode: string; name: string; isActive: boolean }>,
      number | string
    >({
      query: id => ({
        url: `/api/setup/nphies-payers/${id}/available-tpas`,
        method: 'GET'
      }),
      transformResponse: (res: any) =>
        Array.isArray(res) ? res : res?.data ?? res?.content ?? [],
      providesTags: ['NphiesPayer', 'TpaDefinition']
    }),

    createNphiesPayer: builder.mutation<NphiesPayer, Partial<NphiesPayer>>({
      query: body => ({
        url: '/api/setup/nphies-payers',
        method: 'POST',
        body
      }),
      invalidatesTags: ['NphiesPayer', 'TpaDefinition']
    }),

    updateNphiesPayer: builder.mutation<NphiesPayer, Partial<NphiesPayer>>({
      query: body => ({
        url: '/api/setup/nphies-payers',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['NphiesPayer', 'TpaDefinition']
    }),

    updateNphiesPayerTpas: builder.mutation<NphiesPayer, { id: number | string; tpaIds: number[] }>({
      query: ({ id, tpaIds }) => ({
        url: `/api/setup/nphies-payers/${id}/tpas`,
        method: 'PATCH',
        body: { tpaIds }
      }),
      invalidatesTags: ['NphiesPayer', 'TpaDefinition']
    }),

    toggleNphiesPayerActive: builder.mutation<NphiesPayer, number | string>({
      query: id => ({
        url: `/api/setup/nphies-payers/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['NphiesPayer', 'TpaDefinition']
    })
  })
});

export const {
  useGetAllNphiesPayersQuery,
  useLazyGetAllNphiesPayersQuery,
  useGetActiveNphiesPayersQuery,

  useGetNphiesPayersByNphiesIdQuery,
  useLazyGetNphiesPayersByNphiesIdQuery,

  useGetNphiesPayersByNameEnQuery,
  useLazyGetNphiesPayersByNameEnQuery,

  useGetNphiesPayersByNameArQuery,
  useLazyGetNphiesPayersByNameArQuery,

  useGetNphiesPayerByIdQuery,
  useGetAvailableTpasForPayerQuery,
  useCreateNphiesPayerMutation,
  useUpdateNphiesPayerMutation,
  useUpdateNphiesPayerTpasMutation,
  useToggleNphiesPayerActiveMutation
} = NphiesPayerService;