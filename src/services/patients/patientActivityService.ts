import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import type {
  PatientActivity,
  PatientActivityCancelDTO,
  PatientActivityCatalog,
  PatientActivityCompleteDTO,
  PatientActivityCreateDTO,
  PatientActivityUpdateDTO
} from '@/types/model-types-new';

type Id = number | string;

export type PatientActivityPage = {
  data: PatientActivity[];
  totalCount: number;
};

export type PatientActivityQuery = {
  patientId: Id;
  page?: number;
  size?: number;
  sort?: string;
  category?: string;
  status?: string;
};

export const patientActivityService = createApi({
  reducerPath: 'patientActivityApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientActivity', 'PatientActivityCatalog'],
  endpoints: builder => ({
    getPatientActivityCatalog: builder.query<PatientActivityCatalog, void>({
      query: () => ({
        url: '/api/patient/activities/catalog'
      }),
      providesTags: ['PatientActivityCatalog']
    }),

    getPatientActivities: builder.query<PatientActivityPage, PatientActivityQuery>({
      query: ({ patientId, page = 0, size = 15, sort = 'createdDate,desc', category, status }) => ({
        url: `/api/patient/activities/patient/${patientId}`,
        params: {
          page,
          size,
          sort,
          ...(category ? { category } : {}),
          ...(status ? { status } : {})
        }
      }),
      transformResponse: (response: PatientActivity[], meta) => ({
        data: response ?? [],
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? response?.length ?? 0)
      }),
      providesTags: (_result, _error, { patientId }) => [
        { type: 'PatientActivity', id: `LIST-${patientId}` }
      ]
    }),

    addPatientActivity: builder.mutation<PatientActivity, PatientActivityCreateDTO>({
      query: body => ({
        url: '/api/patient/activities',
        method: 'POST',
        body
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'PatientActivity', id: `LIST-${body.patientId}` }
      ]
    }),

    updatePatientActivity: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; body: PatientActivityUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/activities/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, { patientId }) => [
        { type: 'PatientActivity', id: `LIST-${patientId}` }
      ]
    }),

    completePatientActivity: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; body: PatientActivityCompleteDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/activities/${id}/complete`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { patientId }) => [
        { type: 'PatientActivity', id: `LIST-${patientId}` }
      ]
    }),

    cancelPatientActivity: builder.mutation<
      PatientActivity,
      { id: Id; patientId: Id; body: PatientActivityCancelDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/activities/${id}/cancel`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { patientId }) => [
        { type: 'PatientActivity', id: `LIST-${patientId}` }
      ]
    })
  })
});

export const {
  useGetPatientActivityCatalogQuery,
  useGetPatientActivitiesQuery,
  useAddPatientActivityMutation,
  useUpdatePatientActivityMutation,
  useCompletePatientActivityMutation,
  useCancelPatientActivityMutation
} = patientActivityService;
