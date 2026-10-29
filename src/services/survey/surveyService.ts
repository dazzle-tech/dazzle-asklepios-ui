import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, PublicBaseQuery } from '@/newApi';

/** The survey the patient fills, from the survey questions setup */
export type SurveyFormQuestion = {
  id: number;
  questionEn: string;
  questionAr: string;
  answerType: 'SCALE' | 'TEXT';
  minValue: number | null;
  maxValue: number | null;
  isRequired: boolean;
};

export type SurveyFormSection = {
  id: number;
  nameEn: string;
  nameAr: string;
  questions: SurveyFormQuestion[];
};

/** Active sections with their questions, and the page texts saved in the survey texts setup (by key) */
export type SurveyForm = {
  sections: SurveyFormSection[];
  texts: Record<string, { en: string | null; ar: string | null }>;
};

/** Web survey OTP: the OTP goes by SMS to the mobile of the patient with this primary ID number */
export type SurveyOtpRequestPayload = { primaryDocumentNumber: string };

export type SurveyOtpVerifyPayload = SurveyOtpRequestPayload & { otp: string };

/** verificationToken links the submitted survey to the patient; it is not a login token */
export type SurveyOtpVerified = { patientName: string | null; verificationToken: string; expiresAt: string };

export type SurveyAnswer = { questionId: number; score?: number | null; textValue?: string | null };

/** verificationToken (from the web OTP) links the answers to the patient; left out when anonymous */
export type SurveySubmitPayload = {
  verificationToken?: string | null;
  startedAt?: string | null;
  answers: SurveyAnswer[];
};

/** A submitted survey for the responses page; patient fields are empty for anonymous answers */
export type SurveyResponse = {
  id: number;
  patientId: number | null;
  patientName: string | null;
  medicalRecordNumber: string | null;
  overallScore: number | null;
  overallPercentage: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdDate: string | null;
  answers: {
    id: number;
    questionId: number;
    sectionNameEn: string | null;
    sectionNameAr: string | null;
    questionEn: string | null;
    questionAr: string | null;
    answerType: 'SCALE' | 'TEXT' | null;
    minValue: number | null;
    maxValue: number | null;
    score: number | null;
    textValue: string | null;
  }[];
};

type SpringPage<T> = { content?: T[]; totalElements?: number };

// Public: the patient fills the survey without a staff login, so a staff token in this browser is never sent
export const surveyService = createApi({
  reducerPath: 'surveyApi',
  baseQuery: PublicBaseQuery,
  endpoints: builder => ({
    getSurveyForm: builder.query<SurveyForm, void>({
      query: () => '/api/patient/survey/form'
    }),

    // Like the patient portal request-otp, the OTP comes back as text for now (testing)
    requestSurveyOtp: builder.mutation<string, SurveyOtpRequestPayload>({
      query: body => ({
        url: '/api/patient/survey/request-otp',
        method: 'POST',
        body,
        responseHandler: 'text'
      })
    }),

    verifySurveyOtp: builder.mutation<SurveyOtpVerified, SurveyOtpVerifyPayload>({
      query: body => ({
        url: '/api/patient/survey/verify-otp',
        method: 'POST',
        body
      })
    }),

    submitSurvey: builder.mutation<void, SurveySubmitPayload>({
      query: body => ({
        url: '/api/patient/survey/submit',
        method: 'POST',
        body
      })
    })
  })
});

// Staff only: needs the staff login
export const surveyResponseService = createApi({
  reducerPath: 'surveyResponseApi',
  baseQuery: BaseQuery,
  tagTypes: ['SurveyResponse'],
  endpoints: builder => ({
    getSurveyResponses: builder.query<
      { data: SurveyResponse[]; totalCount: number },
      { page: number; size: number; sort?: string }
    >({
      query: ({ page, size, sort = 'createdDate,desc' }) => ({
        url: '/api/patient/survey/responses',
        params: { page, size, sort }
      }),
      transformResponse: (response: SpringPage<SurveyResponse>) => ({
        data: response?.content ?? [],
        totalCount: Number(response?.totalElements ?? 0)
      }),
      providesTags: ['SurveyResponse']
    })
  })
});

export const {
  useGetSurveyFormQuery,
  useRequestSurveyOtpMutation,
  useVerifySurveyOtpMutation,
  useSubmitSurveyMutation
} = surveyService;

export const { useGetSurveyResponsesQuery } = surveyResponseService;
