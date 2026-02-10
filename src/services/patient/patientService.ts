import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
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

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

// ====== NEW: Bulk Basic Info types ======
type PatientBasicInformationResponseVM = {
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
  dateOfBirth: string; // إذا الباك يرجع ISO string. لو يرجع Date فعليًا (نادر) غيّرها حسب الحاجة
  sexAtBirth: modelTypes.Gender; // أو string إذا Gender غير موجود عندك في modelTypes
};

export const newPatientService = createApi({
  reducerPath: 'patientsApi',
  baseQuery: BaseQuery,
  tagTypes: ['Patient'],
  endpoints: builder => ({
    getPatients: builder.query<PagedResult<modelTypes.Patient>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/patient/patients',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    getPatientsByMrn: builder.query<PagedResult<modelTypes.Patient>, { mrn: string } & PagedParams>(
      {
        query: ({ mrn, page, size, sort = 'id,asc' }) => ({
          url: `/api/patient/patients/by-mrn/${encodeURIComponent(mrn)}`,
          params: { page, size, sort }
        }),
        transformResponse: mapPaged,
        providesTags: res =>
          res
            ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
            : ['Patient']
      }
    ),

    getPatientsByArchivingNumber: builder.query<
      PagedResult<modelTypes.Patient>,
      { archivingNumber: string } & PagedParams
    >({
      query: ({ archivingNumber, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-archiving-number/${encodeURIComponent(archivingNumber)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    getPatientsByPrimaryPhone: builder.query<
      PagedResult<modelTypes.Patient>,
      { phone: string } & PagedParams
    >({
      query: ({ phone, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-primary-phone/${encodeURIComponent(phone)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    getPatientsByDateOfBirth: builder.query<
      PagedResult<modelTypes.Patient>,
      { date: string } & PagedParams
    >({
      query: ({ date, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-date-of-birth/${encodeURIComponent(date)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    getPatientsByFullName: builder.query<
      PagedResult<modelTypes.Patient>,
      { keyword: string } & PagedParams
    >({
      query: ({ keyword, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-full-name/${encodeURIComponent(keyword)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    getPatientsByDocumentNumber: builder.query<
      PagedResult<modelTypes.Patient>,
      { number: string } & PagedParams
    >({
      query: ({ number, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-document-number`,
        params: { number, page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    addPatient: builder.mutation<modelTypes.Patient, modelTypes.Patient>({
      query: data => ({
        url: '/api/patient/patients',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Patient']
    }),

    updatePatient: builder.mutation<modelTypes.Patient, { id: Id; data: modelTypes.Patient }>({
      query: ({ id, data }) => ({
        url: `/api/patient/patients/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'Patient', id }, 'Patient']
    }),

    getPatientsByAnyDocumentNumber: builder.query<
      PagedResult<modelTypes.Patient>,
      { number: string } & PagedParams
    >({
      query: ({ number, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-any-document-number`,
        params: { number, page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient', id: p.id } as const)), 'Patient']
          : ['Patient']
    }),

    addUnknownPatient: builder.mutation<modelTypes.Patient, void>({
      query: () => ({
        url: '/api/patient/patients/unknown',
        method: 'POST'
      }),
      invalidatesTags: ['Patient']
    }),

    getUnknownPatients: builder.query<PagedResult<modelTypes.Patient>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/unknown`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any, meta) => {
        return mapPaged(response?.content ?? [], meta);
      },
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    // ============ NEW: BULK BASIC INFO (POST) ============
    getBulkPatientBasicInfo: builder.mutation<PatientBasicInformationResponseVM[], number[]>({
      query: (ids) => ({
        url: '/api/patient/patients/bulk/basic-info',
        method: 'POST',
        body: ids
      })
    })
  })
});

export const {
  // list
  useGetPatientsQuery,
  useLazyGetPatientsQuery,

  // filters
  useGetPatientsByMrnQuery,
  useLazyGetPatientsByMrnQuery,
  useGetPatientsByArchivingNumberQuery,
  useLazyGetPatientsByArchivingNumberQuery,
  useGetPatientsByPrimaryPhoneQuery,
  useLazyGetPatientsByPrimaryPhoneQuery,
  useGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useGetPatientsByFullNameQuery,
  useLazyGetPatientsByFullNameQuery,

  // NEW
  useGetPatientsByDocumentNumberQuery,
  useLazyGetPatientsByDocumentNumberQuery,

  // NEW - any document number
  useGetPatientsByAnyDocumentNumberQuery,
  useLazyGetPatientsByAnyDocumentNumberQuery,

  // mutations
  useAddPatientMutation,
  useUpdatePatientMutation,

  // Unknown Patients
  useAddUnknownPatientMutation,
  useGetUnknownPatientsQuery,
  useLazyGetUnknownPatientsQuery,

  // NEW: bulk basic info
  useGetBulkPatientBasicInfoMutation
} = newPatientService;
