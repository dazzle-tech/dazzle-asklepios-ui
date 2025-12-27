// services/ai-services/medicationTestOrdersValidationService.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

// ==========================
// Types (adjust to your actual schemas)
// ==========================
export interface MedicationTestValidationPatient {
  mrn: string;
  fullName?: string;
  gender?: string;
  dob?: string;
  [k: string]: any;
}

export interface MedicationValidationRequest {
  request_id?: string | null;
  patient: MedicationTestValidationPatient;
  medications: any[]; // replace with your medication schema
  [k: string]: any;
}

export interface TestValidationRequest {
  request_id?: string | null;
  patient: MedicationTestValidationPatient;
  tests: any[]; // replace with your test schema
  [k: string]: any;
}

export interface ValidationResponse {
  quick_summary?: {
    overall_status?: string;
    [k: string]: any;
  };
  summary?: string;
  warnings?: any[];
  recommendations?: any[];
  processing_metadata?: Record<string, any>;
  [k: string]: any;
}

// ==========================
// API Slice (same style as clinicalSummaryService)
// ==========================
export const medicationTestOrdersValidationService = createApi({
  reducerPath: 'medicationTestOrdersValidationApi',
  baseQuery: BaseQuery,
  tagTypes: ['MedicationTestOrdersValidation'],
  endpoints: builder => ({
    validateMedication: builder.mutation<ValidationResponse, MedicationValidationRequest>({
      query: (body) => ({
        url: '/api/ai/v1/medication-test-orders/validate/medication',
        method: 'POST',
        body,
      }),
    }),

    validateTests: builder.mutation<ValidationResponse, TestValidationRequest>({
      query: (body) => ({
        url: '/api/ai/v1/medication-test-orders/validate/tests',
        method: 'POST',
        body,
      }),
    }),

    // optional health endpoint (if your backend provides it)
    health: builder.query<any, void>({
      query: () => ({
        url: '/api/ai/v1/medication-test-orders/health',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useValidateMedicationMutation,
  useValidateTestsMutation,
  useHealthQuery,
  useLazyHealthQuery,
} = medicationTestOrdersValidationService;
