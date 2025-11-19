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
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const newPatientService = createApi({
  reducerPath: 'patientsApi',
  baseQuery: BaseQuery,
  tagTypes: ['Patient'],
  endpoints: builder => ({

    // ============ LIST (ALL) ============
    getPatients: builder.query<PagedResult<modelTypes.Patient>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/patient/patients',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [
              ...res.data.map(p => ({ type: 'Patient' as const, id: p.id })),
              'Patient',
            ]
          : ['Patient'],
    }),

    // ============ SEARCH BY MRN ============
    getPatientsByMrn: builder.query<
      PagedResult<modelTypes.Patient>,
      { mrn: string } & PagedParams
    >({
      query: ({ mrn, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-mrn/${encodeURIComponent(mrn)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [
              ...res.data.map(p => ({ type: 'Patient' as const, id: p.id })),
              'Patient',
            ]
          : ['Patient'],
    }),

    // ============ SEARCH BY ARCHIVING NUMBER ============
    getPatientsByArchivingNumber: builder.query<
      PagedResult<modelTypes.Patient>,
      { archivingNumber: string } & PagedParams
    >({
      query: ({ archivingNumber, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-archiving-number/${encodeURIComponent(
          archivingNumber,
        )}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [
              ...res.data.map(p => ({ type: 'Patient' as const, id: p.id })),
              'Patient',
            ]
          : ['Patient'],
    }),

    // ============ SEARCH BY PRIMARY PHONE ============
    getPatientsByPrimaryPhone: builder.query<
      PagedResult<modelTypes.Patient>,
      { phone: string } & PagedParams
    >({
      query: ({ phone, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-primary-phone/${encodeURIComponent(
          phone,
        )}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [
              ...res.data.map(p => ({ type: 'Patient' as const, id: p.id })),
              'Patient',
            ]
          : ['Patient'],
    }),

    // ============ SEARCH BY DATE OF BIRTH ============
    // date should be 'YYYY-MM-DD' string from UI
    getPatientsByDateOfBirth: builder.query<
      PagedResult<modelTypes.Patient>,
      { date: string } & PagedParams
    >({
      query: ({ date, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-date-of-birth/${encodeURIComponent(
          date,
        )}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [
              ...res.data.map(p => ({ type: 'Patient' as const, id: p.id })),
              'Patient',
            ]
          : ['Patient'],
    }),

    // ============ SEARCH BY FULL NAME KEYWORD ============
    getPatientsByFullName: builder.query<
      PagedResult<modelTypes.Patient>,
      { keyword: string } & PagedParams
    >({
      query: ({ keyword, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/patients/by-full-name/${encodeURIComponent(
          keyword,
        )}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [
              ...res.data.map(p => ({ type: 'Patient' as const, id: p.id })),
              'Patient',
            ]
          : ['Patient'],
    }),

    // ============ CREATE PATIENT ============
    addPatient: builder.mutation<modelTypes.Patient, modelTypes.Patient>({
      query: data => ({
        url: '/api/patient/patients',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Patient'],
    }),

    // ============ UPDATE PATIENT ============
    updatePatient: builder.mutation<
      modelTypes.Patient,
      { id: Id; data: modelTypes.Patient }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/patients/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Patient', id },
        'Patient',
      ],
    }),
  }),
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

  // mutations
  useAddPatientMutation,
  useUpdatePatientMutation,
} = newPatientService;
