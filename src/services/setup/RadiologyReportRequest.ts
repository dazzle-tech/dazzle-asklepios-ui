import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

export interface RadiologyReportRequest {
  patient: {
    key: string;
    fullName?: string;
    patientMrn?: string;
    dob?: string;
  };

  encounter: {
    key: string;
    visitId?: string;
    patientAge?: number;
  };

  reportKey: string;
  reportHtml: string;
  reportStatus: string;
  severity: string;

  testName: string;
  testCode?: string;
  orderId: string;
  reportDate: number;

  facilityName: string;

  authenticatedUserName: string;
  authenticatedUserEmail?: string;
}
export const radiologyReportApi = createApi({
  reducerPath: 'radiologyReportApi',
  baseQuery,
  tagTypes: ['RadiologyPdf'],
  endpoints: builder => ({
    generateRadiologyPdf: builder.mutation<Blob, RadiologyReportRequest>({
      query: body => ({
        url: '/observation/radiology/generate',
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/pdf'
        },
        responseHandler: async response => {
          if (!response.ok) {
            let errorText = 'Unknown error';
            try {
              const errorJson = await response.json();
              errorText = errorJson.error || errorJson.message || errorText;
            } catch {
              errorText = await response.text();
            }
            throw new Error(`Radiology PDF generation failed: ${errorText}`);
          }
          return response.blob();
        }
      }),
      invalidatesTags: [{ type: 'RadiologyPdf', id: 'GENERATED' }]
    })
  })
});
export const { useGenerateRadiologyPdfMutation } = radiologyReportApi;