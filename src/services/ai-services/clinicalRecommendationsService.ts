
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

/* ===================== Types ===================== */

export type PatientRecommendationRequest = {
  patientId: number;
  encounterId: number;
  focusAreas?: string[];
};

export type ClinicalRecommendation = {
  recommendation_id: string;
  type: string;
  title: string;
  description: string;
  rationale: string;
  priority: string;
  actionable_steps?: string[];
  evidence_level?: string | null;
  contraindications?: string[];
  monitoring_requirements?: string | null;
  follow_up?: string | null;
};

export type RecommendationsResponse = {
  request_id?: string | null;
  patient_id?: string | null;
  recommendations: ClinicalRecommendation[];
  summary: string;
  total_recommendations: number;
  priority_breakdown?: Record<string, number>;
  processing_metadata?: Record<string, any>;
};

/* ===================== Types ===================== */

export type PatientContext = Record<string, any>;

/** POST /recommendations */
export type RecommendationRequest = {
  request_id?: string | null;
  patient_context: PatientContext;
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

 
       getClinicalRecommendations: builder.mutation<
      RecommendationsResponse,
      PatientRecommendationRequest
    >({
      query: body => ({
        url: '/api/analytics/recommendations',
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