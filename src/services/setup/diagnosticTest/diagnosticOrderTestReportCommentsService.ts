import { BaseQuery } from '@/newApi';
import { createApi } from '@reduxjs/toolkit/query/react';

/* ================================
 * Types
 * ================================ */

export interface DiagnosticOrderTestReportComment {
  id?: number;
  reportId: number;
  orderTestId: number;
  note: string;
  createdBy?: string;
  createdDate?: string;
}

export interface DiagnosticOrderTestReportCommentCreateDTO {
  reportId: number;
  orderTestId: number;
  note: string;
}

/* ================================
 * API
 * ================================ */

export const diagnosticOrderTestReportCommentsService = createApi({
  reducerPath: 'diagnosticOrderTestReportCommentsApi',
  baseQuery: BaseQuery,
  tagTypes: ['RadiologyReportComment'],
  endpoints: builder => ({

    /* ============================
     * Get comments by reportId
     * ============================ */
    getReportCommentsByReportId: builder.query<
      DiagnosticOrderTestReportComment[],
      number
    >({
      query: reportId => ({
        url: `/api/patient/report-comments/by-report/${reportId}`,
        method: 'GET'
      }),
      providesTags: (result, error, reportId) =>
        result
          ? [
              ...result.map(c => ({
                type: 'RadiologyReportComment' as const,
                id: c.id
              })),
              { type: 'RadiologyReportComment', id: `REPORT_${reportId}` }
            ]
          : [{ type: 'RadiologyReportComment', id: `REPORT_${reportId}` }]
    }),

    /* ============================
     * Create comment
     * ============================ */
    createReportComment: builder.mutation<
      DiagnosticOrderTestReportComment,
      DiagnosticOrderTestReportCommentCreateDTO
    >({
      query: body => ({
        url: '/api/patient/report-comments',
        method: 'POST',
        body
      }),
      invalidatesTags: (r, e, body) => [
        { type: 'RadiologyReportComment', id: `REPORT_${body.reportId}` }
      ]
    }),

    /* ============================
     * Delete comment
     * ============================ */
    deleteReportComment: builder.mutation<
      void,
      { id: number; reportId: number }
    >({
      query: ({ id }) => ({
        url: `/api/patient/report-comments/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (r, e, { id, reportId }) => [
        { type: 'RadiologyReportComment', id },
        { type: 'RadiologyReportComment', id: `REPORT_${reportId}` }
      ]
    })
  })
});

export const {
  useGetReportCommentsByReportIdQuery,
  useLazyGetReportCommentsByReportIdQuery,
  useCreateReportCommentMutation,
  useDeleteReportCommentMutation
} = diagnosticOrderTestReportCommentsService;
