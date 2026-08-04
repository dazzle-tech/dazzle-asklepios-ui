import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export type QualityDischargeReportResponse = {
  qa_method: string;
  overall_score: number;
  summary: string;
  parsed_report: Record<string, any>;
  errors: Record<string, any>[];
  missing_items: Record<string, any>[];
  inconsistencies: Record<string, any>[];
  recommended_corrections: Record<string, any>[];
};

export const qualityDischargeReportService = createApi({
  reducerPath: 'qualityDischargeReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['QualityDischargeReport'],
  endpoints: builder => ({
    runDischargeReportQualityCheck: builder.mutation<
      QualityDischargeReportResponse,
      { encounterId: number | string; dischargeReport: string }
    >({
      query: ({ encounterId, dischargeReport }) => ({
        url: `/api/analytics/encounters/${encounterId}/discharge-report/qa`,
        method: 'POST',
        body: { dischargeReport }
      })
    })
  })
});

export const { useRunDischargeReportQualityCheckMutation } = qualityDischargeReportService;
