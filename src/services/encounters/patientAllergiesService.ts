import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import {
  PatientAllergiesCreateDTO,
  PatientAllergiesResponseVM,
  PatientAllergiesUpdateDTO,
} from '@/types/model-types-new';

/* ---------- Types ---------- */
type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  showCancelled?: boolean;
};

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

/* ---------- API ---------- */
export const patientAllergiesService = createApi({
  reducerPath: 'patientAllergiesApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientAllergies'],
  endpoints: (builder) => ({

    /* =========================
     * GET /api/patient-allergies
     * ========================= */
   getPatientAllergiesByPatientId: builder.query<
  PagedResult<PatientAllergiesResponseVM>,
  {
    patientId: number;
    page?: number;
    size?: number;
    sort?: string;
    showCancelled?: boolean;
  }
>({
  query: ({ patientId, page, size, sort = 'id,desc', showCancelled = false }) => ({
    url: `/api/patient/patient-allergies/by-patient/${patientId}`,
    params: { page, size, sort, showCancelled },
  }),
  transformResponse: (
    response: PatientAllergiesResponseVM[],
    meta
  ): PagedResult<PatientAllergiesResponseVM> => {
    const headers = meta?.response?.headers;
    return {
      data: response,
      totalCount: Number(headers?.get('X-Total-Count') ?? 0),
      links: parseLinkHeader(headers?.get('Link')),
    };
  },
  providesTags: ['PatientAllergies'],
}),


    /* =========================
     * POST /api/patient-allergies
     * ========================= */
    addPatientAllergy: builder.mutation<
      PatientAllergiesResponseVM,
      PatientAllergiesCreateDTO
    >({
      query: (payload) => ({
        url: '/api/patient/patient-allergies',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['PatientAllergies'],
    }),

    // getPatientAllergiesByPatientId: builder.query<
    //   PatientAllergiesResponseVM[],
    //   { patientId: number; showCancelled?: boolean } & PagedParams
    // >({
    //   query: ({ patientId, showCancelled = false, page, size, sort = 'id,asc' }) => ({
    //     url: `/api/patient/patient-allergies/by-patient/${patientId}`,
    //     params: { showCancelled, page, size, sort },
    //   }),
    //   providesTags: ['PatientAllergies'],
    // }),

    /* =========================
 * PUT /api/patient-allergies/{id}
 * ========================= */
updatePatientAllergy: builder.mutation<
  PatientAllergiesResponseVM,
  { id: number; dto: PatientAllergiesUpdateDTO }
>({
  query: ({ id, dto }) => ({
    url: `/api/patient/patient-allergies/${id}`,
    method: 'PUT',
    body: dto,
  }),
  invalidatesTags: ['PatientAllergies'],
}),

/* =========================
 * PUT /api/patient-allergies/{id}/cancel
 * ========================= */
cancelPatientAllergy: builder.mutation<
  PatientAllergiesResponseVM,
  { id: number; cancelledBy: string; reason?: string }
>({
  query: ({ id, cancelledBy, reason }) => ({
    url: `/api/patient/patient-allergies/${id}/cancel`,
    method: 'PUT',
    params: { cancelledBy, reason },
  }),
  invalidatesTags: ['PatientAllergies'],
}),

/* =========================
 * PUT /api/patient-allergies/{id}/resolve
 * ========================= */
resolvePatientAllergy: builder.mutation<
  PatientAllergiesResponseVM,
  { id: number; resolvedBy: string }
>({
  query: ({ id, resolvedBy }) => ({
    url: `/api/patient/patient-allergies/${id}/resolve`,
    method: 'PUT',
    params: { resolvedBy },
  }),
  invalidatesTags: ['PatientAllergies'],
}),

/* =========================
 * PUT /api/patient-allergies/{id}/undo-resolve
 * ========================= */
undoResolvePatientAllergy: builder.mutation<
  PatientAllergiesResponseVM,
  { id: number }
>({
  query: ({ id }) => ({
    url: `/api/patient/patient-allergies/${id}/undo-resolve`,
    method: 'PUT',
  }),
  invalidatesTags: ['PatientAllergies'],
}),

  }),
});

/* ---------- Hooks ---------- */
export const {
  // useGetPatientAllergiesQuery,
  // useLazyGetPatientAllergiesQuery,
  useAddPatientAllergyMutation,
  useGetPatientAllergiesByPatientIdQuery,
  useUpdatePatientAllergyMutation,
  useUndoResolvePatientAllergyMutation,
  useCancelPatientAllergyMutation,
  useResolvePatientAllergyMutation,
} = patientAllergiesService;
