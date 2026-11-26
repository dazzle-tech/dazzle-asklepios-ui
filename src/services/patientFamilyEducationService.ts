import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery as baseQuery, onQueryStarted } from '../newApi';
import type { PatientFamilyEducation } from '@/types/model-types-new';

export const patientFamilyEducationService = createApi({
  reducerPath: 'patientFamilyEducationApi',
  baseQuery: baseQuery,
  tagTypes: ['PatientFamilyEducation'],
  endpoints: builder => ({
    getLatestPatientFamilyEducation: builder.query<PatientFamilyEducation | null, number>({
      query: encounterId => ({
        url: `/api/patient/patient-family-educations/latest-by-encounter/${encounterId}`
      }),
      transformResponse: (response: PatientFamilyEducation[] | PatientFamilyEducation | null) => {
        if (Array.isArray(response)) return response[0] ?? null;
        return response ?? null;
      },
      providesTags: ['PatientFamilyEducation']
    }),

    savePatientFamilyEducation: builder.mutation<
      PatientFamilyEducation,
      {
        id?: number | null;
        patientId: number;
        encounterId: number;
        topic: string;
        method?: 'VERBAL' | 'WRITTEN' | 'DEMONSTRATION' | 'VIDEO' | 'HANDOUT' | null;
        effectiveness?: string | null;
      }
    >({
      query: body => ({
        url: '/api/patient/patient-family-educations',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['PatientFamilyEducation'],
      onQueryStarted
    })
  })
});

export const {
  useGetLatestPatientFamilyEducationQuery,
  useSavePatientFamilyEducationMutation
} = patientFamilyEducationService;
