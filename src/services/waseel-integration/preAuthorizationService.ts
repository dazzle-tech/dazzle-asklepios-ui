import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type {
  EligibilityCheckResponse,
  PreAuthorizationCancelRequest,
  PreAuthorizationCommunicationRequest,
  PreAuthorizationTrackingResponse
} from '@/types/model-types-new';

export type { PreAuthorizationTrackingResponse };

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: ReturnType<typeof parseLinkHeader>;
};

const mapPaged = (
  response: any,
  meta: { response?: { headers?: Headers } }
): PagedResult<PreAuthorizationTrackingResponse> => {
  const headers = meta?.response?.headers;

  const rows: PreAuthorizationTrackingResponse[] = Array.isArray(response)
    ? response
    : response?.content ?? [];

  const totalCount =
    Number(headers?.get('X-Total-Count')) ||
    Number(response?.totalElements) ||
    rows.length;

  return {
    data: rows,
    totalCount,
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const preAuthorizationApi = createApi({
  reducerPath: 'preAuthorizationApi',
  baseQuery: BaseQuery,
  tagTypes: ['PreAuthorizationTracking'],

  endpoints: builder => ({
    getPreAuthorizationTracking: builder.query<
      PagedResult<PreAuthorizationTrackingResponse>,
      PagedParams
    >({
      query: ({ page, size, sort = 'id,desc' }) => ({
        url: '/api/patient/internal/waseel/pre-authorizations/tracking',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['PreAuthorizationTracking']
    }),

    getPreAuthorizationTrackingById: builder.query<
      PreAuthorizationTrackingResponse,
      number
    >({
      query: id => ({
        url: `/api/patient/internal/waseel/pre-authorizations/tracking/${id}`,
        method: 'GET'
      }),
      providesTags: (_res, _err, id) => [
        { type: 'PreAuthorizationTracking', id }
      ]
    }),

    searchPreAuthorization: builder.mutation<
      unknown,
      { preAuthorizationId: number; requestId: number }
    >({
      query: ({ preAuthorizationId, requestId }) => ({
        url: '/api/patient/internal/waseel/pre-authorizations/search',
        method: 'GET',
        params: { preAuthorizationId, requestId }
      }),
      invalidatesTags: ['PreAuthorizationTracking'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    communicatePreAuthorization: builder.mutation<
      unknown,
      PreAuthorizationCommunicationRequest
    >({
      query: body => ({
        url: '/api/patient/internal/waseel/pre-authorizations/communication',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PreAuthorizationTracking'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    cancelPreAuthorization: builder.mutation<
      unknown,
      PreAuthorizationCancelRequest
    >({
      query: body => ({
        url: '/api/patient/internal/waseel/pre-authorizations/cancel',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PreAuthorizationTracking'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    checkEncounterEligibility: builder.mutation<
      EligibilityCheckResponse,
      { encounterId: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/internal/waseel/encounters/${encounterId}/eligibility`,
        method: 'POST'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    })
  })
});

export const {
  useGetPreAuthorizationTrackingQuery,
  useGetPreAuthorizationTrackingByIdQuery,
  useSearchPreAuthorizationMutation,
  useCommunicatePreAuthorizationMutation,
  useCancelPreAuthorizationMutation,
  useCheckEncounterEligibilityMutation
} = preAuthorizationApi;