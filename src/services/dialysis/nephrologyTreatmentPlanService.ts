import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NephrologyTreatmentPlan,
  NephrologyTreatmentPlanCreateDTO,
  NephrologyTreatmentPlanUpdateDTO,
} from '@/types/model-types-new';

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
      ],
    }),

    /* -------------------------------------------------
     * GET BY PATIENT + ENCOUNTER
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
  useGetNephrologyTreatmentPlanQuery,
  useLazyGetNephrologyTreatmentPlanQuery,
} = nephrologyTreatmentPlanService;
