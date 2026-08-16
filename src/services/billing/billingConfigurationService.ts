// src/services/billing/billingConfigurationService.ts

import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

import type {
  BillingConfiguration,
  BillingConfigurationKey,
  BillingConfigurationStatus,
  SaveBillingConfigurationRequest
} from '@/types/model-types-new';

export type Id =
  number | string;

export type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

export type FacilityPagedParams =
  PagedParams & {
    facilityId: number;
  };

export type FacilityStatusPagedParams =
  FacilityPagedParams & {
    status:
      BillingConfigurationStatus;
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
  /*
   * Handle Spring Page<T> response.
   */
  if (
    response !== null &&
    !Array.isArray(response) &&
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

  /*
   * Handle array response with pagination headers.
   */
  const headers =
    meta?.response?.headers;

  return {
    data:
      Array.isArray(response)
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

export const billingConfigurationService =
  createApi({
    reducerPath:
      'billingConfigurationService',

    baseQuery:
      BaseQuery,

    tagTypes: [
      'BillingConfiguration'
    ],

    endpoints: builder => ({
      /*
       * ======================================================
       * GET ALL BY FACILITY
       * ======================================================
       */

      getBillingConfigurationsByFacility:
        builder.query<
          PagedResult<BillingConfiguration>,
          FacilityPagedParams
        >({
          query: ({
            facilityId,
            page,
            size,
            sort = 'id,desc'
          }) => ({
            url:
              `/api/setup/billing-configuration/search/by-facility/${encodeURIComponent(
                String(
                  facilityId
                )
              )}`,

            method:
              'GET',

            params: {
              page,
              size,
              sort
            }
          }),

          transformResponse: (
            response:
              | BillingConfiguration[]
              | SpringPageResponse<BillingConfiguration>,
            meta
          ) =>
            mapPagedResponse<BillingConfiguration>(
              response,
              meta
            ),

          providesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * GET ACTIVE BY FACILITY
       * ======================================================
       */

      getActiveBillingConfigurationsByFacility:
        builder.query<
          PagedResult<BillingConfiguration>,
          FacilityPagedParams
        >({
          query: ({
            facilityId,
            page,
            size,
            sort = 'id,desc'
          }) => ({
            url:
              `/api/setup/billing-configuration/search/active/by-facility/${encodeURIComponent(
                String(
                  facilityId
                )
              )}`,

            method:
              'GET',

            params: {
              page,
              size,
              sort
            }
          }),

          transformResponse: (
            response:
              | BillingConfiguration[]
              | SpringPageResponse<BillingConfiguration>,
            meta
          ) =>
            mapPagedResponse<BillingConfiguration>(
              response,
              meta
            ),

          providesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * GET BY FACILITY AND STATUS
       * ======================================================
       */

      getBillingConfigurationsByStatus:
        builder.query<
          PagedResult<BillingConfiguration>,
          FacilityStatusPagedParams
        >({
          query: ({
            facilityId,
            status,
            page,
            size,
            sort = 'id,desc'
          }) => ({
            url:
              `/api/setup/billing-configuration/search/by-facility/${encodeURIComponent(
                String(
                  facilityId
                )
              )}/status/${encodeURIComponent(
                String(
                  status
                )
              )}`,

            method:
              'GET',

            params: {
              page,
              size,
              sort
            }
          }),

          transformResponse: (
            response:
              | BillingConfiguration[]
              | SpringPageResponse<BillingConfiguration>,
            meta
          ) =>
            mapPagedResponse<BillingConfiguration>(
              response,
              meta
            ),

          providesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * GET BY ID
       * ======================================================
       */

      getBillingConfigurationById:
        builder.query<
          BillingConfiguration,
          {
            id: Id;
          }
        >({
          query: ({
            id
          }) => ({
            url:
              `/api/setup/billing-configuration/${encodeURIComponent(
                String(
                  id
                )
              )}`,

            method:
              'GET'
          }),

          providesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * GET BY FACILITY AND KEY
       * ======================================================
       */

      getBillingConfigurationByFacilityAndKey:
        builder.query<
          BillingConfiguration,
          {
            facilityId: Id;

            configurationKey:
              BillingConfigurationKey;
          }
        >({
          query: ({
            facilityId,
            configurationKey
          }) => ({
            url:
              `/api/setup/billing-configuration/search/by-facility/${encodeURIComponent(
                String(
                  facilityId
                )
              )}/key/${encodeURIComponent(
                String(
                  configurationKey
                )
              )}`,

            method:
              'GET'
          }),

          providesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * GET RESOLVED VALUE
       * ======================================================
       */

      getResolvedBillingConfigurationValue:
        builder.query<
          unknown,
          {
            facilityId: Id;

            configurationKey:
              BillingConfigurationKey;
          }
        >({
          query: ({
            facilityId,
            configurationKey
          }) => ({
            url:
              `/api/setup/billing-configuration/search/resolved/by-facility/${encodeURIComponent(
                String(
                  facilityId
                )
              )}/key/${encodeURIComponent(
                String(
                  configurationKey
                )
              )}`,

            method:
              'GET'
          }),

          providesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * CREATE
       * ======================================================
       */

      addBillingConfiguration:
        builder.mutation<
          BillingConfiguration,
          SaveBillingConfigurationRequest
        >({
          query:
            body => ({
              url:
                '/api/setup/billing-configuration',

              method:
                'POST',

              body
            }),

          invalidatesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * UPDATE
       * ======================================================
       */

      updateBillingConfiguration:
        builder.mutation<
          BillingConfiguration,
          {
            id: Id;

            data:
              SaveBillingConfigurationRequest & {
                id: number;
              };
          }
        >({
          query: ({
            id,
            data
          }) => ({
            url:
              `/api/setup/billing-configuration/${encodeURIComponent(
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
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * CHANGE ACTIVATION STATUS
       * ======================================================
       */

      changeBillingConfigurationActivationStatus:
        builder.mutation<
          BillingConfiguration,
          {
            id: Id;
            active: boolean;
          }
        >({
          query: ({
            id,
            active
          }) => ({
            url:
              `/api/setup/billing-configuration/${encodeURIComponent(
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
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * CHANGE STATUS
       * ======================================================
       */

      changeBillingConfigurationStatus:
        builder.mutation<
          BillingConfiguration,
          {
            id: Id;

            status:
              BillingConfigurationStatus;
          }
        >({
          query: ({
            id,
            status
          }) => ({
            url:
              `/api/setup/billing-configuration/${encodeURIComponent(
                String(
                  id
                )
              )}/status/${encodeURIComponent(
                String(
                  status
                )
              )}`,

            method:
              'PUT'
          }),

          invalidatesTags: [
            'BillingConfiguration'
          ]
        }),

      /*
       * ======================================================
       * DELETE
       * ======================================================
       */

      deleteBillingConfiguration:
        builder.mutation<
          void,
          {
            id: Id;
          }
        >({
          query: ({
            id
          }) => ({
            url:
              `/api/setup/billing-configuration/${encodeURIComponent(
                String(
                  id
                )
              )}`,

            method:
              'DELETE'
          }),

          invalidatesTags: [
            'BillingConfiguration'
          ]
        })
    })
  });

export const {
  useGetBillingConfigurationsByFacilityQuery,
  useLazyGetBillingConfigurationsByFacilityQuery,

  useGetActiveBillingConfigurationsByFacilityQuery,
  useLazyGetActiveBillingConfigurationsByFacilityQuery,

  useGetBillingConfigurationsByStatusQuery,
  useLazyGetBillingConfigurationsByStatusQuery,

  useGetBillingConfigurationByIdQuery,
  useLazyGetBillingConfigurationByIdQuery,

  useGetBillingConfigurationByFacilityAndKeyQuery,
  useLazyGetBillingConfigurationByFacilityAndKeyQuery,

  useGetResolvedBillingConfigurationValueQuery,
  useLazyGetResolvedBillingConfigurationValueQuery,

  useAddBillingConfigurationMutation,
  useUpdateBillingConfigurationMutation,

  useChangeBillingConfigurationActivationStatusMutation,
  useChangeBillingConfigurationStatusMutation,

  useDeleteBillingConfigurationMutation
} =
  billingConfigurationService;