import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import type {
  PatientSatisfactionSurveyPageableParams,
  PatientSatisfactionSurveyResponse,
  PatientSatisfactionSurveyResponseVM,
  PatientSatisfactionSurveySubmitPayload
} from '@/pages/patient-satisfaction-survey/types';

const unwrapObjectOrReturn = <T>(response: any): T => response?.object ?? response;

export const PATIENT_SATISFACTION_SURVEY_SUBMIT_URL =
  '/api/patient/patient-satisfaction-survey/submit';

export const PATIENT_SATISFACTION_SURVEY_RESPONSES_URL =
  '/api/patient/patient-satisfaction-survey/responses';

export type PatientSatisfactionSurveyPagedResult = {
  data: PatientSatisfactionSurveyResponseVM[];
  totalCount: number;
  page?: number;
  size?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
};

type SpringPageResponse<T> = {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
};

const mapPagedResponse = <T>(
  response: T[] | SpringPageResponse<T>
): PatientSatisfactionSurveyPagedResult => {
  if (response !== null && !Array.isArray(response) && Array.isArray(response.content)) {
    return {
      data: response.content,
      totalCount: Number(response.totalElements ?? 0),
      totalPages: Number(response.totalPages ?? 0),
      page: Number(response.number ?? 0),
      size: Number(response.size ?? response.content.length),
      first: Boolean(response.first),
      last: Boolean(response.last)
    };
  }

  const data = Array.isArray(response) ? response : [];
  return {
    data,
    totalCount: data.length
  };
};

export const patientSatisfactionSurveyService = createApi({
  reducerPath: 'patientSatisfactionSurveyApi',
  baseQuery: BaseQuery,
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
    }),

    getSubmittedPatientSatisfactionSurveys: builder.query<
      PatientSatisfactionSurveyPagedResult,
      PatientSatisfactionSurveyPageableParams
    >({
      query: ({ page, size, sort = 'createdDate,desc' }) => ({
        url: PATIENT_SATISFACTION_SURVEY_RESPONSES_URL,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (
        response: PatientSatisfactionSurveyResponseVM[] | SpringPageResponse<PatientSatisfactionSurveyResponseVM>
      ) => mapPagedResponse(response),
      providesTags: ['PatientSatisfactionSurveyResponse']
    })
  })
});

export const {
  useSubmitPatientSatisfactionSurveyMutation,
  useGetSubmittedPatientSatisfactionSurveysQuery,
  useLazyGetSubmittedPatientSatisfactionSurveysQuery
} = patientSatisfactionSurveyService;
