import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import {
  PatientPrescriptionMedication,
  PrescriptionMedicationCreate,
  PrescriptionMedicationUpdate,
} from '@/types/model-types-new';

export interface PatientPrescriptionMedicationListParams {
  prescriptionHeaderId: number;
  page?: number;
  size?: number;
  sort?: string;
}

export const patientPrescriptionMedicationService = createApi({
  reducerPath: 'patientPrescriptionMedicationApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientPrescriptionMedication'],
  endpoints: (builder) => ({
    // GET /api/patient/patient-prescription-medications
    getPatientPrescriptionMedications: builder.query<
      { data: PatientPrescriptionMedication[]; totalCount: number },
      PatientPrescriptionMedicationListParams
    >({
      query: (params) => ({
        url: '/api/patient/patient-prescription-medications',
        method: 'GET',
        params,
      }),
      onQueryStarted,
      transformResponse: (response: any, meta) => {
        // Handle paginated response - Spring returns array with total count in headers
        const headers = meta?.response?.headers;
        const totalCount = headers?.get('X-Total-Count');
        
        // Store total count in response for pagination
        const data = Array.isArray(response) ? response : response?.content || response || [];
        return { data, totalCount: totalCount ? Number(totalCount) : data.length };
      },
      providesTags: ['PatientPrescriptionMedication'],
    }),

    // GET /api/patient/patient-prescription-medications/{id}
    getPatientPrescriptionMedicationById: builder.query<PatientPrescriptionMedication, number>({
      query: (id) => ({
        url: `/api/patient/patient-prescription-medications/${id}`,
        method: 'GET',
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      providesTags: (_res, _err, id) => [{ type: 'PatientPrescriptionMedication', id }],
    }),

    // POST /api/patient/patient-prescription-medications
    createPatientPrescriptionMedication: builder.mutation<
      PatientPrescriptionMedication,
      PrescriptionMedicationCreate
    >({
      query: (body) => ({
        url: '/api/patient/patient-prescription-medications',
        method: 'POST',
        body,
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      invalidatesTags: ['PatientPrescriptionMedication'],
    }),

    // PUT /api/patient/patient-prescription-medications/{id}
    updatePatientPrescriptionMedication: builder.mutation<
      PatientPrescriptionMedication,
      { id: number; body: PrescriptionMedicationUpdate }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/patient-prescription-medications/${id}`,
        method: 'PUT',
        body,
      }),
      onQueryStarted,
      transformResponse: (response: any) => response,
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientPrescriptionMedication', id },
        'PatientPrescriptionMedication',
      ],
    }),

    // DELETE /api/patient/patient-prescription-medications/{id}
    deletePatientPrescriptionMedication: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/patient/patient-prescription-medications/${id}`,
        method: 'DELETE',
      }),
      onQueryStarted,
      invalidatesTags: (_res, _err, id) => [
        { type: 'PatientPrescriptionMedication', id },
        'PatientPrescriptionMedication',
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetPatientPrescriptionMedicationsQuery,
  useGetPatientPrescriptionMedicationByIdQuery,
  useCreatePatientPrescriptionMedicationMutation,
  useUpdatePatientPrescriptionMedicationMutation,
  useDeletePatientPrescriptionMedicationMutation,
} = patientPrescriptionMedicationService;
