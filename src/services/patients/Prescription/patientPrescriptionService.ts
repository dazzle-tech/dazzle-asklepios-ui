import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import {PatientPrescription, PatientPrescriptionCreateVM, PatientPrescriptionUpdateVM} from '@/types/model-types-new';

export interface PatientPrescriptionListParams {
  patientId?: number;
  encounterId?: number;
  status?: string;
  urgencyLevel?: string;
  prescriptionNum?: number;
  includeCanceled?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export const patientPrescriptionService = createApi({
  reducerPath: 'patientPrescriptionApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientPrescription'],
  endpoints: (builder) => ({
    // POST /api/patient/patient-prescriptions/create-or-get
    createOrGetPatientPrescription: builder.mutation<
      PatientPrescription,
      PatientPrescriptionCreateVM
    >({
      query: (body) => ({
        url: '/api/patient/patient-prescriptions/create-or-get',
        method: 'POST',
        body,
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      invalidatesTags: ['PatientPrescription'],
    }),

    // GET /api/patient/patient-prescriptions
    getPatientPrescription: builder.query<
      PatientPrescription[],
      PatientPrescriptionListParams
    >({
      query: (params) => ({
        url: '/api/patient/patient-prescriptions',
        method: 'GET',
        params,
      }),
      onQueryStarted,
      transformResponse: (response: any) => {
        // Handle paginated response if needed
        return Array.isArray(response) ? response : response?.content || response || [];
      },
      providesTags: ['PatientPrescription'],
    }),

    // GET /api/patient/patient-prescriptions/{id}
    getPatientPrescriptionById: builder.query<PatientPrescription, number>({
      query: (id) => ({
        url: `/api/patient/patient-prescriptions/${id}`,
        method: 'GET',
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      providesTags: (_res, _err, id) => [{ type: 'PatientPrescription', id }],
    }),

    // POST /api/patient/patient-prescriptions
    createPatientPrescription: builder.mutation<
      PatientPrescription,
      PatientPrescriptionCreateVM
    >({
      query: (body) => ({
        url: '/api/patient/patient-prescriptions',
        method: 'POST',
        body,
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      invalidatesTags: ['PatientPrescription'],
    }),

    // PUT /api/patient/patient-prescriptions/{id}
    updatePatientPrescription: builder.mutation<
      PatientPrescription,
      { id: number; body: PatientPrescriptionUpdateVM }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/patient-prescriptions/${id}`,
        method: 'PUT',
        body,
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientPrescription', id },
        'PatientPrescription',
      ],
    }),

    // POST /api/patient/patient-prescriptions/{id}/submit
    submitPatientPrescription: builder.mutation<
     PatientPrescription,
      { id: number }
    >({
      query: ({ id }) => ({
        url: `/api/patient/patient-prescriptions/${id}/submit`,
        method: 'POST'
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientPrescription', id },
        'PatientPrescription',
      ],
    }),

    // POST /api/patient/patient-prescriptions/{id}/cancel
    cancelPatientPrescription: builder.mutation<
      PatientPrescription,
      { id: number }
    >({
      query: ({ id}) => ({
        url: `/api/patient/patient-prescriptions/${id}/cancel`,
        method: 'POST',
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientPrescription', id },
        'PatientPrescription',
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useCreateOrGetPatientPrescriptionMutation,
  useGetPatientPrescriptionByIdQuery,
  useGetPatientPrescriptionQuery,
  useUpdatePatientPrescriptionMutation,
  useSubmitPatientPrescriptionMutation,
  useCancelPatientPrescriptionMutation,
} = patientPrescriptionService;
