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
    })
  })
});

export const { useLazyGetNurseSummaryReportQuery } = observationServiceNew;