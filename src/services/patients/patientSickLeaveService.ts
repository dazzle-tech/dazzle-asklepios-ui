import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';

export type PatientSickLeaveCreateDTO = {
  encounterId: number;
  startDate: string;
  endDate: string;
  notes?: string;
  language?: string;
};

export type PatientSickLeave = PatientSickLeaveCreateDTO & {
  id: number;
  patientId: number;
};

export const patientSickLeaveService = createApi({
  reducerPath: 'patientSickLeaveApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientSickLeave'],
  endpoints: builder => ({
    // POST /api/patient/sick-leaves
    createPatientSickLeave: builder.mutation<PatientSickLeave, PatientSickLeaveCreateDTO>({
      query: body => ({
        url: '/api/patient/sick-leaves',
        method: 'POST',
        body,
      }),
      onQueryStarted,
      invalidatesTags: ['PatientSickLeave'],
    }),
  }),
});

export const { useCreatePatientSickLeaveMutation } = patientSickLeaveService;
