// src/services/setup/priceListAttributesService.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from '@/utils/paginationHelper';
import { PriceListAttribute } from '@/types/model-types-new';
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

const mapPaged = <T>(response: T[], meta): PagedResult<T> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};




export const priceListAttributesService = createApi({
  reducerPath: 'priceListAttributesApi',
  baseQuery: BaseQuery,
  tagTypes: ['PriceListAttributes'],
  endpoints: (builder) => ({
    // ---------- LISTS ----------
    getPriceListAttributes: builder.query<PagedResult<PriceListAttribute>, PagedParams>({
      query: (params) => ({
        url: '/api/setup/price-list-attributes',
        params,
      }),
      transformResponse: (response: PriceListAttribute[], meta) =>
        mapPaged<PriceListAttribute>(response, meta),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data
                .filter((item): item is PriceListAttribute & { id: Id } => item.id != null)
                .map((item) => ({
                  type: 'PriceListAttributes' as const,
                  id: item.id as Id,
                })),
              { type: 'PriceListAttributes', id: 'LIST' },
            ]
          : [{ type: 'PriceListAttributes', id: 'LIST' }],
    }),

    getActivePriceListAttributes: builder.query<PagedResult<PriceListAttribute>, PagedParams>({
      query: (params) => ({
        url: '/api/setup/price-list-attributes/active',
        params,
      }),
      transformResponse: (response: PriceListAttribute[], meta) =>
        mapPaged<PriceListAttribute>(response, meta),
      providesTags: [{ type: 'PriceListAttributes', id: 'LIST' }],
    }),

    getPriceListAttributesByPriceList: builder.query<
      PagedResult<PriceListAttribute>,
      { priceListId: Id } & PagedParams
    >({
      query: ({ priceListId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/price-list-attributes/by-price-list/${encodeURIComponent(
          String(priceListId)
        )}`,
        params: { page, size, sort, timestamp },
      }),
      transformResponse: (response: PriceListAttribute[], meta) =>
        mapPaged<PriceListAttribute>(response, meta),
      providesTags: [{ type: 'PriceListAttributes', id: 'LIST' }],
    }),

    getActivePriceListAttributesByPriceList: builder.query<
      PagedResult<PriceListAttribute>,
      { priceListId: Id } & PagedParams
    >({
      query: ({ priceListId, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/price-list-attributes/by-price-list/${encodeURIComponent(
          String(priceListId)
        )}/active`,
        params: { page, size, sort, timestamp },
      }),
      transformResponse: (response: PriceListAttribute[], meta) =>
        mapPaged<PriceListAttribute>(response, meta),
      providesTags: [{ type: 'PriceListAttributes', id: 'LIST' }],
    }),

    // ---------- SINGLE ----------
    getPriceListAttributeById: builder.query<PriceListAttribute, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/price-list-attributes/${id}`,
      }),
      transformResponse: (response: PriceListAttribute) => response,
      providesTags: (_result, _error, { id }) => [
        { type: 'PriceListAttributes', id: id as Id },
      ],
    }),

    // ---------- CRUD ----------
    createPriceListAttribute: builder.mutation<PriceListAttribute, PriceListAttribute>({
      query: (attribute) => ({
        url: '/api/setup/price-list-attributes',
        method: 'POST',
        body: attribute,
      }),
      invalidatesTags: [{ type: 'PriceListAttributes', id: 'LIST' }],
    }),

    updatePriceListAttribute: builder.mutation<PriceListAttribute, PriceListAttribute>({
      query: (attribute) => ({
        url: '/api/setup/price-list-attributes',
        method: 'PUT',
        body: attribute,
      }),
      invalidatesTags: (_result, _error, attribute) => [
        { type: 'PriceListAttributes', id: attribute.id as Id },
        { type: 'PriceListAttributes', id: 'LIST' },
      ],
    }),

    deletePriceListAttribute: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/price-list-attributes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PriceListAttributes', id: id as Id },
        { type: 'PriceListAttributes', id: 'LIST' },
      ],
    }),

    togglePriceListAttributeActive: builder.mutation<PriceListAttribute, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/price-list-attributes/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PriceListAttributes', id: id as Id },
        { type: 'PriceListAttributes', id: 'LIST' },
      ],
    }),

  

  }),
});

export const {
  useGetPriceListAttributesQuery,
  useGetActivePriceListAttributesQuery,
  useGetPriceListAttributesByPriceListQuery,
  useGetActivePriceListAttributesByPriceListQuery,
  useGetPriceListAttributeByIdQuery,
  useCreatePriceListAttributeMutation,
  useUpdatePriceListAttributeMutation,
  useDeletePriceListAttributeMutation,
  useTogglePriceListAttributeActiveMutation,

} = priceListAttributesService;
