import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  DialysisSession,
  DialysisSessionCreateDTO,
  DialysisSessionUpdateDTO,
} from '@/types/model-types-new';

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

type FindDialysisSessionsParams = {
  patientId: number;
  encounterId: number;
  treatmentPlanId?: number;
  page?: number;
  size?: number;
  sort?: string;
};

/* ===================== SERVICE ===================== */

export const dialysisSessionService = createApi({
  reducerPath: 'dialysisSessionApi',
  baseQuery: BaseQuery,
  tagTypes: ['DialysisSession'],

  endpoints: builder => ({

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

    getDialysisSessions: builder.query<
      PagedResult<DialysisSession>,
      FindDialysisSessionsParams
    >({
      query: ({
        patientId,
        encounterId,
        treatmentPlanId,
        page = 0,
        size = 20,
        sort = 'lastModifiedDate,desc',
      }) => ({
        url: '/api/patient/dialysis-sessions',
        method: 'GET',
        params: {
          patientId,
          encounterId,
          ...(treatmentPlanId != null ? { treatmentPlanId } : {}),
          page,
          size,
          sort,
        },
      }),

      transformResponse: (
        response: DialysisSession[],
        meta
      ): PagedResult<DialysisSession> => {
        const totalCount =
          Number(meta?.response?.headers.get('X-Total-Count')) ||
          response?.length ||
          0;

        return {
          data: response ?? [],
          totalCount,
        };
      },

      providesTags: (result, _error, { patientId, encounterId }) => [
        {
          type: 'DialysisSession',
          id: `patient-${patientId}-encounter-${encounterId}`,
        },
        ...(result?.data ?? []).map(session => ({
          type: 'DialysisSession' as const,
          id: session.id,
        })),
      ],
    }),

    getDialysisSessionsByTreatmentPlan: builder.query<
      DialysisSession[],
      {
        patientId: number;
        encounterId: number;
        treatmentPlanId: number;
      }
    >({
      query: ({ patientId, encounterId, treatmentPlanId }) => ({
        url: '/api/patient/dialysis-sessions/by-patient-encounter-and-treatment-plan',
        method: 'GET',
        params: {
          patientId,
          encounterId,
          treatmentPlanId,
        },
      }),

      providesTags: (result, _error, { patientId, encounterId, treatmentPlanId }) => [
        {
          type: 'DialysisSession',
          id: `patient-${patientId}-encounter-${encounterId}-plan-${treatmentPlanId}`,
        },
        ...(result ?? []).map(session => ({
          type: 'DialysisSession' as const,
          id: session.id,
        })),
      ],
    }),

    getDialysisSessionById: builder.query<DialysisSession, number>({
      query: id => ({
        url: `/api/patient/dialysis-sessions/${id}`,
        method: 'GET',
      }),

      providesTags: (_result, _error, id) => [
        {
          type: 'DialysisSession',
          id,
        },
      ],
    }),

    /* Legacy: most recently modified session for patient + encounter */
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
  useGetDialysisSessionsQuery,
  useGetDialysisSessionsByTreatmentPlanQuery,
  useLazyGetDialysisSessionsByTreatmentPlanQuery,
  useGetDialysisSessionByIdQuery,
  useLazyGetDialysisSessionByIdQuery,
  useGetDialysisSessionQuery,
  useLazyGetDialysisSessionQuery,
} = dialysisSessionService;
