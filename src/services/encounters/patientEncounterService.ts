import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { PatientEncounter, PatientEncounterDischarge, PatientEncounterFieldAudit } from '@/types/model-types-new';

type Id = number | string;

type PatientEncounterCompletionValidation = {
  encounterId: number;
  coverageType: 'SELF_PAY' | 'INSURANCE' | null;
  patientInsuranceId: number | null;
  insuranceVisit: boolean;

  chiefComplaint: boolean;
  historyOfPresentIllness: boolean;
  physicalExaminationSummary: boolean;
  primaryDiagnosis: boolean;
  assessment: boolean;
  treatmentPlan: boolean;

  medicalHistory: boolean;
  surgicalHistory: boolean;
  socialHistory: boolean;

  progressNotes: boolean;
  vitalSigns: boolean;
  bodyMeasurements: boolean;
  canComplete: boolean;
  missing: string[];
};

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

export type EncounterListVM = {
  id: number;
  patientId: number | null;
  patientFullName: string;
  mrn: string | null;
  age: number | null;
  gender: string | null;
  documentType: string | null;
  documentNumber: string | null;
  primaryMobileNumber: string | null;
  encounterNumber: string | null;
  encounterDate: string | null;
  encounterTime: string | null;
  encounterType: string | null;
  departmentId: number | null;
  departmentName: string | null;
  practitionerId: number | null;
  practitionerName: string | null;
  defaultServiceName: string | null;
  amount: number | null;
  paymentStatus: string | null;
  coverageType: string | null;
  paymentType: string | null;
  insuranceName: string | null;
  triageStarted: boolean;
  doctorStartDateTime: string | null;
  encounterStatus: string | null;
  treatmentStatus: string | null;
  isObserved: boolean;
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
    startTriageEncounter: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/start-triage`,
        method: 'PUT',
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'PatientEncounter', id }, 'PatientEncounter']
    }),
    updateHistoryOfPresentIllness: builder.mutation<
      PatientEncounter,
      { id: Id; historyOfPresentIllness: string }
    >({
      query: ({ id, historyOfPresentIllness }) => ({
        url: `/api/patient/encounter/${id}/history-of-present-illness`,
        method: 'PATCH',
        body: {
          historyOfPresentIllness
        }
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientEncounter', id },
        'PatientEncounter'
      ]
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
        practitionerId?: Id;
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
        practitionerId,
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
            practitionerId,
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

    searchEncounters: builder.query<
      PagedResult<PatientEncounter>,
      {
        facilityId?: Id;
        departmentId?: Id;
        fromDate?: string;
        toDate?: string;
        statuses?: string | string[];
        statusIn?: string[];
        patientName?: string;
        mrn?: string;
        encounterNumber?: string;
        encounterReasons?: string[];
        chiefComplaint?: string;
        priorities?: string[];
        hasPrescription?: boolean;
        hasOrder?: boolean;
        isObserved?: boolean;
      } & PagedParams
    >({
      query: ({
        facilityId,
        departmentId,
        fromDate,
        toDate,
        statuses,
        statusIn,
        patientName,
        mrn,
        encounterNumber,
        encounterReasons,
        chiefComplaint,
        priorities,
        hasPrescription,
        hasOrder,
        isObserved,
        page,
        size,
        sort = 'id,desc',
      }) => {
        const src = statuses ?? statusIn;

        const statusesCsv = Array.isArray(src)
          ? src.join(',')
          : src;

        return {
          url: `/api/patient/encounter/search`,
          method: 'GET',
          params: {
            facilityId,
            departmentId,
            fromDate,
            toDate,
            statuses: statusesCsv,
            patientName,
            mrn,
            encounterNumber,
            encounterReasons,
            chiefComplaint,
            priorities,
            hasPrescription,
            hasOrder,
            isObserved,
            page,
            size,
            sort,
          },
        };
      },

      transformResponse: (response: any, meta) => {
        const rows = Array.isArray(response)
          ? response
          : response?.content ?? [];

        return mapPaged(rows, meta);
      },

      providesTags: res =>
        res
          ? [
            ...res.data.map(e => ({
              type: 'PatientEncounter' as const,
              id: e.id,
            })),
            'PatientEncounter',
          ]
          : ['PatientEncounter'],
    }),

    getEncounterList: builder.query<
      PagedResult<EncounterListVM>,
      {
        facilityId?: Id;
        fromDate?: string;
        toDate?: string;
        patientName?: string;
        mrn?: string;
        ageFrom?: number;
        ageTo?: number;
        gender?: string;
        documentType?: string;
        documentNumber?: string;
        primaryMobileNumber?: string;
        encounterType?: string;
        encounterNumber?: string;
        departmentId?: Id;
        practitionerId?: Id;
        defaultServiceName?: string;
        amountFrom?: number;
        amountTo?: number;
        paymentStatus?: string;
        coverageType?: string;
        paymentType?: string;
        insuranceName?: string;
        triageStarted?: boolean;
        doctorStartedFrom?: string;
        doctorStartedTo?: string;
        encounterStatusIn?: string[];
        treatmentStatusIn?: string[];
        encounterReasons?: string[];
      } & PagedParams
    >({
      query: ({
        facilityId,
        fromDate,
        toDate,
        patientName,
        mrn,
        ageFrom,
        ageTo,
        gender,
        documentType,
        documentNumber,
        primaryMobileNumber,
        encounterType,
        encounterNumber,
        departmentId,
        practitionerId,
        defaultServiceName,
        amountFrom,
        amountTo,
        paymentStatus,
        coverageType,
        paymentType,
        insuranceName,
        triageStarted,
        doctorStartedFrom,
        doctorStartedTo,
        encounterStatusIn,
        treatmentStatusIn,
        encounterReasons,
        page,
        size,
        sort = 'id,desc',
      }) => ({
        url: `/api/patient/encounter/list`,
        method: 'GET',
        params: {
          facilityId,
          fromDate,
          toDate,
          patientName,
          mrn,
          ageFrom,
          ageTo,
          gender,
          documentType,
          documentNumber,
          primaryMobileNumber,
          encounterType,
          encounterNumber,
          departmentId,
          practitionerId,
          defaultServiceName,
          amountFrom,
          amountTo,
          paymentStatus,
          coverageType,
          paymentType,
          insuranceName,
          triageStarted,
          doctorStartedFrom,
          doctorStartedTo,
          encounterStatusIn,
          treatmentStatusIn,
          encounterReasons,
          page,
          size,
          sort,
        },
      }),

      transformResponse: (response: any, meta) => {
        const rows = Array.isArray(response)
          ? response
          : response?.content ?? [];

        return mapPaged(rows, meta);
      },

      providesTags: res =>
        res
          ? [
              ...res.data.map(e => ({
                type: 'PatientEncounter' as const,
                id: e.id,
              })),
              'PatientEncounter',
            ]
          : ['PatientEncounter'],
    }),


    searchBillingPendingQueue: builder.query<
      PagedResult<PatientEncounter>,
      {
        facilityId?: Id;
        departmentId?: Id;
        fromDate?: string;
        toDate?: string;
        statuses?: string | string[];
        statusIn?: string[];
        patientName?: string;
        mrn?: string;
        encounterNumber?: string;
        encounterReasons?: string[];
        chiefComplaint?: string;
        priorities?: string[];
        practitionerId?: Id;
      } & PagedParams
    >({
      query: ({
        facilityId,
        departmentId,
        fromDate,
        toDate,
        statuses,
        statusIn,
        patientName,
        mrn,
        encounterNumber,
        encounterReasons,
        chiefComplaint,
        priorities,
        practitionerId,
        page,
        size,
        sort = 'id,desc',
      }) => {
        const src = statuses ?? statusIn;

        const statusesCsv = Array.isArray(src)
          ? src.join(',')
          : src;

        return {
          url: `/api/patient/encounter/billing-pending-queue`,
          method: 'GET',
          params: {
            facilityId,
            departmentId,
            fromDate,
            toDate,
            statuses: statusesCsv,
            patientName,
            mrn,
            encounterNumber,
            encounterReasons,
            chiefComplaint,
            priorities,
            practitionerId,
            page,
            size,
            sort,
          },
        };
      },

      transformResponse: (response: any, meta) => {
        const rows = Array.isArray(response)
          ? response
          : response?.content ?? [];

        return mapPaged(rows, meta);
      },

      providesTags: res =>
        res
          ? [
              ...res.data.map(e => ({
                type: 'PatientEncounter' as const,
                id: e.id,
              })),
              'PatientEncounter',
            ]
          : ['PatientEncounter'],
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

    dischargeEncounter: builder.mutation<
      PatientEncounter,
      { id: Id; body: PatientEncounterDischarge }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/encounter/${id}/discharge`,
        method: 'POST',
        body
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
    reopenEncounter: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/reopen`,
        method: 'POST'
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientEncounter', id },
        'PatientEncounter'
      ]
    }),

    closeEncounterForBilling: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/close-billing`,
        method: 'POST'
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientEncounter', id },
        'PatientEncounter'
      ]
    }),

    reassignPractitioner: builder.mutation<
      PatientEncounter,
      { encounterId: Id; practitionerId: Id }
    >({
      query: ({ encounterId, practitionerId }) => ({
        url: `/api/patient/encounter/${encounterId}/reassign-practitioner`,
        method: 'PUT',
        body: { practitionerId }
      }),
      invalidatesTags: (_res, _err, { encounterId }) => [
        { type: 'PatientEncounter', id: encounterId },
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
    getEncounterCoverage: builder.query<
      {
        encounterId: number;
        coverageType: 'SELF_PAY' | 'INSURANCE' | null;
        patientInsuranceId: number | null;
        insuranceVisit?: boolean;
      },
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter/${encounterId}/coverage`,
        method: 'GET'
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'PatientEncounter', id: encounterId }
      ]
    }),

    getEncounterCompletionValidation: builder.query<
      PatientEncounterCompletionValidation,
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter/${encounterId}/completion-validation`,
        method: 'GET',
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'PatientEncounter', id: encounterId },
      ],
    }),

    
    getEncounterAudit: builder.query<PatientEncounterFieldAudit[], { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/audit`,
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

    getEncountersByAppointment: builder.query<string, { appointmentId: Id }>({
      query: ({ appointmentId }) => ({
        url: `/api/patient/encounter/appointment/${appointmentId}`,
        method: 'GET'
      }),
      providesTags: ['PatientEncounter']
    }),

    getPreviousClosedEncounter: builder.query<PatientEncounter | null, { encounterId: Id }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter/${encounterId}/previous-encounter-completed`,
        method: 'GET',
        responseHandler: async (response: Response) => {
          const text = await response.text();
          if (!text) return null;
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        }
      }),
      providesTags: ['PatientEncounter']
    }),
    moveWaitingListToNew: builder.mutation<PatientEncounter, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/encounter/${id}/move-to-new`,
        method: 'POST'
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'PatientEncounter', id },
        'PatientEncounter'
      ]
    }),
    // ✅ Date Range Counts

    countDepartmentTotalByDateRange: builder.query<
      number,
      { departmentId: Id; fromDate: string; toDate: string }
    >({
      query: ({ departmentId, fromDate, toDate }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/date-range/total`,
        method: 'GET',
        params: { fromDate, toDate }
      }),
      providesTags: ['PatientEncounter']
    }),

    countDepartmentWaitingListByDateRange: builder.query<
      number,
      { departmentId: Id; fromDate: string; toDate: string }
    >({
      query: ({ departmentId, fromDate, toDate }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/date-range/waiting-list`,
        method: 'GET',
        params: { fromDate, toDate }
      }),
      providesTags: ['PatientEncounter']
    }),

    countDepartmentTriageByDateRange: builder.query<
      number,
      { departmentId: Id; fromDate: string; toDate: string }
    >({
      query: ({ departmentId, fromDate, toDate }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/date-range/triage`,
        method: 'GET',
        params: { fromDate, toDate }
      }),
      providesTags: ['PatientEncounter']
    }),

    countDepartmentDischargedByDateRange: builder.query<
      number,
      { departmentId: Id; fromDate: string; toDate: string }
    >({
      query: ({ departmentId, fromDate, toDate }) => ({
        url: `/api/patient/encounter/department/${departmentId}/count/date-range/discharged`,
        method: 'GET',
        params: { fromDate, toDate }
      }),
      providesTags: ['PatientEncounter']
    }),
    getEncountersByIds: builder.query<PatientEncounter[], { ids: Id[] }>({
      query: ({ ids }) => ({
        url: `/api/patient/encounter/by-ids`,
        method: 'POST',
        body: ids
      }),
      providesTags: res =>
        res
          ? [...res.map(e => ({ type: 'PatientEncounter' as const, id: e.id })), 'PatientEncounter']
          : ['PatientEncounter']
    }),
  }),

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
  useCloseEncounterForBillingMutation,
  useReassignPractitionerMutation,

  useFilterEncountersQuery,
  useLazyFilterEncountersQuery,

  useSearchEncountersQuery,
  useLazySearchEncountersQuery,
  useCountTodayDepartmentTotalPatientsQuery,
  useCountTodayDepartmentActiveCasesQuery,
  useCountTodayDepartmentCompletedQuery,
  useCountTodayDepartmentCancelledQuery,
  useGetEncounterByIdQuery,
  useLazyGetEncounterByIdQuery,
  useGetEncounterCoverageQuery,
  useGetEncounterCompletionValidationQuery,
  useLazyGetEncounterCompletionValidationQuery,
  useGetEncountersByPatientQuery,
  useLazyGetEncountersByPatientQuery,
  useGetEncountersByAppointmentQuery,
  useLazyGetEncountersByAppointmentQuery,
  useGetPreviousClosedEncounterQuery,
  useMoveWaitingListToNewMutation,
  useCountDepartmentTotalByDateRangeQuery,
  useCountDepartmentWaitingListByDateRangeQuery,
  useCountDepartmentTriageByDateRangeQuery,
  useCountDepartmentDischargedByDateRangeQuery,
  useGetEncountersByIdsQuery,
  useLazyGetEncountersByIdsQuery,
  useUpdateHistoryOfPresentIllnessMutation,
  useStartTriageEncounterMutation,
  useSearchBillingPendingQueueQuery,
  useLazySearchBillingPendingQueueQuery,
  useGetEncounterListQuery,
  useLazyGetEncounterListQuery,
  useReopenEncounterMutation,
  useGetEncounterAuditQuery,
  useLazyGetEncounterAuditQuery
} = patientEncounterService;