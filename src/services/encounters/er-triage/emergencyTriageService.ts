import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import type {
  EmergencyTriage,
  EmergencyTriageCreate,
  EmergencyTriageDestinationUpdate,
  EmergencyTriageEyeAssessmentUpdate,
  EmergencyTriageLevelAssessmentUpdate
} from '@/types/model-types-new';

type EmergencyTriageId = number | string;
type EncounterId = number | string;

export const emergencyTriageService = createApi({
  reducerPath: 'emergencyTriageApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    createOrGetEmergencyTriage: builder.mutation<EmergencyTriage, EmergencyTriageCreate>({
      query: payload => ({
        url: '/api/patient/emergency-triage',
        method: 'POST',
        body: payload
      })
    }),

    // Backend returns Optional<EmergencyTriage> (may be null when no triage exists)
    getLatestEmergencyTriageByEncounter: builder.query<EmergencyTriage | null, EncounterId>({
      query: encounterId => ({
        url: `/api/patient/emergency-triage/encounter/${encounterId}/latest`,
        method: 'GET'
      }),
      transformResponse: (response: any) => response ?? null
    }),

    updateEmergencyTriageEyeAssessment: builder.mutation<EmergencyTriage, EmergencyTriageEyeAssessmentUpdate>({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/emergency-triage/${id}/eye-assessment`,
        method: 'PUT',
        body: { id, ...payload }
      })
    }),

    updateEmergencyTriageLevelAssessment: builder.mutation<
      EmergencyTriage,
      EmergencyTriageLevelAssessmentUpdate
    >({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/emergency-triage/${id}/level-assessment`,
        method: 'PUT',
        body: { id, ...payload }
      })
    }),

    updateEmergencyTriageDestination: builder.mutation<
      EmergencyTriage,
      EmergencyTriageDestinationUpdate
    >({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/emergency-triage/${id}/destination`,
        method: 'PUT',
        body: { id, ...payload }
      })
    }),

    hardDeleteEmergencyTriage: builder.mutation<void, EmergencyTriageId>({
      query: id => ({
        url: `/api/patient/emergency-triage/${id}`,
        method: 'DELETE'
      })
    })
  })
});

export const {
  useCreateOrGetEmergencyTriageMutation,
  useGetLatestEmergencyTriageByEncounterQuery,
  useUpdateEmergencyTriageEyeAssessmentMutation,
  useUpdateEmergencyTriageLevelAssessmentMutation,
  useUpdateEmergencyTriageDestinationMutation,
  useHardDeleteEmergencyTriageMutation
} = emergencyTriageService;

