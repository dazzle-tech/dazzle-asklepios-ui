import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { NurseSummaryReportVM } from '@/types/model-types-new';

export const observationServiceNew = createApi({
  reducerPath: 'observationService',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    getNurseSummaryReport: builder.query<NurseSummaryReportVM, { encounterId: number }>({
      query: ({ encounterId }) => ({
        url: `/api/analytics/nurse-summary/${encounterId}`,
        method: 'GET'
      })
    }),
    getNurseSummaryReportPdf: builder.query<Blob, { encounterId: number }>({
      query: ({ encounterId }) => ({
        url: `/api/analytics/nurse-summary/${encounterId}/pdf`,
        method: 'GET',
        responseHandler: response => response.blob()
      })
    }),
    getVisitReport: builder.query<any, { encounterId: number }>({
      query: ({ encounterId }) => ({
        url: `/api/analytics/visit-report/${encounterId}`,
        method: 'GET'
      })
    }),
   getVisitReportPdf: builder.query<
  Blob,
  { encounterId: number; timezone: string }
>({
  query: ({ encounterId, timezone }) => ({
    url: `/api/analytics/visit-report/${encounterId}/pdf`,
    method: 'GET',
    params: {
      timezone,
    },
    responseHandler: response => response.blob(),
  }),
}),
  })
});

export const {
  useLazyGetNurseSummaryReportQuery,
  useLazyGetNurseSummaryReportPdfQuery,
  useLazyGetVisitReportQuery,
  useLazyGetVisitReportPdfQuery
} = observationServiceNew;
