import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import { PatientPrescription } from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';

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


export const patientPrescriptionService = createApi({
  reducerPath: 'patientPrescriptionApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientPrescription'],
  endpoints: (builder) => ({
    // POST /api/patient/patient-prescriptions/create-or-get
    createOrGetPatientPrescription: builder.mutation<
      PatientPrescription,
      PatientPrescription
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
      PagedResult<PatientPrescription>,
      PatientPrescriptionListParams
    >({
      query: (params) => ({
        url: `/api/patient/patient-prescriptions`,
        params,
      }),

      transformResponse: (
        response: PatientPrescription[],
        meta
      ): PagedResult<PatientPrescription> => {
        const headers = meta?.response?.headers;

        return {
          data: response,
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },

      providesTags: () => ['PatientPrescription'],
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
      PatientPrescription
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
      { id: number; body: PatientPrescription }
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
      { id: number; acceptUncoveredAsCash?: boolean }
    >({
      query: ({ id, acceptUncoveredAsCash }) => ({
        url: `/api/patient/patient-prescriptions/${id}/submit`,
        method: 'POST',
        params: acceptUncoveredAsCash ? { acceptUncoveredAsCash: true } : undefined
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
      query: ({ id }) => ({
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

    getPrescriptionPdf: builder.query<Blob,{ prescriptionId: number; lang?: string }
    >({
      query: ({ prescriptionId, lang = 'en' }) => ({
        url: `/api/analytics/prescriptions/${prescriptionId}/pdf`,
        method: 'GET',
        params: {
          lang
        },
        responseHandler: (response) => response.blob()
      })
    })
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
  useGetPrescriptionPdfQuery,
  useLazyGetPrescriptionPdfQuery
} = patientPrescriptionService;
