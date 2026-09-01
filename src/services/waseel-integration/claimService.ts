import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type {
  ClaimBatchSubmitResponse,
  ClaimSubmissionResponse,
  ClaimTrackingResponse,
  PendingClaimInvoiceResponse,
  WaseelClaimUploadResponse
} from '@/types/model-types-new';

export type { ClaimTrackingResponse, ClaimSubmissionResponse, WaseelClaimUploadResponse, PendingClaimInvoiceResponse, ClaimBatchSubmitResponse };

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
): PagedResult<ClaimTrackingResponse> => {
  const headers = meta?.response?.headers;

  const rows: ClaimTrackingResponse[] = Array.isArray(response)
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

export const claimApi = createApi({
  reducerPath: 'claimApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimTracking'],

  endpoints: builder => ({
    getClaimTracking: builder.query<PagedResult<ClaimTrackingResponse>, PagedParams>({
      query: ({ page, size, sort = 'id,desc' }) => ({
        url: '/api/patient/internal/waseel/claims/tracking',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['ClaimTracking']
    }),

    getClaimTrackingById: builder.query<ClaimTrackingResponse, number>({
      query: id => ({
        url: `/api/patient/internal/waseel/claims/tracking/${id}`,
        method: 'GET'
      }),
      providesTags: (_res, _err, id) => [{ type: 'ClaimTracking', id }]
    }),

    getClaimByInvoice: builder.query<ClaimTrackingResponse | null, number>({
      query: financialDocumentId => ({
        url: `/api/patient/internal/waseel/invoices/${financialDocumentId}/claim`,
        method: 'GET'
      }),
      providesTags: (_res, _err, financialDocumentId) => [
        { type: 'ClaimTracking', id: `invoice-${financialDocumentId}` }
      ]
    }),

    getClaimsByEncounter: builder.query<ClaimSubmissionResponse[], number>({
      query: encounterId => ({
        url: `/api/patient/internal/waseel/encounters/${encounterId}/claims`,
        method: 'GET'
      }),
      providesTags: ['ClaimTracking']
    }),

    submitClaimForInvoice: builder.mutation<
      ClaimSubmissionResponse,
      {
        financialDocumentId: number;
        claimType?: string | null;
        claimSubType?: string | null;
      }
    >({
      query: ({ financialDocumentId, claimType, claimSubType }) => ({
        url: `/api/patient/internal/waseel/invoices/${financialDocumentId}/claims/submit`,
        method: 'POST',
        params: {
          ...(claimType ? { claimType } : {}),
          ...(claimSubType ? { claimSubType } : {})
        }
      }),
      invalidatesTags: (_res, _err, { financialDocumentId }) => [
        'ClaimTracking',
        { type: 'ClaimTracking', id: `invoice-${financialDocumentId}` }
      ],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    getClaimUploadSummary: builder.query<WaseelClaimUploadResponse, number>({
      query: uploadId => ({
        url: `/api/patient/internal/waseel/claims/uploads/${uploadId}`,
        method: 'GET'
      })
    }),

    refreshClaimUploadSummary: builder.mutation<WaseelClaimUploadResponse, number>({
      query: uploadId => ({
        url: `/api/patient/internal/waseel/claims/uploads/${uploadId}`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    refreshClaimStatus: builder.mutation<ClaimTrackingResponse, number>({
      query: id => ({
        url: `/api/patient/internal/waseel/claims/tracking/${id}/refresh`,
        method: 'POST'
      }),
      invalidatesTags: (_res, _err, id) => [
        'ClaimTracking',
        { type: 'ClaimTracking', id }
      ],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    }),

    getPendingClaimInvoices: builder.query<
      PendingClaimInvoiceResponse[],
      {
        payorId?: number | null;
        payerNphiesId?: string | null;
        fromDate?: string | null;
        toDate?: string | null;
        claimType?: string | null;
        claimSubType?: string | null;
      }
    >({
      query: ({ payorId, payerNphiesId, fromDate, toDate, claimType, claimSubType }) => ({
        url: '/api/patient/internal/waseel/claims/pending-invoices',
        method: 'GET',
        params: {
          ...(payorId != null ? { payorId } : {}),
          ...(payerNphiesId ? { payerNphiesId } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
          ...(claimType ? { claimType } : {}),
          ...(claimSubType ? { claimSubType } : {})
        }
      }),
      providesTags: ['ClaimTracking']
    }),

    submitClaimBatch: builder.mutation<
      ClaimBatchSubmitResponse,
      {
        financialDocumentIds: number[];
        claimType: string;
        claimSubType: string;
      }
    >({
      query: body => ({
        url: '/api/patient/internal/waseel/claims/submit-batch',
        method: 'POST',
        body
      }),
      invalidatesTags: ['ClaimTracking'],
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      }
    })
  })
});

export const {
  useGetClaimTrackingQuery,
  useGetClaimTrackingByIdQuery,
  useLazyGetClaimTrackingByIdQuery,
  useGetClaimByInvoiceQuery,
  useGetClaimsByEncounterQuery,
  useSubmitClaimForInvoiceMutation,
  useLazyGetClaimUploadSummaryQuery,
  useRefreshClaimUploadSummaryMutation,
  useRefreshClaimStatusMutation,
  useGetPendingClaimInvoicesQuery,
  useSubmitClaimBatchMutation
} = claimApi;
