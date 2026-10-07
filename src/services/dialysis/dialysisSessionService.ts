import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  DialysisSession,
  DialysisSessionCreateDTO,
  DialysisSessionUpdateDTO,
} from '@/types/model-types-new';

/* ===================== SERVICE ===================== */

export const dialysisSessionService = createApi({
  reducerPath: 'dialysisSessionApi',
  baseQuery: BaseQuery,
  tagTypes: ['DialysisSession'],

  endpoints: builder => ({

    /* -------------------------------------------------
     * CREATE
     * ------------------------------------------------- */

    createDialysisSession: builder.mutation<
      DialysisSession,
      DialysisSessionCreateDTO
    >({
      query: body => ({
        url: '/api/patient/dialysis-sessions',
        method: 'POST',
        body,
      }),

      invalidatesTags: ['DialysisSession'],
    }),

    /* -------------------------------------------------
     * UPDATE
     * ------------------------------------------------- */

    updateDialysisSession: builder.mutation<
      DialysisSession,
      DialysisSessionUpdateDTO
    >({
      query: body => ({
        url: '/api/patient/dialysis-sessions',
        method: 'PUT',
        body,
      }),

      invalidatesTags: ['DialysisSession'],
    }),

    /* -------------------------------------------------
     * GET BY PATIENT + ENCOUNTER
     * ------------------------------------------------- */

    getDialysisSession: builder.query<
    DialysisSession,
    {
        patientId: number;
        encounterId: number;
    }
    >({
      query: ({ patientId, encounterId }) => ({
        url:
          '/api/patient/dialysis-sessions/by-patient-and-encounter',
        method: 'GET',
        params: {
          patientId,
          encounterId,
        },
      }),

      providesTags: (_result, _error, { patientId, encounterId }) => [
        {
          type: 'DialysisSession',
          id: `patient-${patientId}-encounter-${encounterId}`,
        },
      ],
    }),

  }),
});

/* ===================== HOOKS ===================== */

export const {
  useCreateDialysisSessionMutation,
  useUpdateDialysisSessionMutation,
  useGetDialysisSessionQuery,
  useLazyGetDialysisSessionQuery,
} = dialysisSessionService;
