import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

export const encounterAssessmentService = createApi({
  reducerPath: 'encounterAssessmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['EncounterAssessment'],
  endpoints: builder => ({
    createEncounterAssessment: builder.mutation<
      modelTypes.EncounterAssessment,
      modelTypes.EncounterAssessment
    >({
      query: data => ({
        url: `/api/patient/encounter-assessments`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EncounterAssessment'],
    }),

    updateEncounterAssessment: builder.mutation<
      modelTypes.EncounterAssessment,
      { id: Id; data: modelTypes.EncounterAssessment }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/encounter-assessments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'EncounterAssessment', id },
        'EncounterAssessment',
      ],
    }),

    getLatestEncounterAssessment: builder.query<
      modelTypes.EncounterAssessment,
      { encounterId: Id; userId: Id; timestamp?: number }
    >({
      query: ({ encounterId, userId }) => ({
        url: `/api/patient/encounter-assessments/latest`,
        params: { encounterId, userId },
      }),
      providesTags: (_res, _err, { encounterId, userId }) => [
        { type: 'EncounterAssessment', id: `latest-${encounterId}-${userId}` },
        'EncounterAssessment',
      ],
    }),
  }),
});

export const {
  useCreateEncounterAssessmentMutation,
  useUpdateEncounterAssessmentMutation,
  useGetLatestEncounterAssessmentQuery,
  useLazyGetLatestEncounterAssessmentQuery,
} = encounterAssessmentService;
