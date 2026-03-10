import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

export const patientDiagnosisService = createApi({
  reducerPath: 'patientDiagnosisApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientDiagnosis'],
  endpoints: builder => ({
    createPatientDiagnosis: builder.mutation<
      modelTypes.PatientDiagnosis,
      modelTypes.PatientDiagnosis
    >({
      query: data => ({
        url: `/api/patient/patient-diagnoses`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PatientDiagnosis'],
    }),

    updatePatientDiagnosis: builder.mutation<
      modelTypes.PatientDiagnosis,
      { id: Id; data: modelTypes.PatientDiagnosis }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/patient-diagnoses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientDiagnosis', id },
        'PatientDiagnosis',
      ],
    }),

    getLatestPatientDiagnosis: builder.query<
      modelTypes.PatientDiagnosis,
      { encounterId: Id; timestamp?: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/patient-diagnoses/latest`,
        params: { encounterId },
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'PatientDiagnosis', id: `latest-${encounterId}` },
        'PatientDiagnosis',
      ],
    }),

    getPrimaryByEncounterId: builder.query<
      modelTypes.PatientDiagnosis,
      { encounterId: Id; timestamp?: number }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/patient-diagnoses/by-encounter/${encounterId}/primary`,
        params: { encounterId },
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'PatientDiagnosis', id: `primary-${encounterId}` },
        'PatientDiagnosis',
      ],
    }),

    getPatientDiagnosesByPatientId: builder.query<
      modelTypes.PatientDiagnosis[],
      { patientId: Id; page?: number; size?: number; sort?: string; timestamp?: number }
    >({
      query: ({ patientId, page = 0, size = 20, sort = 'createdDate,desc' }) => ({
        url: `/api/patient/patient-diagnoses/patient/${patientId}`,
        params: { page, size, sort },
      }),
      providesTags: (_res, _err, { patientId }) => [
        { type: 'PatientDiagnosis', id: `patient-${patientId}` },
        'PatientDiagnosis',
      ],
    }),
    getPatientDiagnosesByEncounterId: builder.query<
  modelTypes.PatientDiagnosis[],
  { encounterId: Id; timestamp?: number }
>({
  query: ({ encounterId }) => ({
    url: `/api/patient/patient-diagnoses/by-encounter/${encounterId}`,
  }),
  providesTags: (_res, _err, { encounterId }) => [
    { type: 'PatientDiagnosis', id: `encounter-${encounterId}` },
    'PatientDiagnosis',
  ],
}),

getPrimaryPatientDiagnosisByEncounterId: builder.query<
  modelTypes.PatientDiagnosis,
  { encounterId: Id; timestamp?: number }
>({
  query: ({ encounterId }) => ({
    url: `/api/patient/patient-diagnoses/by-encounter/${encounterId}/primary`,
  }),
  providesTags: (_res, _err, { encounterId }) => [
    { type: 'PatientDiagnosis', id: `primary-${encounterId}` },
    'PatientDiagnosis',
  ],
}),
    existsPatientDiagnosisByEncounterId: builder.query<
      boolean,
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/patient-diagnosis/exists/${encounterId}`,
        method: 'GET',
      }),
    }),

hardDeletePatientDiagnosis: builder.mutation<void, { id: Id }>({
  query: ({ id }) => ({
    url: `/api/patient/patient-diagnoses/${id}/hard`,
    method: 'DELETE',
  }),
  invalidatesTags: ['PatientDiagnosis'],
}),
  }),
});

export const {
  useCreatePatientDiagnosisMutation,
  useUpdatePatientDiagnosisMutation,
  useGetLatestPatientDiagnosisQuery,
  useLazyGetLatestPatientDiagnosisQuery,
  useGetPatientDiagnosesByPatientIdQuery,
  useLazyGetPatientDiagnosesByPatientIdQuery,

  useGetPatientDiagnosesByEncounterIdQuery,
  useLazyGetPatientDiagnosesByEncounterIdQuery,

  useGetPrimaryPatientDiagnosisByEncounterIdQuery,
  useLazyGetPrimaryPatientDiagnosisByEncounterIdQuery,

  useHardDeletePatientDiagnosisMutation,
    useExistsPatientDiagnosisByEncounterIdQuery,
  useLazyExistsPatientDiagnosisByEncounterIdQuery,
  useGetPrimaryByEncounterIdQuery

} = patientDiagnosisService;