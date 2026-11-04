import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import {
  ClaimEncounterCopyDiagnosticOrderTestResult,
  ClaimEncounterCopyDiagnosticOrderTestResultCreateDTO,
  ClaimEncounterCopyDiagnosticOrderTestResultUpdateDTO
} from '@/types/model-types-new';


export const claimEncounterCopyDiagnosticOrderTestResultService = createApi({
  reducerPath: 'claimEncounterCopyDiagnosticOrderTestResultApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyDiagnosticOrderTestResult'],
  endpoints: builder => ({
    getClaimEncounterCopyDiagnosticOrderTestResults: builder.query<
      ClaimEncounterCopyDiagnosticOrderTestResult[],
      {
        claimEncounterCopyId: number;      }
    >({
      query: ({
        claimEncounterCopyId,
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-results/by-copy/${claimEncounterCopyId}/all`,
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
  })
});

export const {
  useGetClaimEncounterCopyDiagnosticOrderTestResultsQuery,
  useCreateClaimEncounterCopyDiagnosticOrderTestResultMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestResultMutation,
} = claimEncounterCopyDiagnosticOrderTestResultService;
