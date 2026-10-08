import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import {
  ClaimEncounterCopyDiagnosticOrderTestResult,
  ClaimEncounterCopyDiagnosticOrderTestResultCreateDTO,
  ClaimEncounterCopyDiagnosticOrderTestResultUpdateDTO
} from '@/types/model-types-new';

export interface ClaimEncounterCopyDiagnosticOrderTestResultCancelDTO {
  cancellationReason: string;
}

export const claimEncounterCopyDiagnosticOrderTestResultService = createApi({
  reducerPath: 'claimEncounterCopyDiagnosticOrderTestResultApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyDiagnosticOrderTestResult'],
  endpoints: builder => ({
    getClaimEncounterCopyDiagnosticOrderTestResults: builder.query<
      ClaimEncounterCopyDiagnosticOrderTestResult[],
      {
        claimEncounterCopyId: number;
        showCancelled?: boolean;
      }
    >({
      query: ({
        claimEncounterCopyId,
        showCancelled = false
      }) => ({
        url: showCancelled
          ? `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-results/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-results/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopyDiagnosticOrderTestResult']
    }),

    createClaimEncounterCopyDiagnosticOrderTestResult: builder.mutation<
      ClaimEncounterCopyDiagnosticOrderTestResult,
      {
        claimEncounterCopyId: number;
        data: ClaimEncounterCopyDiagnosticOrderTestResultCreateDTO;
      }
    >({
      query: ({ claimEncounterCopyId, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-results/by-copy/${claimEncounterCopyId}`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyDiagnosticOrderTestResult']
    }),

    updateClaimEncounterCopyDiagnosticOrderTestResult: builder.mutation<
      ClaimEncounterCopyDiagnosticOrderTestResult,
      {
        id: number;
        data: ClaimEncounterCopyDiagnosticOrderTestResultUpdateDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-results/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyDiagnosticOrderTestResult']
    }),

    cancelClaimEncounterCopyDiagnosticOrderTestResult: builder.mutation<
      ClaimEncounterCopyDiagnosticOrderTestResult,
      {
        id: number;
        data: ClaimEncounterCopyDiagnosticOrderTestResultCancelDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-results/${id}/cancel`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyDiagnosticOrderTestResult']
    })
  })
});

export const {
  useGetClaimEncounterCopyDiagnosticOrderTestResultsQuery,
  useCreateClaimEncounterCopyDiagnosticOrderTestResultMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestResultMutation,
  useCancelClaimEncounterCopyDiagnosticOrderTestResultMutation
} = claimEncounterCopyDiagnosticOrderTestResultService;
