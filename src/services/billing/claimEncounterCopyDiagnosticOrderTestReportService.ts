import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '@/newApi';

import {
  ClaimEncounterCopyDiagnosticOrderTestReport,
  ClaimEncounterCopyDiagnosticOrderTestReportCreateDTO,
  ClaimEncounterCopyDiagnosticOrderTestReportUpdateDTO
} from '@/types/model-types-new';


export const claimEncounterCopyDiagnosticOrderTestReportService = createApi({
  reducerPath: 'claimEncounterCopyDiagnosticOrderTestReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClaimEncounterCopyDiagnosticOrderTestReport'],
  endpoints: builder => ({
    getClaimEncounterCopyDiagnosticOrderTestReports: builder.query<
      ClaimEncounterCopyDiagnosticOrderTestReport[],
      {
        claimEncounterCopyId: number;      }
    >({
      query: ({
        claimEncounterCopyId
      }) => ({
        url: `/api/patient/billing/claim-encounter-copy-diagnostic-order-test-reports/by-copy/${claimEncounterCopyId}/all`,
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

  })
});

export const {
  useGetClaimEncounterCopyDiagnosticOrderTestReportsQuery,
  useCreateClaimEncounterCopyDiagnosticOrderTestReportMutation,
  useUpdateClaimEncounterCopyDiagnosticOrderTestReportMutation
} = claimEncounterCopyDiagnosticOrderTestReportService;
