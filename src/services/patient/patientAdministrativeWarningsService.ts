import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

export const patientAdministrativeWarningsService = createApi({
  reducerPath: 'patientAdministrativeWarningsApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientAdministrativeWarnings'],
  endpoints: builder => ({

    // ============================
    // 🔹 GET ALL BY PATIENT ID
    // ============================
    getWarningsByPatientId: builder.query<
      modelTypes.PatientAdministrativeWarningsResponseVM[],
      { patientId: Id }
    >({
      query: ({ patientId }) => ({
        url: `/api/patient/patient-administrative-warnings/patient/${patientId}`,
        method: 'GET'
      }),
      providesTags: (result, _err, { patientId }) =>
        result
          ? [
              ...result.map(w => ({
                type: 'PatientAdministrativeWarnings' as const,
                id: w.id
              })),
              { type: 'PatientAdministrativeWarnings', id: `PATIENT_${patientId}` }
            ]
          : [{ type: 'PatientAdministrativeWarnings', id: `PATIENT_${patientId}` }]
    }),

    // ============================
    // 🔹 SEARCH BY PATIENT + TEXT
    // ============================
    searchWarningsByPatientId: builder.query<
      modelTypes.PatientAdministrativeWarningsResponseVM[],
      { patientId: Id; searchText?: string }
    >({
      query: ({ patientId, searchText }) => ({
        url: `/api/patient/patient-administrative-warnings/patient/${patientId}/search`,
        method: 'GET',
        params: { searchText }
      }),
      providesTags: (_res, _err, { patientId }) => [
        { type: 'PatientAdministrativeWarnings', id: `PATIENT_${patientId}` }
      ]
    }),

    // ============================
    // 🔹 GET ALL BY TYPES
    // ============================
    getWarningsByTypes: builder.query<
      modelTypes.PatientAdministrativeWarningsResponseVM[],
      { types?: string[] }
    >({
      query: ({ types }) => ({
        url: '/api/patient/patient-administrative-warnings',
        method: 'GET',
        params: { types }
      }),
      providesTags: (_res, _err, { types }) => [
        {
          type: 'PatientAdministrativeWarnings',
          id: types && types.length ? `TYPES_${types.join(',')}` : 'ALL'
        }
      ]
    }),

    // ============================
    // 🔹 CREATE
    // ============================
    createPatientAdministrativeWarning: builder.mutation<
      modelTypes.PatientAdministrativeWarningsResponseVM,
      modelTypes.PatientAdministrativeWarningsCreateDTO
    >({
      query: body => ({
        url: '/api/patient/patient-administrative-warnings',
        method: 'POST',
        body
      }),
      invalidatesTags: (_res, _err, body) => [
        { type: 'PatientAdministrativeWarnings', id: `PATIENT_${body.patientId}` }
      ]
    }),

    // ============================
    // 🔹 RESOLVE
    // ============================
    resolvePatientAdministrativeWarning: builder.mutation<
      modelTypes.PatientAdministrativeWarningsResponseVM,
      { id: Id; body: modelTypes.PatientAdministrativeWarningsResolveDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/patient-administrative-warnings/${id}/resolve`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientAdministrativeWarnings', id }
      ]
    }),

    // ============================
    // 🔹 UNDO RESOLVE
    // ============================
    undoResolvePatientAdministrativeWarning: builder.mutation<
      modelTypes.PatientAdministrativeWarningsResponseVM,
      { id: Id; body: modelTypes.PatientAdministrativeWarningsUndoResolveDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/patient-administrative-warnings/${id}/undo-resolve`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientAdministrativeWarnings', id }
      ]
    }),

    // ============================
    // 🔹 HARD DELETE
    // ============================
    deletePatientAdministrativeWarning: builder.mutation<
      void,
      { id: Id; patientId: Id }
    >({
      query: ({ id }) => ({
        url: `/api/patient/patient-administrative-warnings/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'PatientAdministrativeWarnings', id: `PATIENT_${patientId}` }
      ]
    })

  })
});

export const {
  useGetWarningsByPatientIdQuery,
  useLazyGetWarningsByPatientIdQuery,

  useSearchWarningsByPatientIdQuery,
  useLazySearchWarningsByPatientIdQuery,

  useGetWarningsByTypesQuery,
  useLazyGetWarningsByTypesQuery,

  useCreatePatientAdministrativeWarningMutation,
  useResolvePatientAdministrativeWarningMutation,
  useUndoResolvePatientAdministrativeWarningMutation,
  useDeletePatientAdministrativeWarningMutation
} = patientAdministrativeWarningsService;
