import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { PatientEncounter } from '@/types/model-types-new';

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

const mapPaged = (response: any[], meta: any): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const patientEncounterService = createApi({
  reducerPath: 'patientEncountersApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientEncounter'],

  endpoints: builder => ({
    /**
     * CREATE Patient Encounter
     */
    createEncounter: builder.mutation<PatientEncounter, { body: PatientEncounter }>({
      query: ({ body }) => ({
        url: '/api/patient/encounter',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientEncounter']
    }),

    /**
     * UPDATE Patient Encounter
     */
    updateEncounter: builder.mutation<
      PatientEncounter,
      { id: Id; body: PatientEncounter }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/encounter/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientEncounter', id },
        'PatientEncounter'
      ]
    }),

    /**
     * COUNT today's encounters by facility
     */
    countTodayEncountersByFacility: builder.query<number, { facilityId: Id }>({
      query: ({ facilityId }) => ({
        url: `/api/patient/encounter/facility/${facilityId}/count/today`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

    /**
     * GET previous encounters (same department)
     */
    getPreviousEncountersSameDepartment: builder.query<
      PagedResult<PatientEncounter>,
      { patientId: Id; departmentId: Id } & PagedParams
    >({
      query: ({ patientId, departmentId, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient/encounter/patient/${patientId}/department/${departmentId}/previous`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any, meta) => {
        const rows = Array.isArray(response) ? response : (response?.content ?? []);
        return mapPaged(rows, meta);
      },
      providesTags: res =>
        res
          ? [
              ...res.data.map(e => ({ type: 'PatientEncounter' as const, id: e.id })),
              'PatientEncounter'
            ]
          : ['PatientEncounter']
    })
  })
});

export const {
  useCreateEncounterMutation,
  useUpdateEncounterMutation,
  useCountTodayEncountersByFacilityQuery,
  useLazyCountTodayEncountersByFacilityQuery,
  useGetPreviousEncountersSameDepartmentQuery,
  useLazyGetPreviousEncountersSameDepartmentQuery
} = patientEncounterService;
