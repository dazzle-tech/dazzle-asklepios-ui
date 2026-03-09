import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import {
  PatientPrescriptionMedication
} from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';

export interface PatientPrescriptionMedicationListParams {
  prescriptionHeaderId: number;
  page?: number;
  size?: number;
  sort?: string;
  timestamp?: number
}


type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };

export const patientPrescriptionMedicationService = createApi({
  reducerPath: 'patientPrescriptionMedicationApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientPrescriptionMedication'],
  endpoints: (builder) => ({
    // GET /api/patient/patient-prescription-medications
    getPatientPrescriptionMedications: builder.query<PagedResult<PatientPrescriptionMedication>, PatientPrescriptionMedicationListParams>({
          query: ({prescriptionHeaderId, page, size, sort = 'id,asc' }) => ({
            url: `/api/patient/patient-prescription-medications?prescriptionHeaderId=${prescriptionHeaderId}`,
            params: { page, size, sort },
          }),
          transformResponse: (response: PatientPrescriptionMedication[], meta): PagedResult<PatientPrescriptionMedication> => {
            const headers = meta?.response?.headers;
            return {
              data: response,
              totalCount: Number(headers?.get('X-Total-Count') ?? 0),
              links: parseLinkHeader(headers?.get('Link')),
            };
          },
          providesTags: (_res) => ['PatientPrescriptionMedication'],
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
      PatientPrescriptionMedication
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
      { id: number; body: PatientPrescriptionMedication }
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

    getAllChronicRaw: builder.query<
          PagedResult<PatientPrescriptionMedication>,
          { patientId: number } & PagedParams
        >({
          query: ({ patientId, page, size, sort = 'id,asc' }) => ({
            url: `/api/patient/patient-prescription-medications/${patientId}/chronic-medications/raw`,
            params: { page, size, sort },
          }),
          transformResponse: (response: PatientPrescriptionMedication[], meta): PagedResult<PatientPrescriptionMedication> => {
            const headers = meta?.response?.headers;
            return {
              data: response,
              totalCount: Number(headers?.get('X-Total-Count') ?? 0),
              links: parseLinkHeader(headers?.get('Link')),
            };
          },
          providesTags: ['PatientPrescriptionMedication'],
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
  useGetAllChronicRawQuery
} = patientPrescriptionMedicationService;
