import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NephrologyTreatmentPlan,
  NephrologyTreatmentPlanCreateDTO,
  NephrologyTreatmentPlanUpdateDTO,
} from '@/types/model-types-new';

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

type FindTreatmentPlansParams = {
  patientId: number;
  encounterId?: number;
  page?: number;
  size?: number;
  sort?: string;
};

/* ===================== SERVICE ===================== */

export const nephrologyTreatmentPlanService = createApi({
  reducerPath: 'nephrologyTreatmentPlanApi',
  baseQuery: BaseQuery,
  tagTypes: ['NephrologyTreatmentPlan'],

  endpoints: builder => ({

    /* -------------------------------------------------
     * CREATE
     * ------------------------------------------------- */

    createNephrologyTreatmentPlan: builder.mutation<
      NephrologyTreatmentPlan,
      NephrologyTreatmentPlanCreateDTO
    >({
      query: body => ({
        url: '/api/patient/nephrology-treatment-plans',
        method: 'POST',
        body,
      }),

      invalidatesTags: ['NephrologyTreatmentPlan'],
    }),

    /* -------------------------------------------------
     * UPDATE
     * ------------------------------------------------- */

    updateNephrologyTreatmentPlan: builder.mutation<
      NephrologyTreatmentPlan,
      NephrologyTreatmentPlanUpdateDTO
    >({
      query: body => ({
        url: '/api/patient/nephrology-treatment-plans',
        method: 'PUT',
        body,
      }),

      invalidatesTags: (_result, _error, body) => [
        {
          type: 'NephrologyTreatmentPlan',
          id: body.id,
        },
        'NephrologyTreatmentPlan',
      ],
    }),

    /* -------------------------------------------------
     * LIST BY PATIENT
     * ------------------------------------------------- */

    getNephrologyTreatmentPlansByPatient: builder.query<
      PagedResult<NephrologyTreatmentPlan>,
      FindTreatmentPlansParams
    >({
      query: ({
        patientId,
        encounterId,
        page = 0,
        size = 20,
        sort = 'createdDate,desc',
      }) => ({
        url: '/api/patient/nephrology-treatment-plans',
        method: 'GET',
        params: {
          patientId,
          ...(encounterId != null ? { encounterId } : {}),
          page,
          size,
          sort,
        },
      }),

      transformResponse: (
        response: NephrologyTreatmentPlan[],
        meta
      ): PagedResult<NephrologyTreatmentPlan> => {
        const totalCount =
          Number(meta?.response?.headers.get('X-Total-Count')) ||
          response?.length ||
          0;

        return {
          data: response ?? [],
          totalCount,
        };
      },

      providesTags: (result, _error, { patientId }) => [
        {
          type: 'NephrologyTreatmentPlan',
          id: `patient-${patientId}`,
        },
        ...(result?.data ?? []).map(plan => ({
          type: 'NephrologyTreatmentPlan' as const,
          id: plan.id,
        })),
      ],
    }),

    /* -------------------------------------------------
     * GET BY ID
     * ------------------------------------------------- */

    getNephrologyTreatmentPlanById: builder.query<
      NephrologyTreatmentPlan,
      number
    >({
      query: id => ({
        url: `/api/patient/nephrology-treatment-plans/${id}`,
        method: 'GET',
      }),

      providesTags: (_result, _error, id) => [
        {
          type: 'NephrologyTreatmentPlan',
          id,
        },
      ],
    }),

    /* -------------------------------------------------
     * GET BY PATIENT + ENCOUNTER (legacy single record)
     * ------------------------------------------------- */

    getNephrologyTreatmentPlan: builder.query<
    NephrologyTreatmentPlan,
    {
        patientId: number;
        encounterId: number;
    }
    >({
      query: ({ patientId, encounterId }) => ({
        url:
          '/api/patient/nephrology-treatment-plans/by-patient-and-encounter',
        method: 'GET',
        params: {
          patientId,
          encounterId,
        },
      }),

      providesTags: (_result, _error, { patientId, encounterId }) => [
        {
          type: 'NephrologyTreatmentPlan',
          id: `patient-${patientId}-encounter-${encounterId}`,
        },
      ],
    }),

  }),
});

/* ===================== HOOKS ===================== */

export const {
  useCreateNephrologyTreatmentPlanMutation,
  useUpdateNephrologyTreatmentPlanMutation,
  useGetNephrologyTreatmentPlansByPatientQuery,
  useGetNephrologyTreatmentPlanByIdQuery,
  useLazyGetNephrologyTreatmentPlanByIdQuery,
  useGetNephrologyTreatmentPlanQuery,
  useLazyGetNephrologyTreatmentPlanQuery,
} = nephrologyTreatmentPlanService;
