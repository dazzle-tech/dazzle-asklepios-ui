import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import {
  PatientProcedure,
  PatientProcedureCreateVM,
  PatientProcedureUpdateVM,
  PatientProcedureCancelVM
} from '@/types/model-types-new';

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

export const patientProcedureService = createApi({
  reducerPath: 'patientProcedureApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientProcedure'],

  endpoints: builder => ({
    // ------------------
    // CREATE
    // ------------------
    createProcdure: builder.mutation<PatientProcedure, PatientProcedureCreateVM>({
      query: body => ({
        url: '/api/patient/procedure',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    // ------------------
    // UPDATE
    // ------------------
    updateProcdure: builder.mutation<PatientProcedure, PatientProcedureUpdateVM>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/procedure/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    // ------------------
    // CANCEL
    // ------------------
    cancelProcdure: builder.mutation<PatientProcedure, PatientProcedureCancelVM>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/procedure/${id}/cancel`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['PatientProcedure']
    }),

    // ------------------
    // FIND BY ENCOUNTER
    // ------------------
    findProcdureByEncounter: builder.query<
      PagedResult<PatientProcedure>,
      {
        encounterId: number;
        page?: number;
        size?: number;
        includeCancelled?: boolean;
      }
    >({
      query: ({ encounterId, page = 0, size = 20, includeCancelled = false }) => ({
        url: `/api/patient/procedure/by-encounter/${encounterId}`,
        params: { page, size, includeCancelled }
      }),

      transformResponse: (response: PatientProcedure[], meta): PagedResult<PatientProcedure> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['PatientProcedure']
    }),

    findProcduresByPatient: builder.query<
      PagedResult<PatientProcedure>,
      {
        patientId: number;
        page?: number;
        size?: number;
        includeCancelled?: boolean;
      }
    >({
      query: ({ patientId, page = 0, size = 20, includeCancelled = false }) => ({
        url: `/api/patient/procedure/by-patient/${patientId}`,
        params: { page, size, includeCancelled }
      }),

      transformResponse: (response: PatientProcedure[], meta): PagedResult<PatientProcedure> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['PatientProcedure']
    })
  })
});

export const {
  useCreateProcdureMutation,
  useUpdateProcdureMutation,
  useCancelProcdureMutation,
  useFindProcdureByEncounterQuery,
  useFindProcduresByPatientQuery
} = patientProcedureService;
