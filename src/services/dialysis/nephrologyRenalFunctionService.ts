import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  NephrologyRenalFunction,
  NephrologyRenalFunctionCreateDTO,
  NephrologyRenalFunctionUpdateDTO,
} from '@/types/model-types-new';

/* ===================== SERVICE ===================== */

export const nephrologyRenalFunctionService = createApi({
  reducerPath: 'nephrologyRenalFunctionApi',
  baseQuery: BaseQuery,
  tagTypes: ['NephrologyRenalFunction'],

  endpoints: builder => ({

    /* -------------------------------------------------
     * CREATE
     * ------------------------------------------------- */

    createNephrologyRenalFunction: builder.mutation<
      NephrologyRenalFunction,
      NephrologyRenalFunctionCreateDTO
    >({
      query: body => ({
        url: '/api/patient/nephrology-renal-functions',
        method: 'POST',
        body,
      }),

      invalidatesTags: ['NephrologyRenalFunction'],
    }),

    /* -------------------------------------------------
     * UPDATE
     * ------------------------------------------------- */

    updateNephrologyRenalFunction: builder.mutation<
      NephrologyRenalFunction,
      NephrologyRenalFunctionUpdateDTO
    >({
      query: body => ({
        url: '/api/patient/nephrology-renal-functions',
        method: 'PUT',
        body,
      }),

      invalidatesTags: (_result, _error, body) => [
        {
          type: 'NephrologyRenalFunction',
          id: body.id,
        },
      ],
    }),

    /* -------------------------------------------------
     * GET BY PATIENT + ENCOUNTER
     * ------------------------------------------------- */

    getNephrologyRenalFunction: builder.query<
    NephrologyRenalFunction,
    {
        patientId: number;
        encounterId: number;
    }
    >({
      query: ({ patientId, encounterId }) => ({
        url:
          '/api/patient/nephrology-renal-functions/by-patient-and-encounter',
        method: 'GET',
        params: {
          patientId,
          encounterId,
        },
      }),

      providesTags: (_result, _error, { patientId, encounterId }) => [
        {
          type: 'NephrologyRenalFunction',
          id: `patient-${patientId}-encounter-${encounterId}`,
        },
      ],
    }),

  }),
});

/* ===================== HOOKS ===================== */

export const {
  useCreateNephrologyRenalFunctionMutation,
  useUpdateNephrologyRenalFunctionMutation,
  useGetNephrologyRenalFunctionQuery,
  useLazyGetNephrologyRenalFunctionQuery,
} = nephrologyRenalFunctionService;
