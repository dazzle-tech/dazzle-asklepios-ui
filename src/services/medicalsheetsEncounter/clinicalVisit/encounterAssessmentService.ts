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
      { encounterId: Id; timestamp?: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter-assessments/latest`,
        params: { encounterId },
      }),

      providesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterAssessment', id: `latest-${encounterId}` },
        'EncounterAssessment',
      ],
    }),

    getAssessmentAudit: builder.query<modelTypes.EncounterAssessmentLog[], { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/assessment/${id}/audit`,
        method: 'GET'
      }),
      providesTags: (_res, _err, { id }) => [
        { type: 'EncounterAssessment', id }
      ]
    }),
  }),
});

export const {
  useCreateEncounterAssessmentMutation,
  useUpdateEncounterAssessmentMutation,
  useGetLatestEncounterAssessmentQuery,
  useLazyGetLatestEncounterAssessmentQuery,
  useGetAssessmentAuditQuery
} = encounterAssessmentService;
