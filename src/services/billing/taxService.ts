import {
  createApi
} from '@reduxjs/toolkit/query/react';

import {
  BaseQuery
} from '../../newApi';

import {
  parseLinkHeader
} from '@/utils/paginationHelper';

import type {
  Tax,
  TaxCalculationType,
  TaxType,
  SaveTaxRequest
} from '@/types/model-types-new';

export type TaxId =
  number | string;

export type TaxPagedParams = {
  facilityId: number;
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

export type TaxTextFilterParams =
  TaxPagedParams & {
    value: string;
  };

export type TaxTypeFilterParams =
  TaxPagedParams & {
    taxType:
      TaxType;
  };

export type TaxCalculationTypeFilterParams =
  TaxPagedParams & {
    calculationType:
      TaxCalculationType;
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

const mapPagedResponse = <T,>(
  response:
    | T[]
    | SpringPageResponse<T>,
  meta?: any
): PagedResult<T> => {
  if (
    response !== null &&
    !Array.isArray(
      response
    ) &&
    Array.isArray(
      response.content
    )
  ) {
    return {
      data:
        response.content,

      totalCount:
        Number(
          response.totalElements ??
            0
        ),

      totalPages:
        Number(
          response.totalPages ??
            0
        ),

      page:
        Number(
          response.number ??
            0
        ),

      size:
        Number(
          response.size ??
            response.content.length
        ),

      first:
        Boolean(
          response.first
        ),

      last:
        Boolean(
          response.last
        )
    };
  }

  const headers =
    meta?.response?.headers;

  return {
    data:
      Array.isArray(
        response
      )
        ? response
        : [],

    totalCount:
      Number(
        headers?.get(
          'X-Total-Count'
        ) ?? 0
      ),

    links:
      parseLinkHeader(
        headers?.get(
          'Link'
        )
      )
  };
};

export const taxService =
  createApi({
    reducerPath:
      'taxService',

    baseQuery:
      BaseQuery,

    tagTypes: [
      'Tax'
    ],

    endpoints:
      builder => ({
        getTaxesByFacility:
          builder.query<
            PagedResult<Tax>,
            TaxPagedParams
          >({
            query: ({
              facilityId,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                '/api/setup/tax',

              method:
                'GET',

              params: {
                facilityId,
                page,
                size,
                sort
              }
            }),

            transformResponse: (
              response:
                | Tax[]
                | SpringPageResponse<Tax>,
              meta
            ) =>
              mapPagedResponse<Tax>(
                response,
                meta
              ),

            providesTags: [
              'Tax'
            ]
          }),

        getActiveTaxesByFacility:
          builder.query<
            PagedResult<Tax>,
            TaxPagedParams
          >({
            query: ({
              facilityId,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                '/api/setup/tax/active',

              method:
                'GET',

              params: {
                facilityId,
                page,
                size,
                sort
              }
            }),

            transformResponse: (
              response:
                | Tax[]
                | SpringPageResponse<Tax>,
              meta
            ) =>
              mapPagedResponse<Tax>(
                response,
                meta
              ),

            providesTags: [
              'Tax'
            ]
          }),

        getTaxById:
          builder.query<
            Tax,
            {
              id: TaxId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/tax/${encodeURIComponent(
                  String(
                    id
                  )
                )}`,

              method:
                'GET'
            }),

            providesTags: [
              'Tax'
            ]
          }),

        getDefaultTax:
          builder.query<
            Tax,
            {
              facilityId:
                TaxId;
            }
          >({
            query: ({
              facilityId
            }) => ({
              url:
                `/api/setup/tax/default/${encodeURIComponent(
                  String(
                    facilityId
                  )
                )}`,

              method:
                'GET'
            }),

            providesTags: [
              'Tax'
            ]
          }),

        getTaxesByCode:
          builder.query<
            PagedResult<Tax>,
            TaxTextFilterParams
          >({
            query: ({
              facilityId,
              value,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/tax/by-code/${encodeURIComponent(
                  value
                )}`,

              method:
                'GET',

              params: {
                facilityId,
                page,
                size,
                sort
              }
            }),

            transformResponse: (
              response:
                | Tax[]
                | SpringPageResponse<Tax>,
              meta
            ) =>
              mapPagedResponse<Tax>(
                response,
                meta
              ),

            providesTags: [
              'Tax'
            ]
          }),

        getTaxesByName:
          builder.query<
            PagedResult<Tax>,
            TaxTextFilterParams
          >({
            query: ({
              facilityId,
              value,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/tax/by-name-en/${encodeURIComponent(
                  value
                )}`,

              method:
                'GET',

              params: {
                facilityId,
                page,
                size,
                sort
              }
            }),

            transformResponse: (
              response:
                | Tax[]
                | SpringPageResponse<Tax>,
              meta
            ) =>
              mapPagedResponse<Tax>(
                response,
                meta
              ),

            providesTags: [
              'Tax'
            ]
          }),

        getTaxesByTaxType:
          builder.query<
            PagedResult<Tax>,
            TaxTypeFilterParams
          >({
            query: ({
              facilityId,
              taxType,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/tax/by-type/${encodeURIComponent(
                  String(
                    taxType
                  )
                )}`,

              method:
                'GET',

              params: {
                facilityId,
                page,
                size,
                sort
              }
            }),

            transformResponse: (
              response:
                | Tax[]
                | SpringPageResponse<Tax>,
              meta
            ) =>
              mapPagedResponse<Tax>(
                response,
                meta
              ),

            providesTags: [
              'Tax'
            ]
          }),

        getTaxesByCalculationType:
          builder.query<
            PagedResult<Tax>,
            TaxCalculationTypeFilterParams
          >({
            query: ({
              facilityId,
              calculationType,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/tax/by-calculation-type/${encodeURIComponent(
                  String(
                    calculationType
                  )
                )}`,

              method:
                'GET',

              params: {
                facilityId,
                page,
                size,
                sort
              }
            }),

            transformResponse: (
              response:
                | Tax[]
                | SpringPageResponse<Tax>,
              meta
            ) =>
              mapPagedResponse<Tax>(
                response,
                meta
              ),

            providesTags: [
              'Tax'
            ]
          }),

        getEffectiveTaxes:
          builder.query<
            Tax[],
            {
              facilityId:
                TaxId;

              date?: string;
            }
          >({
            query: ({
              facilityId,
              date
            }) => ({
              url:
                `/api/setup/tax/effective/${encodeURIComponent(
                  String(
                    facilityId
                  )
                )}`,

              method:
                'GET',

              params:
                date
                  ? {
                      date
                    }
                  : undefined
            }),

            providesTags: [
              'Tax'
            ]
          }),

        addTax:
          builder.mutation<
            Tax,
            SaveTaxRequest
          >({
            query:
              body => ({
                url:
                  '/api/setup/tax',

                method:
                  'POST',

                body
              }),

            invalidatesTags: [
              'Tax'
            ]
          }),

        updateTax:
          builder.mutation<
            Tax,
            {
              id:
                TaxId;

              data:
                SaveTaxRequest & {
                  id: number;
                };
            }
          >({
            query: ({
              id,
              data
            }) => ({
              url:
                `/api/setup/tax/${encodeURIComponent(
                  String(
                    id
                  )
                )}`,

              method:
                'PUT',

              body:
                data
            }),

            invalidatesTags: [
              'Tax'
            ]
          }),

        toggleTaxActive:
          builder.mutation<
            Tax,
            {
              id:
                TaxId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/tax/${encodeURIComponent(
                  String(
                    id
                  )
                )}/toggle-active`,

              method:
                'PATCH'
            }),

            invalidatesTags: [
              'Tax'
            ]
          }),

        changeTaxActivationStatus:
          builder.mutation<
            Tax,
            {
              id:
                TaxId;

              active:
                boolean;
            }
          >({
            query: ({
              id,
              active
            }) => ({
              url:
                `/api/setup/tax/${encodeURIComponent(
                  String(
                    id
                  )
                )}/activation-status/${encodeURIComponent(
                  String(
                    active
                  )
                )}`,

              method:
                'PUT'
            }),

            invalidatesTags: [
              'Tax'
            ]
          }),

        setDefaultTax:
          builder.mutation<
            Tax,
            {
              id:
                TaxId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/tax/${encodeURIComponent(
                  String(
                    id
                  )
                )}/set-default`,

              method:
                'PATCH'
            }),

            invalidatesTags: [
              'Tax'
            ]
          }),

        deleteTax:
          builder.mutation<
            void,
            {
              id:
                TaxId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/tax/${encodeURIComponent(
                  String(
                    id
                  )
                )}`,

              method:
                'DELETE'
            }),

            invalidatesTags: [
              'Tax'
            ]
          })
      })
  });

export const {
  useGetTaxesByFacilityQuery,
  useLazyGetTaxesByFacilityQuery,

  useGetActiveTaxesByFacilityQuery,
  useLazyGetActiveTaxesByFacilityQuery,

  useGetTaxByIdQuery,
  useLazyGetTaxByIdQuery,

  useGetDefaultTaxQuery,
  useLazyGetDefaultTaxQuery,

  useGetTaxesByCodeQuery,
  useLazyGetTaxesByCodeQuery,

  useGetTaxesByNameQuery,
  useLazyGetTaxesByNameQuery,

  useGetTaxesByTaxTypeQuery,
  useLazyGetTaxesByTaxTypeQuery,

  useGetTaxesByCalculationTypeQuery,
  useLazyGetTaxesByCalculationTypeQuery,

  useGetEffectiveTaxesQuery,
  useLazyGetEffectiveTaxesQuery,

  useAddTaxMutation,
  useUpdateTaxMutation,

  useToggleTaxActiveMutation,
  useChangeTaxActivationStatusMutation,
  useSetDefaultTaxMutation,

  useDeleteTaxMutation
} =
  taxService;