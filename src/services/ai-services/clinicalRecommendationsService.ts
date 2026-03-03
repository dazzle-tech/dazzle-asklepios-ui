import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

/* ===================== Types ===================== */

export type PatientContext = Record<string, any>;

/** POST /recommendations */
export type RecommendationRequest = {
  request_id?: string | null;
  patient_context: PatientContext;
};

export type RecommendationsResponse = {
  request_id?: string | null;
  summary: string;
  processing_metadata?: Record<string, any>;
};

/** POST /consultation/specialty */
export type SpecialtyConsultationRequest = {
  request_id?: string | null;
  specialty: string;
  patient_context?: PatientContext;
  complaint?: string;
};

export type SpecialtyConsultationResponse = {
  request_id?: string | null;
  summary: string;
  processing_metadata?: Record<string, any>;
};

/** POST /recommendations/user-role */
export type UserRoleRecommendationRequest = {
  request_id?: string | null;
  user_role: string;
  patient_context: PatientContext;
};

/* ===================== API ===================== */

export const clinicalRecommendationsService = createApi({
  reducerPath: 'clinicalRecommendationsApi',
  baseQuery: BaseQuery,
  tagTypes: ['ClinicalRecommendations'],
  endpoints: builder => ({
    /* ---------- Health Check ---------- */
    clinicalRecommendationsHealth: builder.query<any, void>({
      query: () => ({
        url: '/api/ai/v1/clinical-recommendations/health',
        method: 'GET'
      })
    }),

    /* ---------- Generate Recommendations ---------- */
    getClinicalRecommendations: builder.mutation<
      RecommendationsResponse,
      RecommendationRequest
    >({
      query: body => ({
        url: '/api/ai/v1/clinical-recommendations/recommendations',
        method: 'POST',
        body
      })
    }),

    /* ---------- Specialty Consultation ---------- */
    getSpecialtyConsultation: builder.mutation<
      SpecialtyConsultationResponse,
      SpecialtyConsultationRequest
    >({
      query: body => ({
        url: '/api/ai/v1/clinical-recommendations/consultation/specialty',
        method: 'POST',
        body
      })
    }),

    /* ---------- User Role Recommendations ---------- */
    getUserRoleRecommendations: builder.mutation<
      RecommendationsResponse,
      UserRoleRecommendationRequest
    >({
      query: body => ({
        url: '/api/ai/v1/clinical-recommendations/recommendations/user-role',
        method: 'POST',
        body
      })
    })
  })
});

/* ===================== Hooks ===================== */

export const {
  useClinicalRecommendationsHealthQuery,
  useLazyClinicalRecommendationsHealthQuery,
  useGetClinicalRecommendationsMutation,
  useGetSpecialtyConsultationMutation,
  useGetUserRoleRecommendationsMutation
} = clinicalRecommendationsService;