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
  Discount,
  DiscountApplicableOn,
  DiscountType,
  SaveDiscountRequest
} from '@/types/model-types-new';

export type DiscountId =
  number | string;

export type DiscountPagedParams = {
  facilityId: number;

  page: number;

  size: number;

  sort?: string;

  timestamp?: number;
};

export type DiscountTextFilterParams =
  DiscountPagedParams & {
    value: string;
  };

export type DiscountTypeFilterParams =
  DiscountPagedParams & {
    discountType:
      DiscountType;
  };

export type DiscountApplicableOnFilterParams =
  DiscountPagedParams & {
    applicableOn:
      DiscountApplicableOn;
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

export const discountService =
  createApi({
    reducerPath:
      'discountService',

    baseQuery:
      BaseQuery,

    tagTypes: [
      'Discount'
    ],

    endpoints:
      builder => ({
        getDiscountsByFacility:
          builder.query<
            PagedResult<Discount>,
            DiscountPagedParams
          >({
            query: ({
              facilityId,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                '/api/setup/discount',

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
                | Discount[]
                | SpringPageResponse<Discount>,
              meta
            ) =>
              mapPagedResponse<Discount>(
                response,
                meta
              ),

            providesTags: [
              'Discount'
            ]
          }),

        getActiveDiscountsByFacility:
          builder.query<
            PagedResult<Discount>,
            DiscountPagedParams
          >({
            query: ({
              facilityId,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                '/api/setup/discount/active',

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
                | Discount[]
                | SpringPageResponse<Discount>,
              meta
            ) =>
              mapPagedResponse<Discount>(
                response,
                meta
              ),

            providesTags: [
              'Discount'
            ]
          }),

        getDiscountById:
          builder.query<
            Discount,
            {
              id:
                DiscountId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/discount/${encodeURIComponent(
                  String(
                    id
                  )
                )}`,

              method:
                'GET'
            }),

            providesTags: [
              'Discount'
            ]
          }),

        getDefaultDiscount:
          builder.query<
            Discount,
            {
              facilityId:
                DiscountId;
            }
          >({
            query: ({
              facilityId
            }) => ({
              url:
                `/api/setup/discount/default/${encodeURIComponent(
                  String(
                    facilityId
                  )
                )}`,

              method:
                'GET'
            }),

            providesTags: [
              'Discount'
            ]
          }),

        getDiscountByFacilityAndCode:
          builder.query<
            Discount,
            {
              facilityId:
                DiscountId;

              code:
                string;
            }
          >({
            query: ({
              facilityId,
              code
            }) => ({
              url:
                `/api/setup/discount/by-facility/${encodeURIComponent(
                  String(
                    facilityId
                  )
                )}/code/${encodeURIComponent(
                  code
                )}`,

              method:
                'GET'
            }),

            providesTags: [
              'Discount'
            ]
          }),

        getDiscountsByCode:
          builder.query<
            PagedResult<Discount>,
            DiscountTextFilterParams
          >({
            query: ({
              facilityId,
              value,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/discount/by-code/${encodeURIComponent(
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
                | Discount[]
                | SpringPageResponse<Discount>,
              meta
            ) =>
              mapPagedResponse<Discount>(
                response,
                meta
              ),

            providesTags: [
              'Discount'
            ]
          }),

        getDiscountsByName:
          builder.query<
            PagedResult<Discount>,
            DiscountTextFilterParams
          >({
            query: ({
              facilityId,
              value,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/discount/by-name/${encodeURIComponent(
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
                | Discount[]
                | SpringPageResponse<Discount>,
              meta
            ) =>
              mapPagedResponse<Discount>(
                response,
                meta
              ),

            providesTags: [
              'Discount'
            ]
          }),

        getDiscountsByType:
          builder.query<
            PagedResult<Discount>,
            DiscountTypeFilterParams
          >({
            query: ({
              facilityId,
              discountType,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/discount/by-type/${encodeURIComponent(
                  String(
                    discountType
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
                | Discount[]
                | SpringPageResponse<Discount>,
              meta
            ) =>
              mapPagedResponse<Discount>(
                response,
                meta
              ),

            providesTags: [
              'Discount'
            ]
          }),

        getDiscountsByApplicableOn:
          builder.query<
            PagedResult<Discount>,
            DiscountApplicableOnFilterParams
          >({
            query: ({
              facilityId,
              applicableOn,
              page,
              size,
              sort = 'id,desc'
            }) => ({
              url:
                `/api/setup/discount/by-applicable-on/${encodeURIComponent(
                  String(
                    applicableOn
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
                | Discount[]
                | SpringPageResponse<Discount>,
              meta
            ) =>
              mapPagedResponse<Discount>(
                response,
                meta
              ),

            providesTags: [
              'Discount'
            ]
          }),

        getEffectiveDiscounts:
          builder.query<
            Discount[],
            {
              facilityId:
                DiscountId;

              date?: string;
            }
          >({
            query: ({
              facilityId,
              date
            }) => ({
              url:
                `/api/setup/discount/effective/${encodeURIComponent(
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
              'Discount'
            ]
          }),

        addDiscount:
          builder.mutation<
            Discount,
            SaveDiscountRequest
          >({
            query:
              body => ({
                url:
                  '/api/setup/discount',

                method:
                  'POST',

                body
              }),

            invalidatesTags: [
              'Discount'
            ]
          }),

        updateDiscount:
          builder.mutation<
            Discount,
            {
              id:
                DiscountId;

              data:
                SaveDiscountRequest & {
                  id: number;
                };
            }
          >({
            query: ({
              id,
              data
            }) => ({
              url:
                `/api/setup/discount/${encodeURIComponent(
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
              'Discount'
            ]
          }),

        toggleDiscountActive:
          builder.mutation<
            Discount,
            {
              id:
                DiscountId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/discount/${encodeURIComponent(
                  String(
                    id
                  )
                )}/toggle-active`,

              method:
                'PATCH'
            }),

            invalidatesTags: [
              'Discount'
            ]
          }),

        changeDiscountActivationStatus:
          builder.mutation<
            Discount,
            {
              id:
                DiscountId;

              active:
                boolean;
            }
          >({
            query: ({
              id,
              active
            }) => ({
              url:
                `/api/setup/discount/${encodeURIComponent(
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
              'Discount'
            ]
          }),

        setDefaultDiscount:
          builder.mutation<
            Discount,
            {
              id:
                DiscountId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/discount/${encodeURIComponent(
                  String(
                    id
                  )
                )}/set-default`,

              method:
                'PATCH'
            }),

            invalidatesTags: [
              'Discount'
            ]
          }),

        deleteDiscount:
          builder.mutation<
            void,
            {
              id:
                DiscountId;
            }
          >({
            query: ({
              id
            }) => ({
              url:
                `/api/setup/discount/${encodeURIComponent(
                  String(
                    id
                  )
                )}`,

              method:
                'DELETE'
            }),

            invalidatesTags: [
              'Discount'
            ]
          })
      })
  });

export const {
  useGetDiscountsByFacilityQuery,
  useLazyGetDiscountsByFacilityQuery,

  useGetActiveDiscountsByFacilityQuery,
  useLazyGetActiveDiscountsByFacilityQuery,

  useGetDiscountByIdQuery,
  useLazyGetDiscountByIdQuery,

  useGetDefaultDiscountQuery,
  useLazyGetDefaultDiscountQuery,

  useGetDiscountByFacilityAndCodeQuery,
  useLazyGetDiscountByFacilityAndCodeQuery,

  useGetDiscountsByCodeQuery,
  useLazyGetDiscountsByCodeQuery,

  useGetDiscountsByNameQuery,
  useLazyGetDiscountsByNameQuery,

  useGetDiscountsByTypeQuery,
  useLazyGetDiscountsByTypeQuery,

  useGetDiscountsByApplicableOnQuery,
  useLazyGetDiscountsByApplicableOnQuery,

  useGetEffectiveDiscountsQuery,
  useLazyGetEffectiveDiscountsQuery,

  useAddDiscountMutation,
  useUpdateDiscountMutation,

  useToggleDiscountActiveMutation,
  useChangeDiscountActivationStatusMutation,
  useSetDefaultDiscountMutation,

  useDeleteDiscountMutation
} =
  discountService;