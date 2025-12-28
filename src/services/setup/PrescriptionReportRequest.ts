import { prescriptionInstructions } from './../../types/model-types-new';
// ============================================================================
// FILE: prescriptionPService.ts  (UPDATED - send instruction lists like frontend)
// ============================================================================

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/api';

/* ========= Request DTO ========= */
/* ========= Request DTO ========= */

export interface LovValueDTO {
  lovDisplayVale?: string; 
}

export interface PredefinedInstructionDTO {
  id: number;              // inst.id
  dose?: string | number;  // inst.dose
  unit?: string;           // inst.unit (enum string)
  rout?: string;           // inst.rout (enum string)
  frequency?: string;      // inst.frequency (enum string)
}

export interface CustomInstructionDTO {
  prescriptionMedicationsKey: string; // row.key
  dose?: string | number;
  unitLvalue?: LovValueDTO;           // ci.unitLvalue.lovDisplayVale
  frequencyLvalue?: LovValueDTO;      // ci.frequencyLvalue.lovDisplayVale
}

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

  predefinedInstructions?: PredefinedInstructionDTO[];
  customInstructions?: CustomInstructionDTO[];

  facilityName?: string;
  authenticatedUserName?: string;
  authenticatedUserEmail?: string;
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
