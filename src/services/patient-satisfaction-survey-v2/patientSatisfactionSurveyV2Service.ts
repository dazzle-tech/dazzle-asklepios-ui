import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export type PatientSatisfactionSurveyV2Answer = {
  questionCode: string;
  score?: number | null;
  answerText?: string | null;
};

export type PatientSatisfactionSurveyV2SubmitPayload = {
  patientName?: string | null;
  startedAt?: string | null;
  answers: PatientSatisfactionSurveyV2Answer[];
};

export type PatientSatisfactionSurveyV2ResponseVM = {
  id: number;
  patientName?: string | null;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  overallScore?: number | null;
  overallPercentage?: number | null;
  createdDate?: string | null;
  answers: (PatientSatisfactionSurveyV2Answer & { id: number })[];
};

export type PatientSatisfactionSurveyV2PagedResult = {
  data: PatientSatisfactionSurveyV2ResponseVM[];
  totalCount: number;
};

type SpringPageResponse<T> = {
  content?: T[];
  totalElements?: number;
};

export const patientSatisfactionSurveyV2Service = createApi({
  reducerPath: 'patientSatisfactionSurveyV2Api',
  baseQuery: BaseQuery,
  tagTypes: ['PatientSatisfactionSurveyV2Response'],
  endpoints: builder => ({
    submitPatientSatisfactionSurveyV2: builder.mutation<
      PatientSatisfactionSurveyV2ResponseVM,
      PatientSatisfactionSurveyV2SubmitPayload
    >({
      query: body => ({
        url: '/api/patient/patient-satisfaction-survey/v2/submit',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientSatisfactionSurveyV2Response']
    }),

    getPatientSatisfactionSurveyV2Responses: builder.query<
      PatientSatisfactionSurveyV2PagedResult,
      { page: number; size: number; sort?: string }
    >({
      query: ({ page, size, sort = 'createdDate,desc' }) => ({
        url: '/api/patient/patient-satisfaction-survey/v2/responses',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: SpringPageResponse<PatientSatisfactionSurveyV2ResponseVM>) => ({
        data: response?.content ?? [],
        totalCount: Number(response?.totalElements ?? 0)
      }),
      providesTags: ['PatientSatisfactionSurveyV2Response']
    })
  })
});

export const {
  useSubmitPatientSatisfactionSurveyV2Mutation,
  useGetPatientSatisfactionSurveyV2ResponsesQuery
} = patientSatisfactionSurveyV2Service;
