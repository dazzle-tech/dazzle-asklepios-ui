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

type PatientBasicInformationResponseVM = {
  firstName: string;
  lastName: string;
  medicalRecordNumber: string;
  dateOfBirth: string;
  sexAtBirth: string;
};

export const newPatientService = createApi({
  reducerPath: 'patientsApi',
  baseQuery: BaseQuery,
  tagTypes: ['Patient'],
  endpoints: builder => ({
    getPatientById: builder.query<modelTypes.Patient, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/${id}`
      }),
      providesTags: (_res, _err, { id }) => [{ type: 'Patient' as const, id }]
    }),

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

    getPatientsByMedicalRecordNumber: builder.query<
      PagedResult<modelTypes.Patient>,
      { medicalRecordNumber: string } & PagedParams
    >({
      query: ({ medicalRecordNumber, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/by-medicalRecordNumber/${encodeURIComponent(medicalRecordNumber)}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: res =>
        res
          ? [...res.data.map(p => ({ type: 'Patient' as const, id: p.id })), 'Patient']
          : ['Patient']
    }),

    getPatientsByArchivingNumber: builder.query<
      PagedResult<modelTypes.Patient>,
      { archivingNumber: string } & PagedParams
    >({
      query: ({ archivingNumber, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/by-archiving-number/${encodeURIComponent(archivingNumber)}`,
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
        url: `/api/patient/by-primary-phone/${encodeURIComponent(phone)}`,
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
        url: `/api/patient/by-date-of-birth/${encodeURIComponent(date)}`,
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
        url: `/api/patient/by-full-name/${encodeURIComponent(keyword)}`,
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
        url: `/api/patient/by-document-number`,
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
        url: '/api/patient',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Patient']
    }),

    updatePatient: builder.mutation<modelTypes.Patient, { id: Id; data: modelTypes.Patient }>({
      query: ({ id, data }) => ({
        url: `/api/patient/${id}`,
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
        url: `/api/patient/by-any-document-number`,
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
        url: '/api/patient/unknown',
        method: 'POST'
      }),
      invalidatesTags: ['Patient']
    }),

    getDuplicationCandidates: builder.mutation<
      modelTypes.PatientBasicInformationResponseVM[],
      {
        dto: modelTypes.PatientDuplicationLookupDTO;
      } & PagedParams
    >({
      query: ({ dto, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/duplication-candidates`,
        method: 'POST',
        body: dto,
        params: { page, size, sort }
      })
    }),

    getUnknownPatients: builder.query<PagedResult<modelTypes.Patient>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/unknown`,
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

    getBulkPatientBasicInfo: builder.mutation<PatientBasicInformationResponseVM[], number[]>({
      query: body => ({
        url: '/api/analytics/bulk/basic-info',
        method: 'POST',
        body
      })
    }),

    getPatientLabel: builder.query<modelTypes.PatientLabelVM, { patientId: number }>({
      query: ({ patientId }) => ({
        url: `/api/analytics/label/${patientId}`,
        method: 'GET'
      })
    })
  })
});

export const {
  useGetPatientByIdQuery,
  useGetPatientsQuery,
  useLazyGetPatientsQuery,
  useGetPatientsByMedicalRecordNumberQuery,
  useLazyGetPatientsByMedicalRecordNumberQuery,
  useGetPatientsByArchivingNumberQuery,
  useLazyGetPatientsByArchivingNumberQuery,
  useGetPatientsByPrimaryPhoneQuery,
  useLazyGetPatientsByPrimaryPhoneQuery,
  useGetPatientsByDateOfBirthQuery,
  useLazyGetPatientsByDateOfBirthQuery,
  useGetPatientsByFullNameQuery,
  useLazyGetPatientsByFullNameQuery,
  useGetPatientsByDocumentNumberQuery,
  useLazyGetPatientsByDocumentNumberQuery,
  useGetPatientsByAnyDocumentNumberQuery,
  useLazyGetPatientsByAnyDocumentNumberQuery,
  useAddPatientMutation,
  useUpdatePatientMutation,
  useAddUnknownPatientMutation,
  useGetUnknownPatientsQuery,
  useLazyGetUnknownPatientsQuery,
  useLazyGetPatientByIdQuery,
  useGetDuplicationCandidatesMutation,
  useGetBulkPatientBasicInfoMutation,
  useLazyGetPatientLabelQuery
} = newPatientService;
