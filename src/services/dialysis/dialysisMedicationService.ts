import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  DialysisMedication,
  DialysisMedicationCreateDTO,
  DialysisMedicationUpdateDTO,
} from '@/types/model-types-new';

export const dialysisMedicationService = createApi({
  reducerPath: 'dialysisMedicationApi',
  baseQuery: BaseQuery,
  tagTypes: ['DialysisMedication'],

  endpoints: builder => ({

    createDialysisMedication: builder.mutation<
      DialysisMedication,
      DialysisMedicationCreateDTO
    >({
      query: body => ({
        url: '/api/patient/dialysis-medications',
        method: 'POST',
        body,
      }),

      invalidatesTags: (_result, _error, body) => [
        {
          type: 'DialysisMedication',
          id: `session-${body.dialysisSessionId}`,
        },
      ],
    }),

    updateDialysisMedication: builder.mutation<
      DialysisMedication,
      DialysisMedicationUpdateDTO
    >({
      query: body => ({
        url: '/api/patient/dialysis-medications',
        method: 'PUT',
        body,
      }),

      invalidatesTags: (_result, _error, body) => [
        {
          type: 'DialysisMedication',
          id: `session-${body.dialysisSessionId}`,
        },
      ],
    }),

    getDialysisMedicationsByDialysisSessionId: builder.query<
      DialysisMedication[],
      { dialysisSessionId: number }
    >({
      query: ({ dialysisSessionId }) => ({
        url: '/api/patient/dialysis-medications/by-dialysis-session',
        method: 'GET',
        params: {
          dialysisSessionId,
        },
      }),

      providesTags: (_result, _error, { dialysisSessionId }) => [
        {
          type: 'DialysisMedication',
          id: `session-${dialysisSessionId}`,
        },
      ],
    }),

    deleteDialysisMedication: builder.mutation<
      void,
      { id: number; dialysisSessionId: number }
    >({
      query: ({ id }) => ({
        url: `/api/patient/dialysis-medications/${id}`,
        method: 'DELETE',
      }),

      invalidatesTags: (_result, _error, { dialysisSessionId }) => [
        {
          type: 'DialysisMedication',
          id: `session-${dialysisSessionId}`,
        },
      ],
    }),

  }),
});

export const {
  useCreateDialysisMedicationMutation,
  useUpdateDialysisMedicationMutation,
  useGetDialysisMedicationsByDialysisSessionIdQuery,
  useDeleteDialysisMedicationMutation,
} = dialysisMedicationService;
