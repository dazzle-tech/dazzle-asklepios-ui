import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NephrologyKidneyAssessment,
  NephrologyKidneyAssessmentCreateDTO,
  NephrologyKidneyAssessmentUpdateDTO,
} from '@/types/model-types-new';

/* ===================== SERVICE ===================== */

export const nephrologyKidneyAssessmentService = createApi({
  reducerPath: 'nephrologyKidneyAssessmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['NephrologyKidneyAssessment'],

  endpoints: builder => ({

    /* -------------------------------------------------
     * CREATE
     * ------------------------------------------------- */

    createNephrologyKidneyAssessment: builder.mutation<
      NephrologyKidneyAssessment,
      NephrologyKidneyAssessmentCreateDTO
    >({
      query: body => ({
        url: '/api/patient/nephrology-kidney-assessments',
        method: 'POST',
        body,
      }),

      invalidatesTags: ['NephrologyKidneyAssessment'],
    }),

    /* -------------------------------------------------
     * UPDATE
     * ------------------------------------------------- */

    updateNephrologyKidneyAssessment: builder.mutation<
      NephrologyKidneyAssessment,
      NephrologyKidneyAssessmentUpdateDTO
    >({
      query: body => ({
        url: '/api/patient/nephrology-kidney-assessments',
        method: 'PUT',
        body,
      }),

      invalidatesTags: (_result, _error, body) => [
        {
          type: 'NephrologyKidneyAssessment',
          id: body.id,
        },
      ],
    }),

    /* -------------------------------------------------
     * GET BY PATIENT + ENCOUNTER
     * ------------------------------------------------- */

    getNephrologyKidneyAssessment: builder.query<
    NephrologyKidneyAssessment,
    {
        patientId: number;
        encounterId: number;
    }
    >({
      query: ({ patientId, encounterId }) => ({
        url:
          '/api/patient/nephrology-kidney-assessments/by-patient-and-encounter',
        method: 'GET',
        params: {
          patientId,
          encounterId,
        },
      }),

      providesTags: (_result, _error, { patientId, encounterId }) => [
        {
          type: 'NephrologyKidneyAssessment',
          id: `patient-${patientId}-encounter-${encounterId}`,
        },
      ],
    }),

  }),
});

/* ===================== HOOKS ===================== */

export const {
  useCreateNephrologyKidneyAssessmentMutation,
  useUpdateNephrologyKidneyAssessmentMutation,
  useGetNephrologyKidneyAssessmentQuery,
  useLazyGetNephrologyKidneyAssessmentQuery,
} = nephrologyKidneyAssessmentService;