import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type {
  EligibilityCheckResponse,
  EncounterPreAuthorizationRefreshResponse,
  PreAuthorizationCancelRequest,
  PreAuthorizationCommunicationHistoryResponse,
  PreAuthorizationCommunicationRequest,
  PreAuthorizationTrackingResponse
} from '@/types/model-types-new';

export type { PreAuthorizationTrackingResponse, PreAuthorizationCommunicationHistoryResponse };

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
  tagTypes: ['PreAuthorizationTracking', 'EncounterPreAuthorization'],

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

    getPreAuthorizationCommunications: builder.query<
      PreAuthorizationCommunicationHistoryResponse[],
      number
    >({
      query: preAuthorizationId => ({
        url: `/api/patient/internal/waseel/pre-authorizations/${preAuthorizationId}/communications`,
        method: 'GET'
      }),
      providesTags: (_res, _err, id) => [
        { type: 'PreAuthorizationTracking', id: `communications-${id}` }
      ]
    }),

    searchPreAuthorization: builder.mutation<
      unknown,
      { preAuthorizationId?: number; requestId: number }
    >({
      query: ({ preAuthorizationId, requestId }) => ({
        url: '/api/patient/internal/waseel/pre-authorizations/search',
        method: 'GET',
        params: {
          ...(preAuthorizationId != null ? { preAuthorizationId } : {}),
          requestId
        }
      }),
      invalidatesTags: ['PreAuthorizationTracking'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    uploadPreAuthorizationAttachment: builder.mutation<
      {
        id: number;
        filename?: string;
        mimeType?: string;
        sizeBytes?: number;
        downloadUrl?: string;
      },
      {
        preAuthorizationId: number;
        file: File;
        type?: string;
        details?: string;
        source?: string;
        sourceId?: number;
      }
    >({
      query: ({ preAuthorizationId, file, type, details, source, sourceId }) => {
        const formData = new FormData();
        formData.append('file', file);

        const params: Record<string, string | number> = {};
        if (type?.trim()) params.type = type.trim();
        if (details?.trim()) params.details = details.trim();
        if (source?.trim()) params.source = source.trim();
        if (sourceId != null) params.sourceId = sourceId;

        return {
          url: `/api/patient/internal/waseel/pre-authorizations/${preAuthorizationId}/attachments`,
          method: 'POST',
          params,
          body: formData
        };
      },
      invalidatesTags: ['PreAuthorizationTracking'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    downloadPreAuthorizationAttachment: builder.mutation<
      Blob,
      { id: number; mimeType?: string | null }
    >({
      query: ({ id }) => ({
        url: `/api/patient/internal/waseel/pre-authorizations/attachments/${id}/file`,
        method: 'GET',
        responseHandler: (response: Response) => response.blob()
      })
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
    }),

    refreshEncounterPreAuthorization: builder.mutation<
      EncounterPreAuthorizationRefreshResponse,
      { encounterId: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/internal/waseel/encounters/${encounterId}/pre-authorization/refresh`,
        method: 'POST'
      }),
      invalidatesTags: ['PreAuthorizationTracking', 'EncounterPreAuthorization'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    refreshEncounterPreAuthorizationLocal: builder.mutation<
      EncounterPreAuthorizationRefreshResponse,
      { encounterId: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/internal/waseel/encounters/${encounterId}/pre-authorization/refresh-local`,
        method: 'POST'
      }),
      invalidatesTags: ['PreAuthorizationTracking', 'EncounterPreAuthorization'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    payRejectedPreAuthorizationItemAsCash: builder.mutation<
      unknown,
      { encounterId: number; patientServiceProductId: number }
    >({
      query: ({ encounterId, patientServiceProductId }) => ({
        url: `/api/patient/internal/waseel/encounters/${encounterId}/pre-authorization/items/${patientServiceProductId}/pay-as-cash`,
        method: 'POST'
      }),
      invalidatesTags: ['EncounterPreAuthorization'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    cloneRejectedPreAuthorizationItem: builder.mutation<
      void,
      { encounterId: number; patientServiceProductId: number }
    >({
      query: ({ encounterId, patientServiceProductId }) => ({
        url: `/api/patient/internal/waseel/encounters/${encounterId}/pre-authorization/items/${patientServiceProductId}/clone`,
        method: 'POST'
      }),
      invalidatesTags: ['PreAuthorizationTracking', 'EncounterPreAuthorization'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    })
  })
});

export const {
  useGetPreAuthorizationTrackingQuery,
  useGetPreAuthorizationTrackingByIdQuery,
  useGetPreAuthorizationCommunicationsQuery,
  useLazyGetPreAuthorizationCommunicationsQuery,
  useSearchPreAuthorizationMutation,
  useUploadPreAuthorizationAttachmentMutation,
  useDownloadPreAuthorizationAttachmentMutation,
  useCommunicatePreAuthorizationMutation,
  useCancelPreAuthorizationMutation,
  useCheckEncounterEligibilityMutation,
  useRefreshEncounterPreAuthorizationMutation,
  useRefreshEncounterPreAuthorizationLocalMutation,
  usePayRejectedPreAuthorizationItemAsCashMutation,
  useCloneRejectedPreAuthorizationItemMutation
} = preAuthorizationApi;