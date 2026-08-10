import { createApi } from '@reduxjs/toolkit/query/react';
import { PublicBaseQuery } from '@/newApi';
import type {
  PatientSatisfactionSurveyResponse,
  PatientSatisfactionSurveySubmitPayload
} from '@/pages/patient-satisfaction-survey/types';

const unwrapObjectOrReturn = <T>(response: any): T => response?.object ?? response;

export const PATIENT_SATISFACTION_SURVEY_SUBMIT_URL =
  '/api/patient/patient-satisfaction-survey/submit';

export const patientSatisfactionSurveyService = createApi({
  reducerPath: 'patientSatisfactionSurveyApi',
  baseQuery: PublicBaseQuery,
  tagTypes: ['PatientSatisfactionSurveyResponse'],
  endpoints: builder => ({
    submitPatientSatisfactionSurvey: builder.mutation<
      PatientSatisfactionSurveyResponse,
      PatientSatisfactionSurveySubmitPayload
    >({
      query: body => ({
        url: PATIENT_SATISFACTION_SURVEY_SUBMIT_URL,
        method: 'POST',
        body
      }),
      transformResponse: (response: any) =>
        unwrapObjectOrReturn<PatientSatisfactionSurveyResponse>(response),
      invalidatesTags: ['PatientSatisfactionSurveyResponse']
    })
  })
});

export const { useSubmitPatientSatisfactionSurveyMutation } = patientSatisfactionSurveyService;
