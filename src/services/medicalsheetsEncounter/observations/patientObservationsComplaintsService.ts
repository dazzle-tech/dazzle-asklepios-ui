import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import type { PatientObservationsComplaints } from '@/types/model-types-new';

type Id = number | string;

export type PatientObservationsComplaintsCreateDTO = Omit<
  PatientObservationsComplaints,
  'id' | 'createdDate' | 'lastModifiedDate'
>;

export type PatientObservationsComplaintsUpdateDTO = PatientObservationsComplaintsCreateDTO;

export const patientObservationsComplaintsService = createApi({
  reducerPath: 'newPatientObservationsComplaintsApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientObservationsComplaints'],
  endpoints: builder => ({
    createPatientObservationsComplaints: builder.mutation<
      PatientObservationsComplaints,
      PatientObservationsComplaintsCreateDTO
    >({
      query: body => ({
        url: '/api/patient/observations-complaints',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientObservationsComplaints']
    }),

    updatePatientObservationsComplaints: builder.mutation<
      PatientObservationsComplaints,
      { id: Id } & PatientObservationsComplaintsUpdateDTO
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/observations-complaints/${encodeURIComponent(String(id))}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['PatientObservationsComplaints']
    }),

    getLatestPatientObservationsComplaintsByEncounterId: builder.query<
      PatientObservationsComplaints,
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/observations-complaints/latest/encounter/${encodeURIComponent(
          String(encounterId)
        )}`
      }),
      providesTags: ['PatientObservationsComplaints']
    })
  })
});

export const {
  useCreatePatientObservationsComplaintsMutation,
  useUpdatePatientObservationsComplaintsMutation,
  useGetLatestPatientObservationsComplaintsByEncounterIdQuery,
  useLazyGetLatestPatientObservationsComplaintsByEncounterIdQuery
} = patientObservationsComplaintsService;
