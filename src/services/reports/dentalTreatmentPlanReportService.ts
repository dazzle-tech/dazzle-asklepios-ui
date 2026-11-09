import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export const dentalTreatmentPlanReportService = createApi({
  reducerPath: 'dentalTreatmentPlanReportApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    getDentalTreatmentPlanPdf: builder.query<
      Blob,
      { planId: number; lang?: string; attachmentIds?: number[] }
    >({
      query: ({ planId, lang = 'en', attachmentIds = [] }) => ({
        url: `/api/analytics/dental-treatment-plans/${planId}/pdf`,
        method: 'GET',
        params: {
          lang,
          ...(attachmentIds.length ? { attachmentIds: attachmentIds.join(',') } : {})
        },
        responseHandler: response => response.blob()
      })
    })
  })
});

export const { useLazyGetDentalTreatmentPlanPdfQuery } = dentalTreatmentPlanReportService;
