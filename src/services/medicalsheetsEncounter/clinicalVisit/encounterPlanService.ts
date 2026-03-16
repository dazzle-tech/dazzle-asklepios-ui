import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

export const encounterPlanService = createApi({
  reducerPath: 'encounterPlanApi',
  baseQuery: BaseQuery,
  tagTypes: ['EncounterPlan'],
  endpoints: builder => ({
    createEncounterPlan: builder.mutation<
      modelTypes.EncounterPlan,
      modelTypes.EncounterPlan
    >({
      query: (data) => ({
        url: `/api/patient/encounter-plans`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EncounterPlan'],
    }),

    updateEncounterPlan: builder.mutation<
      modelTypes.EncounterPlan,
      { id: Id; data: modelTypes.EncounterPlan }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/encounter-plans/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'EncounterPlan', id },
        'EncounterPlan',
      ],
    }),

    getLatestEncounterPlan: builder.query<
      modelTypes.EncounterPlan,
      { encounterId: Id; timestamp?: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter-plans/latest`,
        params: { encounterId },
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterPlan', id: `latest-${encounterId}` },
        'EncounterPlan',
      ],
    }),
  }),
});

export const {
  useCreateEncounterPlanMutation,
  useUpdateEncounterPlanMutation,
  useGetLatestEncounterPlanQuery,
  useLazyGetLatestEncounterPlanQuery,
} = encounterPlanService;
