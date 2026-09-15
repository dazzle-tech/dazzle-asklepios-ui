import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { DischargeReportResponse } from '@/types/model-types-new';

export const dischargeReportService = createApi({
  reducerPath: 'dischargeReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['DischargeReport'],
  endpoints: builder => ({
    generateDischargeReport: builder.query<DischargeReportResponse, { encounterId: number | string }>({
      query: ({ encounterId }) => ({
        url: `/api/analytics/encounters/${encounterId}/discharge-report`,
        method: 'GET'
      })
    })
  })
});

export const {
  useGenerateDischargeReportQuery,
  useLazyGenerateDischargeReportQuery
} = dischargeReportService;