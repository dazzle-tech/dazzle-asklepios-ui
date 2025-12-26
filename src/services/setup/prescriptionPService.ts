import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

/* ========= Request DTO ========= */
export interface PrescriptionReportRequest {
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
  prescriptionKey: string;

  genericMedicationList?: Array<{
    id: number;
    name: string;
  }>;
}

/* ========= API ========= */
export const prescriptionPService = createApi({
  reducerPath: 'prescriptionApi',
  baseQuery,
  tagTypes: ['PrescriptionPdf'],
  endpoints: builder => ({
    generatePrescriptionPdf: builder.mutation<Blob, PrescriptionReportRequest>({
      query: body => ({
        url: '/observation/prescription/generate',
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
            throw new Error(`Prescription PDF generation failed: ${errorText}`);
          }
          return response.blob();
        }
      }),
      invalidatesTags: [{ type: 'PrescriptionPdf', id: 'GENERATED' }]
    })
  })
});

/* ========= Hooks ========= */
export const { useGeneratePrescriptionPdfMutation } = prescriptionPService;
