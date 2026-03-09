import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

export const referralRequestService = createApi({
  reducerPath: 'referralRequestApi',
  baseQuery: BaseQuery,
  tagTypes: ['ReferralRequest'],
  endpoints: builder => ({
    createReferralRequest: builder.mutation<
      modelTypes.ReferralRequest,
      modelTypes.ReferralRequest
    >({
      query: data => ({
        url: '/api/patient/referral-request',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ReferralRequest']
    }),

    updateReferralRequest: builder.mutation<
      modelTypes.ReferralRequest,
      { id: Id; data: modelTypes.ReferralRequest }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/referral-request/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'ReferralRequest', id },
        'ReferralRequest'
      ]
    }),

    acceptReferralRequest: builder.mutation<
      modelTypes.ReferralRequest,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/patient/referral-request/${id}/accept`,
        method: 'PUT'
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'ReferralRequest', id },
        'ReferralRequest'
      ]
    }),

    rejectReferralRequest: builder.mutation<
      modelTypes.ReferralRequest,
      { id: Id; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/api/patient/referral-request/${id}/reject`,
        method: 'PUT',
        params: { reason }
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'ReferralRequest', id },
        'ReferralRequest'
      ]
    }),

    getReferralRequestsByEncounter: builder.query<
      modelTypes.ReferralRequest[],
      { encounterId: Id; page?: number; size?: number }
    >({
      query: ({ encounterId, page = 0, size = 10 }) => ({
        url: `/api/patient/referral-request/by-encounter/${encounterId}`,
        params: { page, size }
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'ReferralRequest', id: `encounter-${encounterId}` },
        'ReferralRequest'
      ]
    }),

    getReferralRequestsByToFacilityAndDateRange: builder.query<
      modelTypes.ReferralRequest[],
      { toFacilityId: Id; from: string; to: string; page?: number; size?: number }
    >({
      query: ({ toFacilityId, from, to, page = 0, size = 10 }) => ({
        url: `/api/patient/referral-request/by-to-facility/${toFacilityId}/created-between`,
        params: { from, to, page, size }
      }),
      providesTags: (_res, _err, { toFacilityId }) => [
        { type: 'ReferralRequest', id: `facility-${toFacilityId}` },
        'ReferralRequest'
      ]
    })
  })
});

export const {
  useCreateReferralRequestMutation,
  useUpdateReferralRequestMutation,
  useAcceptReferralRequestMutation,
  useRejectReferralRequestMutation,
  useGetReferralRequestsByEncounterQuery,
  useGetReferralRequestsByToFacilityAndDateRangeQuery,
  useLazyGetReferralRequestsByEncounterQuery,
  useLazyGetReferralRequestsByToFacilityAndDateRangeQuery
} = referralRequestService;