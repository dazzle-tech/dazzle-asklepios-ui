import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

/* ===================== TYPES ===================== */

export type LaboratoryResultItem = {
  resultDate: string | null;
  normalRange: string | null;
  categoryName: string | null;
  testName: string | null;
  result: string | null;
  unit: string | null;
  marker: string | null;
  reviewedDate: string | null;
  reviewedBy: string | null;
};

export type LaboratoryOrderTestSection = {
  orderTestId: number;
  testName: string | null;
  receivedDepartment: string | null;
  results: LaboratoryResultItem[];
};

export type LaboratoryOrderSection = {
  orderId: number;
  orderNumber: number;
  encounterNumber: string | null;
  fromDepartment: string | null;
  orderTests: LaboratoryOrderTestSection[];
};

export type LaboratoryReport = {
  facilityName: string | null;
  departmentName: string | null;

  patientFullName: string | null;
  mrn: string | null;
  dateOfBirth: string | null;
  age: string | null;
  gender: string | null;
  primaryMobileNumber: string | null;

  orders: LaboratoryOrderSection[];
};

/* ===================== SERVICE ===================== */

export const laboratoryReportsService = createApi({
  reducerPath: 'laboratoryReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['LaboratoryReport'],

  endpoints: builder => ({
    getLaboratoryReports: builder.query<LaboratoryReport, number[]>({
      query: resultIds => ({
        url: '/api/analytics/laboratory-reports/results',
        method: 'GET',
        params: {
          resultIds,
        },
      }),
      providesTags: ['LaboratoryReport'],
    }),

    getLaboratoryReportsPdf: builder.query<
      Blob,
      {
        resultIds: number[];
        timezone: string;
        lang?: string
      }
    >({
      query: ({ resultIds, timezone, lang = 'en' }) => ({
        url: '/api/analytics/laboratory-reports/results/pdf',
        method: 'GET',

        params: {
          resultIds,
          timezone,
          lang,
        },
        responseHandler: response => response.blob(),
      }),
    }),
  }),
});

/* ===================== HOOKS ===================== */

export const {
  useGetLaboratoryReportsQuery,
  useLazyGetLaboratoryReportsQuery,
  useLazyGetLaboratoryReportsPdfQuery,
} = laboratoryReportsService;