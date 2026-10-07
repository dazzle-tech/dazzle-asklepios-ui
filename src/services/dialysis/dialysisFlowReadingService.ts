import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  DialysisFlowReading,
  DialysisFlowReadingCreateDTO,
  DialysisFlowReadingUpdateDTO,
} from '@/types/model-types-new';

export const dialysisFlowReadingService = createApi({
  reducerPath: 'dialysisFlowReadingApi',
  baseQuery: BaseQuery,
  tagTypes: ['DialysisFlowReading'],

  endpoints: builder => ({

    createDialysisFlowReading: builder.mutation<
      DialysisFlowReading,
      DialysisFlowReadingCreateDTO
    >({
      query: body => ({
        url: '/api/patient/dialysis-flow-readings',
        method: 'POST',
        body,
      }),

      invalidatesTags: (_result, _error, body) => [
        {
          type: 'DialysisFlowReading',
          id: `session-${body.dialysisSessionId}`,
        },
      ],
    }),

    updateDialysisFlowReading: builder.mutation<
      DialysisFlowReading,
      DialysisFlowReadingUpdateDTO
    >({
      query: body => ({
        url: '/api/patient/dialysis-flow-readings',
        method: 'PUT',
        body,
      }),

      invalidatesTags: (_result, _error, body) => [
        {
          type: 'DialysisFlowReading',
          id: `session-${body.dialysisSessionId}`,
        },
      ],
    }),

    getDialysisFlowReadingsByDialysisSessionId: builder.query<
      DialysisFlowReading[],
      { dialysisSessionId: number }
    >({
      query: ({ dialysisSessionId }) => ({
        url: '/api/patient/dialysis-flow-readings/by-dialysis-session',
        method: 'GET',
        params: {
          dialysisSessionId,
        },
      }),

      providesTags: (_result, _error, { dialysisSessionId }) => [
        {
          type: 'DialysisFlowReading',
          id: `session-${dialysisSessionId}`,
        },
      ],
    }),

    deleteDialysisFlowReading: builder.mutation<
      void,
      { id: number; dialysisSessionId: number }
    >({
      query: ({ id }) => ({
        url: `/api/patient/dialysis-flow-readings/${id}`,
        method: 'DELETE',
      }),

      invalidatesTags: (_result, _error, { dialysisSessionId }) => [
        {
          type: 'DialysisFlowReading',
          id: `session-${dialysisSessionId}`,
        },
      ],
    }),

  }),
});

export const {
  useCreateDialysisFlowReadingMutation,
  useUpdateDialysisFlowReadingMutation,
  useGetDialysisFlowReadingsByDialysisSessionIdQuery,
  useDeleteDialysisFlowReadingMutation,
} = dialysisFlowReadingService;
