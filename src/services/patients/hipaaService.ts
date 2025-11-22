import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { PatientHIPAA } from '@/types/model-types-new';

export const hipaaService = createApi({
  reducerPath: 'hipaaApi',
  baseQuery: BaseQuery,
  tagTypes: ['Hipaa'],

  endpoints: builder => ({
    /**
     * GET HIPAA by patientId
     */
    getPatientHIPAA: builder.query<PatientHIPAA | null, { patientId: number }>({
      query: ({ patientId }) => ({
        url: `/api/patient/hipaa/${patientId}`,
        method: 'GET'
      }),
      transformResponse: (response: PatientHIPAA) => response ?? null,
      providesTags: (_res, _err, { patientId }) => [{ type: 'Hipaa', id: patientId }]
    }),

    /**
     * CREATE HIPAA
     */
    createPatientHIPAA: builder.mutation<PatientHIPAA, { body: PatientHIPAA }>({
      query: ({ body }) => ({
        url: `/api/patient/hipaa`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_res, _err, { body }) => [
        { type: 'Hipaa', id: body.patientId }
      ]
    }),

    /**
     * UPDATE HIPAA by patientId
     */
    updatePatientHIPAA: builder.mutation<PatientHIPAA, { patientId: number; body: PatientHIPAA } >({
      query: ({ patientId, body }) => ({
        url: `/api/patient/hipaa/${patientId}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'Hipaa', id: patientId }
      ]
    })
  })
});

export const {
  useGetPatientHIPAAQuery,
  useLazyGetPatientHIPAAQuery,
  useCreatePatientHIPAAMutation,
  useUpdatePatientHIPAAMutation
} = hipaaService;
