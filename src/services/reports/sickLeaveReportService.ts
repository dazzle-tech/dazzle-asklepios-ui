import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

/* ===================== TYPES ===================== */

export type SickLeaveReportRequestDTO = {
  fromDate: string;
  toDate: string;
  notes: string;
};

export type SickLeaveReportDTO = {
  encounterId: number;
  fromDate: string;
  toDate: string;
  notes: string;
  [key: string]: any;
};

/* ===================== SERVICE ===================== */

export const sickLeaveReportService = createApi({
  reducerPath: 'sickLeaveReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['SickLeaveReport'],
  endpoints: builder => ({
    postSickLeaveReport: builder.mutation<
      SickLeaveReportDTO,
      { encounterId: number; request: SickLeaveReportRequestDTO }
    >({
      query: ({ encounterId, request }) => ({
        url: `/api/analytics/sick-leave-report/${encounterId}`,
        method: 'POST',
        body: request,
      }),
      invalidatesTags: (_r, _e, { encounterId }) => [
        { type: 'SickLeaveReport', id: encounterId },
      ],
    }),

    postSickLeaveReportPdf: builder.mutation<
  Blob,
  {
    encounterId: number;
    timezone: string;
    request: {
      fromDate: string;
      toDate: string;
      notes?: string;
    };
  }
>({
  query: ({ encounterId, timezone, request }) => ({
    url: `/api/analytics/sick-leave-report/${encounterId}/pdf`,
    method: 'POST',
    params: {
      timezone,
    },
    body: request,
    responseHandler: response => response.blob(),
  }),
}),
  }),
});

/* ===================== HOOKS ===================== */

export const {
  usePostSickLeaveReportMutation,
  usePostSickLeaveReportPdfMutation,
} = sickLeaveReportService;
