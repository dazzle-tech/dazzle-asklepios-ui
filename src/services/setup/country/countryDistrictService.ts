import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type WithCountry = { countryId: Id };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const countryDistrictService = createApi({
  reducerPath: 'countryDistrictApi',
  baseQuery: BaseQuery,
  tagTypes: ['CountryDistrict'],
  endpoints: (builder) => ({

    getAllDistricts: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/district',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['CountryDistrict'],
    }),

    getDistrictsByCountry: builder.query<PagedResult<any>, WithCountry & PagedParams>({
      query: ({ countryId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/country/${countryId}/district`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['CountryDistrict'],
    }),

    getDistrictsByName: builder.query<PagedResult<any>, WithCountry & { name?: string } & PagedParams>({
      query: ({ countryId, name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/country/${countryId}/district/by-name`,
        params: { page, size, sort, name },
      }),
      transformResponse: mapPaged,
      providesTags: ['CountryDistrict'],
    }),

    getDistrictsByCode: builder.query<PagedResult<any>, WithCountry & { code?: string } & PagedParams>({
      query: ({ countryId, code, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/country/${countryId}/district/by-code`,
        params: { page, size, sort, code },
      }),
      transformResponse: mapPaged,
      providesTags: ['CountryDistrict'],
    }),

    addDistrict: builder.mutation<any, WithCountry & any>({
      query: ({ countryId, ...body }) => ({
        url: `/api/setup/country/${countryId}/district`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CountryDistrict'],
    }),

    updateDistrict: builder.mutation<any, WithCountry & { id: Id } & any>({
      query: ({ countryId, id, ...body }) => ({
        url: `/api/setup/country/${countryId}/district/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CountryDistrict'],
    }),

    toggleDistrictActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/district/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['CountryDistrict'],
    }),

  }),
});

export const {
  // Queries
  useGetAllDistrictsQuery,
  useLazyGetAllDistrictsQuery,
  useGetDistrictsByCountryQuery,
  useLazyGetDistrictsByCountryQuery,
  useGetDistrictsByNameQuery,
  useLazyGetDistrictsByNameQuery,
  useGetDistrictsByCodeQuery,
  useLazyGetDistrictsByCodeQuery,

  // Mutations
  useAddDistrictMutation,
  useUpdateDistrictMutation,
  useToggleDistrictActiveMutation,
} = countryDistrictService;
