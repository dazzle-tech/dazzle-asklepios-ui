import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import {
  ClaimEncounterCopyDiagnosticOrderTestReport,
  ClaimEncounterCopyDiagnosticOrderTestReportCreateDTO,
  ClaimEncounterCopyDiagnosticOrderTestReportUpdateDTO
} from '@/types/model-types-new';

export interface ClaimEncounterCopyDiagnosticOrderTestReportCancelDTO {
  cancellationReason: string;
}

export const claimEncounterCopyDiagnosticOrderTestReportService = createApi({
  reducerPath: 'claimEncounterCopyDiagnosticOrderTestReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyDiagnosticOrderTestReport'],
  endpoints: builder => ({
    getClaimEncounterCopyDiagnosticOrderTestReports: builder.query<
      ClaimEncounterCopyDiagnosticOrderTestReport[],
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
          ? `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-reports/by-copy/${claimEncounterCopyId}/all`
          : `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-reports/by-copy/${claimEncounterCopyId}/not-cancelled`,
        method: 'GET'
      }),
      providesTags: ['ClaimEncounterCopyDiagnosticOrderTestReport']
    }),

    createClaimEncounterCopyDiagnosticOrderTestReport: builder.mutation<
      ClaimEncounterCopyDiagnosticOrderTestReport,
      {
        claimEncounterCopyId: number;
        data: ClaimEncounterCopyDiagnosticOrderTestReportCreateDTO;
      }
    >({
      query: ({ claimEncounterCopyId, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-reports/by-copy/${claimEncounterCopyId}`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyDiagnosticOrderTestReport']
    }),

    updateClaimEncounterCopyDiagnosticOrderTestReport: builder.mutation<
      ClaimEncounterCopyDiagnosticOrderTestReport,
      {
        id: number;
        data: ClaimEncounterCopyDiagnosticOrderTestReportUpdateDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-reports/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyDiagnosticOrderTestReport']
    }),

    cancelClaimEncounterCopyDiagnosticOrderTestReport: builder.mutation<
      ClaimEncounterCopyDiagnosticOrderTestReport,
      {
        id: number;
        data: ClaimEncounterCopyDiagnosticOrderTestReportCancelDTO;
      }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-reports/${id}/cancel`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['ClaimEncounterCopyDiagnosticOrderTestReport']
    })
  })
});

export const {
  useGetClaimEncounterCopyDiagnosticOrderTestReportsQuery,
  useCreateClaimEncounterCopyDiagnosticOrderTestReportMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestReportMutation,
  useCancelClaimEncounterCopyDiagnosticOrderTestReportMutation
} = claimEncounterCopyDiagnosticOrderTestReportService;
