import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

import type {
  BillingItemType,
  BillingRule,
  SaveBillingRuleRequest
} from '@/types/model-types-new';

export type Id = number | string;

export type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
  billingItemType?: BillingItemType | '';
  name?: string;
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

const mapPagedResponse = <T>(
  response: T[] | SpringPageResponse<T>,
  meta?: any
): PagedResult<T> => {
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

  const headers = meta?.response?.headers;

  return {
    data: Array.isArray(response) ? response : [],
    totalCount: Number(
      headers?.get('X-Total-Count') ?? 0
    ),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const billingRuleSetupService = createApi({
  reducerPath: 'billingRuleSetupService',

  baseQuery: BaseQuery,

  tagTypes: ['BillingRule'],

  endpoints: builder => ({
    getBillingRules: builder.query<
      PagedResult<BillingRule>,
      PagedParams
    >({
      query: ({
        page,
        size,
        sort = 'id,desc',
        billingItemType,
        name
      }) => {
        const trimmedName = name?.trim();

        if (trimmedName) {
          return {
            url: `/api/setup/billing-rule/by-name/${encodeURIComponent(
              trimmedName
            )}`,
            params: {
              page,
              size,
              sort,
              ...(billingItemType
                ? { billingItemType }
                : {})
            }
          };
        }

        if (billingItemType) {
          return {
            url: `/api/setup/billing-rule/search/by-item-type/${encodeURIComponent(
              billingItemType
            )}`,
            params: {
              page,
              size,
              sort
            }
          };
        }

        return {
          url: '/api/setup/billing-rule',
          params: {
            page,
            size,
            sort
          }
        };
      },

      transformResponse: (
        response:
          | BillingRule[]
          | SpringPageResponse<BillingRule>,
        meta
      ) =>
        mapPagedResponse<BillingRule>(
          response,
          meta
        ),

      providesTags: result =>
        result
          ? [
              ...result.data
                .filter(item => item.id !== undefined)
                .map(item => ({
                  type: 'BillingRule' as const,
                  id: item.id!
                })),
              {
                type: 'BillingRule' as const,
                id: 'LIST'
              }
            ]
          : [
              {
                type: 'BillingRule' as const,
                id: 'LIST'
              }
            ]
    }),

    getBillingRuleById: builder.query<
      BillingRule,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/setup/billing-rule/${encodeURIComponent(
          String(id)
        )}`
      }),

      providesTags: (
        _result,
        _error,
        { id }
      ) => [
        {
          type: 'BillingRule',
          id
        }
      ]
    }),

    addBillingRule: builder.mutation<
      BillingRule,
      SaveBillingRuleRequest
    >({
      query: body => ({
        url: '/api/setup/billing-rule',
        method: 'POST',
        body: {
          ...body,
          id: null
        }
      }),

      invalidatesTags: [
        {
          type: 'BillingRule',
          id: 'LIST'
        }
      ]
    }),

    updateBillingRule: builder.mutation<
      BillingRule,
      {
        id: Id;
        data: SaveBillingRuleRequest;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/setup/billing-rule/${encodeURIComponent(
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
          type: 'BillingRule',
          id
        },
        {
          type: 'BillingRule',
          id: 'LIST'
        }
      ]
    }),

    setBillingRuleDefault: builder.mutation<
      BillingRule,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/setup/billing-rule/${encodeURIComponent(
          String(id)
        )}/set-default`,
        method: 'PUT'
      }),

      invalidatesTags: [
        {
          type: 'BillingRule',
          id: 'LIST'
        }
      ]
    }),

    deleteBillingRule: builder.mutation<
      void,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/setup/billing-rule/${encodeURIComponent(
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
          type: 'BillingRule',
          id
        },
        {
          type: 'BillingRule',
          id: 'LIST'
        }
      ]
    })
  })
});

export const {
  useGetBillingRulesQuery,
  useLazyGetBillingRulesQuery,
  useGetBillingRuleByIdQuery,
  useAddBillingRuleMutation,
  useUpdateBillingRuleMutation,
  useSetBillingRuleDefaultMutation,
  useDeleteBillingRuleMutation
} = billingRuleSetupService;
