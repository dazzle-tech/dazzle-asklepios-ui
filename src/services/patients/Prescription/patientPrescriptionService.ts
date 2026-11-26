import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import { PatientPrescription } from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';

/** Send status of a submitted prescription at Nahdi (GET /api/patient/nahdi/prescriptions/{id}/sync-status). */
export type NahdiSyncStatus = {
  hasUnsentChanges: boolean;
  lastSentAt?: string | null;
  lastAttemptStatus?: 'SUCCESS' | 'FAILED' | null;
  lastAttemptAt?: string | null;
  orderNumber?: string | null;
  // Technical reason of the last failure (for IT, shown as a hint).
  failureReason?: string | null;
  // What the doctor is told about the last failure.
  failureMessage?: string | null;
  // True when the failure is in the prescription data (the doctor can fix it).
  failureDataError?: boolean;
  integrationEnabled: boolean;
};

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

    // POST /api/patient/nahdi/prescriptions/{id}/dispensing-status/refresh : which medications the pharmacy dispensed
    refreshNahdiDispensingStatus: builder.mutation<
      { refreshed: boolean; message?: string | null; checkedAt?: string; dispensedMedicationIds: number[] },
      number
    >({
      query: (id) => ({
        url: `/api/patient/nahdi/prescriptions/${id}/dispensing-status/refresh`,
        method: 'POST'
      }),
      transformResponse: (response: any) => response
    }),

    // GET /api/patient/patient-prescriptions/edit-after-submit-access : may the current user change a submitted prescription
    getPrescriptionEditAfterSubmitAccess: builder.query<{ allowed: boolean }, void>({
      query: () => ({
        url: `/api/patient/patient-prescriptions/edit-after-submit-access`
      }),
      transformResponse: (response: any) => response
    }),

    // GET /api/patient/nahdi/prescriptions/{id}/sync-status : changes made after the last successful send to Nahdi
    getNahdiSyncStatus: builder.query<NahdiSyncStatus, number>({
      query: (id) => ({
        url: `/api/patient/nahdi/prescriptions/${id}/sync-status`
      }),
      transformResponse: (response: any) => response
    }),

    // POST /api/patient/nahdi/prescriptions/{id}/resend : sends the edited submitted prescription to Nahdi again
    resendPrescriptionToNahdi: builder.mutation<
      {
        status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
        orderNumber?: string | null;
        // For the doctor when not accepted; `detail` is the technical reason.
        message?: string | null;
        detail?: string | null;
      },
      number
    >({
      query: (id) => ({
        url: `/api/patient/nahdi/prescriptions/${id}/resend`,
        method: 'POST'
      }),
      onQueryStarted,
      transformResponse: (response: any) => response
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
  useLazyGetPatientPrescriptionQuery,
  useUpdatePatientPrescriptionMutation,
  useSubmitPatientPrescriptionMutation,
  useResendPrescriptionToNahdiMutation,
  useGetNahdiSyncStatusQuery,
  useLazyGetNahdiSyncStatusQuery,
  useGetPrescriptionEditAfterSubmitAccessQuery,
  useRefreshNahdiDispensingStatusMutation,
  useCancelPatientPrescriptionMutation,
  useGetPrescriptionPdfQuery,
  useLazyGetPrescriptionPdfQuery
} = patientPrescriptionService;
