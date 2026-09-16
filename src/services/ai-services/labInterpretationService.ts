import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export interface ConditionDTO {
  name: string;
  date?: string;
}

export interface PatientContextDTO {
  age: number;
  sex: string;
  known_conditions: ConditionDTO[];
  clinical_context?: string;
}

export interface LabResultDTO {
  name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  flag?: string;
  timestamp?: string;
}

export interface MedicationDTO {
  name: string;
  start_date?: string;
  end_date?: string | null;
}

export interface LabInterpretationRequest {
  patientId: number;
  dateFrom: string;
  dateTo: string;
}

export interface KeyFindingDTO {
  lab_name: string;
  value: string;
  unit?: string;
  flag?: string;
  finding?: string;
}

export interface InterpretationDTO {
  severity?: string;
  key_findings: KeyFindingDTO[];
  follow_up_considerations: string[];
}

export interface LabInterpretationResponse {
  request_id: string;
  summary?: string;
  interpretation: InterpretationDTO;
}

export const labInterpretationService = createApi({
  reducerPath: 'labInterpretationService',
  baseQuery: BaseQuery,
  tagTypes: ['LabInterpretation'],
  endpoints: builder => ({
    interpretLabs: builder.mutation<
      LabInterpretationResponse,
      LabInterpretationRequest
    >({
      query: body => ({
        url: '/api/analytics/lab-interpretation',
        method: 'POST',
        body,
      }),
    }),

    debugInterpretLabs: builder.mutation<
      any,
      LabInterpretationRequest
    >({
      query: body => ({
        url: '/api/analytics/lab-interpretation/debug',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useInterpretLabsMutation,
  useDebugInterpretLabsMutation,
} = labInterpretationService;