import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import { TimelineResponse } from '@/types/model-types-new';

export const patientTimelineService = createApi({
  reducerPath: 'patientTimelineApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    // GET /api/analytics/patients/{patientId}/timeline
    getPatientTimeline: builder.query<TimelineResponse, number>({
      query: patientId => ({
        url: `/api/analytics/patients/${patientId}/timeline`,
        method: 'GET',
      }),
      onQueryStarted,
    }),
  }),
});

export const { useLazyGetPatientTimelineQuery } = patientTimelineService;