import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const countryService = createApi({
  reducerPath: 'countryApi',
  baseQuery: BaseQuery,
  tagTypes: ['Country'],
  endpoints: builder => ({
    getCountries: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/country',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Country']
    }),

    getCountryByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/country/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Country']
    }),

    getCountryByCode: builder.query<PagedResult<any>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/country/by-code/${encodeURIComponent(code)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['Country']
    }),

    addCountry: builder.mutation<any, any>({
      query: body => ({
        url: '/api/setup/country',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Country']
    }),

    updateCountry: builder.mutation<any, { id: Id } & any>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/country/${id}`,
        method: 'PUT',
        body: { id, ...body } // FIX: include ID in the body
      }),
      invalidatesTags: ['Country']
    }),

    toggleCountryActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/country/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Country']
    })
  })
});

export const {
  useGetCountriesQuery,
  useLazyGetCountriesQuery,
  useGetCountryByNameQuery,
  useLazyGetCountryByNameQuery,
  useGetCountryByCodeQuery,
  useLazyGetCountryByCodeQuery,
  useAddCountryMutation,
  useUpdateCountryMutation,
  useToggleCountryActiveMutation
} = countryService;
