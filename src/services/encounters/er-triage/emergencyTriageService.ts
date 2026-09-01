import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import type {
  EmergencyTriage,
  EmergencyTriageCreate,
  EmergencyTriageDestinationUpdate,
  EmergencyTriageEyeAssessmentUpdate,
  EmergencyTriageLevelAssessmentUpdate,
  EmergencyTriageCompleteUpdate
} from '@/types/model-types-new';

type EmergencyTriageId = number | string;
type EncounterId = number | string;

export const emergencyTriageService = createApi({
  reducerPath: 'emergencyTriageApi',
  baseQuery: BaseQuery,
  tagTypes: ['EmergencyTriageLatest'],
  endpoints: builder => ({
    createOrGetEmergencyTriage: builder.mutation<EmergencyTriage, EmergencyTriageCreate>({
      query: payload => ({
        url: '/api/patient/emergency-triage',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: (result) =>
        result?.encounterId != null
          ? [{ type: 'EmergencyTriageLatest', id: result.encounterId }]
          : ['EmergencyTriageLatest']
    }),

    // Backend returns Optional<EmergencyTriage> (may be null when no triage exists)
    getLatestEmergencyTriageByEncounter: builder.query<EmergencyTriage | null, EncounterId>({
      query: encounterId => ({
        url: `/api/patient/emergency-triage/encounter/${encounterId}/latest`,
        method: 'GET'
      }),
      transformResponse: (response: any) => response ?? null,
      providesTags: (_result, _error, encounterId) => [
        { type: 'EmergencyTriageLatest', id: encounterId }
      ]
    }),

    updateEmergencyTriageEyeAssessment: builder.mutation<EmergencyTriage, EmergencyTriageEyeAssessmentUpdate>({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/emergency-triage/${id}/eye-assessment`,
        method: 'PUT',
        body: { id, ...payload }
      }),
      invalidatesTags: (result) =>
        result?.encounterId != null
          ? [{ type: 'EmergencyTriageLatest', id: result.encounterId }]
          : ['EmergencyTriageLatest']
    }),

    updateEmergencyTriageLevelAssessment: builder.mutation<
      EmergencyTriage,
      EmergencyTriageLevelAssessmentUpdate
    >({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/emergency-triage/${id}/level-assessment`,
        method: 'PUT',
        body: { id, ...payload }
      }),
      invalidatesTags: (result) =>
        result?.encounterId != null
          ? [{ type: 'EmergencyTriageLatest', id: result.encounterId }]
          : ['EmergencyTriageLatest']
    }),

    updateEmergencyTriageDestination: builder.mutation<
      EmergencyTriage,
      EmergencyTriageDestinationUpdate
    >({
      query: ({ id, ...payload }) => ({
        url: `/api/patient/emergency-triage/${id}/destination`,
        method: 'PUT',
        body: { id, ...payload }
      }),
      invalidatesTags: (result) =>
        result?.encounterId != null
          ? [{ type: 'EmergencyTriageLatest', id: result.encounterId }]
          : ['EmergencyTriageLatest']
    }),

    completeEmergencyTriage: builder.mutation<EmergencyTriage>({
      query: ({ id }) => ({
        url: `/api/patient/emergency-triage/${id}/complete`,
        method: 'PUT'
      }),
      invalidatesTags: (result) =>
        result?.encounterId != null
          ? [{ type: 'EmergencyTriageLatest', id: result.encounterId }]
          : ['EmergencyTriageLatest']
    }),

    hardDeleteEmergencyTriage: builder.mutation<void, EmergencyTriageId>({
      query: id => ({
        url: `/api/patient/emergency-triage/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['EmergencyTriageLatest']
    }),
    getEmergencyTriageBulkByEncounterIds: builder.query<EmergencyTriage[], EncounterId[]>({
      query: encounterIds => ({
        url: '/api/patient/emergency-triage/bulk-byEncounter',
        method: 'GET',
        params: { encounterIds }
      })
    }),
  })
});

export const {
  useCreateOrGetEmergencyTriageMutation,
  useGetLatestEmergencyTriageByEncounterQuery,
  useLazyGetLatestEmergencyTriageByEncounterQuery,
  useUpdateEmergencyTriageEyeAssessmentMutation,
  useUpdateEmergencyTriageLevelAssessmentMutation,
  useUpdateEmergencyTriageDestinationMutation,
  useCompleteEmergencyTriageMutation,
  useHardDeleteEmergencyTriageMutation,
  useGetEmergencyTriageBulkByEncounterIdsQuery,
  useLazyGetEmergencyTriageBulkByEncounterIdsQuery,
} = emergencyTriageService;

