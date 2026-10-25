import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

import type {
  PriceListItemType,
  PriceListSetup,
  PriceListSetupItem
} from '@/types/model-types-new';

export type Id = number | string;

export type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

export type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

export type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;

  page?: number;
  size?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
};

type SpringPageResponse<T> = {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
};

export type SavePriceListSetupRequest = Omit<
  PriceListSetup,
  'id' | 'facilityName' | 'payerName' | 'status' | 'isActive'
>;

export type SavePriceListSetupItemRequest = Omit<
  PriceListSetupItem,
  'id' | 'priceListSetupId'
>;

const mapPagedResponse = <T>(
  response: T[] | SpringPageResponse<T>,
  meta?: any
): PagedResult<T> => {
  /*
   * Handle a Spring Page<T> response.
   */
  if (
    response !== null &&
    !Array.isArray(response) &&
    Array.isArray(response.content)
  ) {
    return {
      data: response.content,
      totalCount: Number(response.totalElements ?? 0),
      totalPages: Number(response.totalPages ?? 0),
      page: Number(response.number ?? 0),
      size: Number(response.size ?? response.content.length),
      first: Boolean(response.first),
      last: Boolean(response.last)
    };
  }

  /*
   * Handle an array response that uses pagination headers.
   */
  const headers = meta?.response?.headers;

  return {
    data: Array.isArray(response) ? response : [],
    totalCount: Number(
      headers?.get('X-Total-Count') ?? 0
    ),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const priceListSetupService = createApi({
  reducerPath: 'priceListSetupService',

  baseQuery: BaseQuery,

  tagTypes: [
    'PriceListSetup',
    'PriceListSetupItem'
  ],

  endpoints: builder => ({
    /*
     * ======================================================
     * PRICE-LIST SETUP HEADER
     * ======================================================
     */

    getPriceListSetups: builder.query<
      PagedResult<PriceListSetup>,
      PagedParams
    >({
      query: ({
        page,
        size,
        sort = 'id,asc'
      }) => ({
        url: '/api/setup/price-list-setups',
        params: {
          page,
          size,
          sort
        }
      }),

      transformResponse: (
        response:
          | PriceListSetup[]
          | SpringPageResponse<PriceListSetup>,
        meta
      ) =>
        mapPagedResponse<PriceListSetup>(
          response,
          meta
        ),

      providesTags: result =>
        result
          ? [
              ...result.data
                .filter(item => item.id !== undefined)
                .map(item => ({
                  type: 'PriceListSetup' as const,
                  id: item.id!
                })),
              {
                type: 'PriceListSetup' as const,
                id: 'LIST'
              }
            ]
          : [
              {
                type: 'PriceListSetup' as const,
                id: 'LIST'
              }
            ]
    }),

    getPriceListSetupsByFacility: builder.query<
      PagedResult<PriceListSetup>,
      { facilityId: Id } & PagedParams
    >({
      query: ({ facilityId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-facility/${encodeURIComponent(String(facilityId))}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByName: builder.query<
      PagedResult<PriceListSetup>,
      { name: string } & PagedParams
    >({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByType: builder.query<
      PagedResult<PriceListSetup>,
      { type: string } & PagedParams
    >({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-type/${encodeURIComponent(type)}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByPayer: builder.query<
      PagedResult<PriceListSetup>,
      { payerId: Id } & PagedParams
    >({
      query: ({ payerId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-payer/${encodeURIComponent(String(payerId))}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByVersion: builder.query<
      PagedResult<PriceListSetup>,
      { versionNumber: Id } & PagedParams
    >({
      query: ({ versionNumber, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-version/${encodeURIComponent(String(versionNumber))}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByEffectiveFrom: builder.query<
      PagedResult<PriceListSetup>,
      { effectiveFrom: string } & PagedParams
    >({
      query: ({ effectiveFrom, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-effective-from/${encodeURIComponent(effectiveFrom)}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByEffectiveTo: builder.query<
      PagedResult<PriceListSetup>,
      { effectiveTo: string } & PagedParams
    >({
      query: ({ effectiveTo, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-effective-to/${encodeURIComponent(effectiveTo)}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByCurrency: builder.query<
      PagedResult<PriceListSetup>,
      { currency: string } & PagedParams
    >({
      query: ({ currency, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-currency/${encodeURIComponent(currency)}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByStatus: builder.query<
      PagedResult<PriceListSetup>,
      { status: string } & PagedParams
    >({
      query: ({ status, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/price-list-setups/by-status/${encodeURIComponent(status)}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: PriceListSetup[], meta) =>
        mapPagedResponse<PriceListSetup>(response, meta),
      providesTags: [{ type: 'PriceListSetup' as const, id: 'LIST' }]
    }),

    getPriceListSetupsByLoggedInFacility: builder.query<
      PagedResult<PriceListSetup>,
      PagedParams
    >({
      query: ({
        page,
        size,
        sort = 'id,asc'
      }) => ({
        url: '/api/setup/price-list-setups/by-loggedIn-facility',
        params: {
          page,
          size,
          sort
        }
      }),

      transformResponse: (
        response:
          | PriceListSetup[]
          | SpringPageResponse<PriceListSetup>,
        meta
      ) =>
        mapPagedResponse<PriceListSetup>(
          response,
          meta
        ),

      providesTags: result =>
        result
          ? [
              ...result.data
                .filter(item => item.id !== undefined)
                .map(item => ({
                  type: 'PriceListSetup' as const,
                  id: item.id!
                })),
              {
                type: 'PriceListSetup' as const,
                id: 'LIST'
              }
            ]
          : [
              {
                type: 'PriceListSetup' as const,
                id: 'LIST'
              }
            ]
    }),

    getPriceListSetupById: builder.query<
      PriceListSetup,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(id)
        )}`
      }),

      providesTags: (
        _result,
        _error,
        { id }
      ) => [
        {
          type: 'PriceListSetup',
          id
        }
      ]
    }),

    addPriceListSetup: builder.mutation<
      PriceListSetup,
      SavePriceListSetupRequest
    >({
      query: body => ({
        url: '/api/setup/price-list-setups',
        method: 'POST',
        body
      }),

      invalidatesTags: [
        {
          type: 'PriceListSetup',
          id: 'LIST'
        }
      ]
    }),

    updatePriceListSetup: builder.mutation<
      PriceListSetup,
      {
        id: Id;
        data: SavePriceListSetupRequest;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(id)
        )}`,
        method: 'PUT',
        body: data
      }),

      invalidatesTags: (
        _result,
        _error,
        { id }
      ) => [
        {
          type: 'PriceListSetup',
          id
        },
        {
          type: 'PriceListSetup',
          id: 'LIST'
        }
      ]
    }),

    activatePriceListSetup: builder.mutation<
      PriceListSetup,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(id)
        )}/activate`,
        method: 'PUT'
      }),

      invalidatesTags: (
        _result,
        _error,
        { id }
      ) => [
        {
          type: 'PriceListSetup',
          id
        },
        {
          type: 'PriceListSetup',
          id: 'LIST'
        }
      ]
    }),

    deletePriceListSetup: builder.mutation<
      void,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(id)
        )}`,
        method: 'DELETE'
      }),

      invalidatesTags: (
        _result,
        _error,
        { id }
      ) => [
        {
          type: 'PriceListSetup',
          id
        },
        {
          type: 'PriceListSetup',
          id: 'LIST'
        },
        {
          type: 'PriceListSetupItem',
          id: `LIST-${id}`
        }
      ]
    }),

    /*
     * ======================================================
     * PRICE-LIST SETUP ITEMS
     * ======================================================
     */

    getPriceListSetupItems: builder.query<
      PagedResult<PriceListSetupItem>,
      {
        priceListSetupId: Id;
        search?: string;
        itemType?: PriceListItemType;
      } & PagedParams
    >({
      query: ({
        priceListSetupId,
        page,
        size,
        sort = 'id,asc',
        search,
        itemType
      }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(priceListSetupId)
        )}/items`,
        params: {
          page,
          size,
          sort,
          ...(search ? { search } : {}),
          ...(itemType ? { itemType } : {})
        }
      }),

      transformResponse: (
        response:
          | PriceListSetupItem[]
          | SpringPageResponse<PriceListSetupItem>,
        meta
      ) =>
        mapPagedResponse<PriceListSetupItem>(
          response,
          meta
        ),

      providesTags: (
        result,
        _error,
        { priceListSetupId }
      ) =>
        result
          ? [
              ...result.data
                .filter(item => item.id !== undefined)
                .map(item => ({
                  type: 'PriceListSetupItem' as const,
                  id: item.id!
                })),
              {
                type: 'PriceListSetupItem' as const,
                id: `LIST-${priceListSetupId}`
              }
            ]
          : [
              {
                type: 'PriceListSetupItem' as const,
                id: `LIST-${priceListSetupId}`
              }
            ]
    }),

    getPriceListSetupItemById: builder.query<
      PriceListSetupItem,
      {
        priceListSetupId: Id;
        itemId: Id;
      }
    >({
      query: ({
        priceListSetupId,
        itemId
      }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(priceListSetupId)
        )}/items/${encodeURIComponent(
          String(itemId)
        )}`
      }),

      providesTags: (
        _result,
        _error,
        { itemId }
      ) => [
        {
          type: 'PriceListSetupItem',
          id: itemId
        }
      ]
    }),

    addPriceListSetupItem: builder.mutation<
      PriceListSetupItem,
      {
        priceListSetupId: Id;
        data: SavePriceListSetupItemRequest;
      }
    >({
      query: ({
        priceListSetupId,
        data
      }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(priceListSetupId)
        )}/items`,
        method: 'POST',
        body: data
      }),

      invalidatesTags: (
        _result,
        _error,
        { priceListSetupId }
      ) => [
        {
          type: 'PriceListSetupItem',
          id: `LIST-${priceListSetupId}`
        },
        {
          type: 'PriceListSetup',
          id: priceListSetupId
        }
      ]
    }),

    updatePriceListSetupItem: builder.mutation<
      PriceListSetupItem,
      {
        priceListSetupId: Id;
        itemId: Id;
        data: SavePriceListSetupItemRequest;
      }
    >({
      query: ({
        priceListSetupId,
        itemId,
        data
      }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(priceListSetupId)
        )}/items/${encodeURIComponent(
          String(itemId)
        )}`,
        method: 'PUT',
        body: data
      }),

      invalidatesTags: (
        _result,
        _error,
        {
          priceListSetupId,
          itemId
        }
      ) => [
        {
          type: 'PriceListSetupItem',
          id: itemId
        },
        {
          type: 'PriceListSetupItem',
          id: `LIST-${priceListSetupId}`
        }
      ]
    }),

    deletePriceListSetupItem: builder.mutation<
      void,
      {
        priceListSetupId: Id;
        itemId: Id;
      }
    >({
      query: ({
        priceListSetupId,
        itemId
      }) => ({
        url: `/api/setup/price-list-setups/${encodeURIComponent(
          String(priceListSetupId)
        )}/items/${encodeURIComponent(
          String(itemId)
        )}`,
        method: 'DELETE'
      }),

      invalidatesTags: (
        _result,
        _error,
        {
          priceListSetupId,
          itemId
        }
      ) => [
        {
          type: 'PriceListSetupItem',
          id: itemId
        },
        {
          type: 'PriceListSetupItem',
          id: `LIST-${priceListSetupId}`
        },
        {
          type: 'PriceListSetup',
          id: priceListSetupId
        }
      ]
    })
  })
});

export const {
  useGetPriceListSetupsQuery,
  useLazyGetPriceListSetupsQuery,
  useLazyGetPriceListSetupsByFacilityQuery,
  useLazyGetPriceListSetupsByNameQuery,
  useLazyGetPriceListSetupsByTypeQuery,
  useLazyGetPriceListSetupsByPayerQuery,
  useLazyGetPriceListSetupsByVersionQuery,
  useLazyGetPriceListSetupsByEffectiveFromQuery,
  useLazyGetPriceListSetupsByEffectiveToQuery,
  useLazyGetPriceListSetupsByCurrencyQuery,
  useLazyGetPriceListSetupsByStatusQuery,
  useGetPriceListSetupsByLoggedInFacilityQuery,
  useLazyGetPriceListSetupsByLoggedInFacilityQuery,

  useGetPriceListSetupByIdQuery,
  useLazyGetPriceListSetupByIdQuery,

  useAddPriceListSetupMutation,
  useUpdatePriceListSetupMutation,
  useActivatePriceListSetupMutation,
  useDeletePriceListSetupMutation,

  useGetPriceListSetupItemsQuery,
  useLazyGetPriceListSetupItemsQuery,

  useGetPriceListSetupItemByIdQuery,
  useLazyGetPriceListSetupItemByIdQuery,

  useAddPriceListSetupItemMutation,
  useUpdatePriceListSetupItemMutation,
  useDeletePriceListSetupItemMutation
} = priceListSetupService;