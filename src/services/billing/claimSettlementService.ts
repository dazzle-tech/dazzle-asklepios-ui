import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type { ClaimSettlementRowResponse } from '@/types/model-types-new';

export type { ClaimSettlementRowResponse };

export type ClaimSettlementSearchParams = {
  payerNphiesId?: string | null;
  encounterType?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  page?: number;
  size?: number;
  sort?: string;
};

export type ClaimSettlementPage = {
  content: ClaimSettlementRowResponse[];
  totalElements: number;
};

export const claimSettlementApi = createApi({
  reducerPath: 'claimSettlementApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimSettlements'],

  endpoints: builder => ({
    getClaimSettlements: builder.query<ClaimSettlementPage, ClaimSettlementSearchParams | void>({
      query: params => ({
        url: '/api/patient/billing/claim-settlements',
        method: 'GET',
        params: {
          payerNphiesId: params?.payerNphiesId || undefined,
          encounterType: params?.encounterType || undefined,
          fromDate: params?.fromDate || undefined,
          toDate: params?.toDate || undefined,
          page: params?.page ?? 0,
          size: params?.size ?? 10,
          sort: params?.sort ?? 'id,desc'
        }
      }),
      transformResponse: (response: any): ClaimSettlementPage => {
        if (Array.isArray(response)) {
          return { content: response, totalElements: response.length };
        }

        if (Array.isArray(response?.content)) {
          return {
            content: response.content,
            totalElements: Number(response.totalElements ?? response.content.length)
          };
        }

        if (Array.isArray(response?.data?.content)) {
          return {
            content: response.data.content,
            totalElements: Number(
              response.data.totalElements ?? response.data.content.length
            )
          };
        }

        if (Array.isArray(response?.data)) {
          return {
            content: response.data,
            totalElements: response.data.length
          };
        }

        return { content: [], totalElements: 0 };
      },
      providesTags: ['ClaimSettlements']
    })
  })
});

export const { useGetClaimSettlementsQuery } = claimSettlementApi;
