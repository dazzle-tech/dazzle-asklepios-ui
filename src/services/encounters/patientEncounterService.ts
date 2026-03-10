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
    createEncounter: builder.mutation<PatientEncounter, { body: PatientEncounter }>({
      query: ({ body }) => ({
        url: '/api/patient/encounter',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientEncounter']
    }),

    updateEncounter: builder.mutation<PatientEncounter, { id: Id; body: PatientEncounter }>({
      query: ({ id, body }) => ({
        url: `/api/patient/encounter/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'PatientEncounter', id }, 'PatientEncounter']
    }),

    countTodayEncountersByFacility: builder.query<number, { facilityId: Id }>({
      query: ({ facilityId }) => ({
        url: `/api/patient/encounter/facility/${facilityId}/count/today`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

    filterEncounters: builder.query<
      PagedResult<PatientEncounter>,
      {
        departmentId: Id;
        fromDate?: string;
        toDate?: string;
        statuses?: string | string[];
        statusIn?: string[];
        patientName?: string;
        mrn?: string;
        encounterReasons?: string[];
        chiefComplaint?: string;
        priorities?: string[];
        hasPrescription?: boolean;
        hasOrder?: boolean;
        isObserved?: boolean;
      } & PagedParams
    >({
      query: ({
        departmentId,
        fromDate,
        toDate,
        statuses,
        statusIn,
        patientName,
        mrn,
        encounterReasons,
        chiefComplaint,
        priorities,
        hasPrescription,
        hasOrder,
        isObserved,
        page,
        size,
        sort = 'id,desc'
      }) => {
        const src = statuses ?? statusIn;
        const statusesCsv = Array.isArray(src) ? src.join(',') : src;

        return {
          url: `/api/patient/encounter`,
          method: 'GET',
          params: {
            departmentId,
            fromDate,
            toDate,
            statuses: statusesCsv,
            patientName,
            mrn,
            encounterReasons,
            chiefComplaint,
            priorities,
            hasPrescription,
            hasOrder,
            isObserved,
            page,
            size,
            sort
          }
        };
      },
      transformResponse: (response: any, meta) => {
        const rows = Array.isArray(response) ? response : response?.content ?? [];
        return mapPaged(rows, meta);
      },
      providesTags: res =>
        res
          ? [...res.data.map(e => ({ type: 'PatientEncounter' as const, id: e.id })), 'PatientEncounter']
          : ['PatientEncounter']
    }),

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
        const rows = Array.isArray(response) ? response : response?.content ?? [];
        return mapPaged(rows, meta);
      },
      providesTags: res =>
        res
          ? [...res.data.map(e => ({ type: 'PatientEncounter' as const, id: e.id })), 'PatientEncounter']
          : ['PatientEncounter']
    }),

    countTodayDepartmentTotalPatients: builder.query<number, { departmentId: Id }>({
      query: ({ departmentId }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/today/total-patients`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

    countTodayDepartmentActiveCases: builder.query<number, { departmentId: Id }>({
      query: ({ departmentId }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/today/active`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

    countTodayDepartmentCompleted: builder.query<number, { departmentId: Id }>({
      query: ({ departmentId }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/today/completed`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

    startEncounter: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/start`,
        method: 'POST'
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'PatientEncounter', id }, 'PatientEncounter']
    }),

    cancelEncounter: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/cancel`,
        method: 'POST'
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'PatientEncounter', id }, 'PatientEncounter']
    }),

    dischargeEncounter: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/discharge`,
        method: 'POST'
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'PatientEncounter', id }, 'PatientEncounter']
    }),

    completeEncounter: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/complete`,
        method: 'POST'
      }),

      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log('completeEncounter success:', data);
        } catch (error) {
          console.error('completeEncounter error:', error);
        }
      },

      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientEncounter', id },
        'PatientEncounter'
      ]
    }),
    countTodayDepartmentCancelled: builder.query<number, { departmentId: Id }>({
      query: ({ departmentId }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/today/cancelled`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),
    getEncounterById: builder.query<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}`,
        method: 'GET'
      }),
      providesTags: (_res, _err, { id }) => [{ type: 'PatientEncounter', id }]
    }),
    getEncountersByPatient: builder.query<PagedResult<PatientEncounter>, { patientId: Id } & PagedParams>({
      query: ({ patientId, page, size, sort = 'createdDate,desc' }) => ({
        url: `/api/patient/encounter/patient/${patientId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any, meta) => {
        const rows = Array.isArray(response) ? response : response?.content ?? [];
        return mapPaged(rows, meta);
      },
      providesTags: res =>
        res
          ? [...res.data.map(e => ({ type: 'PatientEncounter' as const, id: e.id })), 'PatientEncounter']
          : ['PatientEncounter']
    }),

    getEncountersByAppointment:builder.query<string,{ appointmentId: Id }>({
      query: ({ appointmentId}) => ({
        url: `/api/patient/encounter/appointment/${appointmentId}`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

    getPreviousClosedEncounter:builder.query<PatientEncounter,{ encounterId: Id }>({
      query: ({encounterId}) => ({
        url: `/api/patient/encounter/${encounterId}/previous-encounter-completed`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

  })
});

export const {
  useCreateEncounterMutation,
  useUpdateEncounterMutation,
  useCountTodayEncountersByFacilityQuery,
  useLazyCountTodayEncountersByFacilityQuery,
  useGetPreviousEncountersSameDepartmentQuery,
  useLazyGetPreviousEncountersSameDepartmentQuery,

  useStartEncounterMutation,
  useCancelEncounterMutation,
  useDischargeEncounterMutation,
  useCompleteEncounterMutation,

  useFilterEncountersQuery,
  useLazyFilterEncountersQuery,

  useCountTodayDepartmentTotalPatientsQuery,
  useCountTodayDepartmentActiveCasesQuery,
  useCountTodayDepartmentCompletedQuery,
  useCountTodayDepartmentCancelledQuery,
  useGetEncounterByIdQuery,
  useLazyGetEncounterByIdQuery,
  useGetEncountersByPatientQuery,
  useLazyGetEncountersByPatientQuery,
  useGetEncountersByAppointmentQuery,
  useGetPreviousClosedEncounterQuery
} = patientEncounterService;
