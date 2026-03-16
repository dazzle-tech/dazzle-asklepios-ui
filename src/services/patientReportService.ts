import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

export interface PatientSecondaryDocumentDTO {
  documentNo?: string;
  documentType?: string;    
  documentCountry?: string; 
}

export interface PatientReportRequest {
  patient: any; 
  facilityName?: string;
  authenticatedUserName?: string;
  authenticatedUserEmail?: string;

  profilePictureBase64?: string; 
  profilePictureUrl?: string;

  secondaryDocuments?: PatientSecondaryDocumentDTO[];
}

export const patientReportService = createApi({
  reducerPath: 'patientReportApi',
  baseQuery,
  tagTypes: ['PatientPdf'],
  endpoints: builder => ({
    generatePatientPdf: builder.mutation<Blob, PatientReportRequest>({
      query: body => ({
        url: '/pas/report/generate', 
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
            throw new Error(`Patient PDF generation failed: ${errorText}`);
          }
          return response.blob();
        }
      }),
      invalidatesTags: [{ type: 'PatientPdf', id: 'GENERATED' }]
    })
  })
});

export const { useGeneratePatientPdfMutation } = patientReportService;
