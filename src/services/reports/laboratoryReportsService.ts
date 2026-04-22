import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { result } from 'lodash';

/* ===================== TYPES ===================== */

export type LaboratoryReport = {

  facilityName : String;
    departmentName : String;
    patientFullName : String;
        mrn : String;
     dateOfBirth : Date;
      age : String;
      gender : String;
     primaryMobileNumber : String;

     encounterNumber : String;
     orderNumber : number;
      resultDate : String;
      normalRange : String;
      fromDepartment : String;
       testName : String;

       result : String;
      unit : String;
       marker : String;
     reviewedDate : String;
     reviewedBy : String;
};

/* ===================== SERVICE ===================== */

export const laboratoryReportsService = createApi({
  reducerPath: 'laboratoryReportApi',
  baseQuery: BaseQuery,
  tagTypes: ['LaboratoryReport'],
  endpoints: builder => ({
    getLaboratoryReportById: builder.query<LaboratoryReport, number>({
      query: resultId => ({
        url: `/api/analytics/laboratory-reports/result/${resultId}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, resultId) => [
        { type: 'LaboratoryReport', id: resultId },
      ],
    }),

     getLaboratoryReportPdf: builder.query<Blob, { resultId: number }>({
      query: ({ resultId }) => ({
        
        url: `/api/analytics/laboratory-reports/result/${resultId}/pdf`,
        method: 'GET',
        responseHandler: (response) => response.blob()
      })
    })
  }),
});

/* ===================== HOOKS ===================== */

export const {
  useGetLaboratoryReportByIdQuery,
  useLazyGetLaboratoryReportByIdQuery,
  useLazyGetLaboratoryReportPdfQuery

} = laboratoryReportsService;