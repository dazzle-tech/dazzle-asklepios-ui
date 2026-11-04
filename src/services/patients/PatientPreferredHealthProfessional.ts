import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { PatientPreferredHealthProfessional } from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';

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

const mapPaged = <T>(response: T[], meta): PagedResult<T> => {
  const headers = meta?.response?.headers;
  return {
    data: response ?? [],
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const patientPreferredHealthProfessionalService = createApi({
  reducerPath: 'patientPreferredHealthProfessionalApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientPreferredHealthProfessional'],
  endpoints: builder => ({
    getPatientPreferredHealthProfessionals: builder.query<
      PagedResult<PatientPreferredHealthProfessional>,
      { patientId: Id } & PagedParams
    >({
      query: ({ patientId, page, size, sort = 'id,desc' }) => ({
        url: `/api/patient/preferred-health-professionals/patient/${patientId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: (_res, _err, { patientId }) => [
        { type: 'PatientPreferredHealthProfessional', id: patientId }
      ]
    }),

    // إنشاء preferred جديد
    createPatientPreferredHealthProfessional: builder.mutation<
      PatientPreferredHealthProfessional,
      { patientId: number; body: PatientPreferredHealthProfessional }
    >({
      query: ({ patientId, body }) => ({
        url: `/api/patient/preferred-health-professionals/patient/${patientId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'PatientPreferredHealthProfessional', id: patientId }
      ]
    }),

    // تحديث preferred موجود
    updatePatientPreferredHealthProfessional: builder.mutation<
      PatientPreferredHealthProfessional,
      { id: number; patientId: number; body: PatientPreferredHealthProfessional }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/preferred-health-professionals/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'PatientPreferredHealthProfessional', id: patientId }
      ]
    }),

    // حذف preferred
    deletePatientPreferredHealthProfessional: builder.mutation<
      void,
      { id: number; patientId: number }
    >({
      query: ({ id }) => ({
        url: `/api/patient/preferred-health-professionals/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'PatientPreferredHealthProfessional', id: patientId }
      ]
    }),

    getActivePatientPreferredHealthProfessionals: builder.query<
      PagedResult<PatientPreferredHealthProfessional>,
      { patientId: Id } & PagedParams
    >({
      query: ({ patientId, page, size, sort = 'id,desc' }) => ({
        url: `/api/patient/preferred-health-professionals/patient/${patientId}/active`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: (_res, _err, { patientId }) => [
        { type: 'PatientPreferredHealthProfessional', id: patientId }
      ]
    })
  })
});

export const {
  useGetPatientPreferredHealthProfessionalsQuery,
  useLazyGetPatientPreferredHealthProfessionalsQuery,
  useCreatePatientPreferredHealthProfessionalMutation,
  useUpdatePatientPreferredHealthProfessionalMutation,
  useDeletePatientPreferredHealthProfessionalMutation,
  useGetActivePatientPreferredHealthProfessionalsQuery,
  useLazyGetActivePatientPreferredHealthProfessionalsQuery
} = patientPreferredHealthProfessionalService;
