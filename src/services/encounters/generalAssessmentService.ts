import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type { GeneralAssessment } from '@/types/model-types-new';

type GeneralAssessmentId = number | string;
type GeneralAssessmentCreate = Omit<GeneralAssessment, 'id'>;
type GeneralAssessmentUpdate = GeneralAssessment & { id: number };

export const generalAssessmentService = createApi({
  reducerPath: 'generalAssessmentApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createGeneralAssessment: builder.mutation<GeneralAssessment, GeneralAssessmentCreate>({
      query: (payload) => ({
        url: '/api/patient/general-assessment',
        method: 'POST',
        body: payload
      })
    }),
    updateGeneralAssessment: builder.mutation<GeneralAssessment, GeneralAssessmentUpdate>({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/general-assessment/${id}`,
        method: 'PUT',
        body: { id, ...payload }
      })
    }),
    getLatestGeneralAssessmentByEncounter: builder.query<GeneralAssessment, GeneralAssessmentId>({
      query: (encounterId) => ({
        url: `/api/patient/general-assessment/encounter/${encounterId}/latest`,
        method: 'GET'
      })
    }),
    getLatestTriageGeneralAssessmentByEncounter: builder.query<GeneralAssessment, GeneralAssessmentId>({
      query: (encounterId) => ({
        url: `/api/patient/general-assessment/encounter/${encounterId}/latest-triage`,
        method: 'GET'
      })
    }),
    hardDeleteGeneralAssessment: builder.mutation<void, GeneralAssessmentId>({
      query: (id) => ({
        url: `/api/patient/general-assessment/${id}`,
        method: 'DELETE'
      })
    })
  })
});

export const {
  useCreateGeneralAssessmentMutation,
  useUpdateGeneralAssessmentMutation,
  useGetLatestGeneralAssessmentByEncounterQuery,
  useGetLatestTriageGeneralAssessmentByEncounterQuery,
  useHardDeleteGeneralAssessmentMutation
} = generalAssessmentService;

