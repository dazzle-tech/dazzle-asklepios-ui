import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

/* ===================== TYPES ===================== */

export type RadiologyReport = {
  facilityName: string;
  departmentName: string;

  patientFullName: string;
  mrn: string;
  dateOfBirth: string | null;
  age: string | null;
  gender: string | null;
  primaryMobileNumber: string | null;

  encounterNumber: string | null;
  orderingPhysician: string | null;
  fromDepartment: string | null;
  testName: string | null;

  report: string | null;
  severity: string | null;
  approvedBy: string | null;
  reviewedBy: string | null;
};

/* ===================== SERVICE ===================== */

export const radiologyReportService = createApi({
  reducerPath: 'radiologyReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['RadiologyReport'],
  endpoints: builder => ({
    getRadiologyReportById: builder.query<RadiologyReport, number>({
      query: reportId => ({
        url: `/api/analytics/radiology-reports/${reportId}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, reportId) => [
        { type: 'RadiologyReport', id: reportId },
      ],
    }),

   getRadiologyReportPdf: builder.query<
  Blob,
  { reportId: number; lang?: string }
>({
  query: ({ reportId, lang = 'en' }) => ({
    url: `/api/analytics/radiology-reports/${reportId}/pdf`,
    method: 'GET',
    params: {
      lang
    },
    responseHandler: (response) => response.blob()
  })
})
  }),
});

/* ===================== HOOKS ===================== */

export const {
  useGetRadiologyReportByIdQuery,
  useLazyGetRadiologyReportByIdQuery,
  useLazyGetRadiologyReportPdfQuery

} = radiologyReportService;