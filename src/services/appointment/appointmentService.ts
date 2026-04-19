import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type {
  AppointmentFromTemplate,
  AppointmentFromTemplateBookPatientDTO,
  AppointmentFromTemplateQuickAppointmentDTO,
  AppointmentFromTemplateQuickAppointmentResponseVM,
  AppointmentFromTemplateCancelDTO,
  AppointmentFromTemplateNoShowDTO,
  AppointmentFromTemplateSearchFilterDTO
} from '@/types/model-types-new';

type Id = number | string;
type AppointmentStatus = string;

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
const APPOINTMENT_BASE_URL = '/api/patient/appointments';

type AppointmentLog = {
  id: number;
  appointmentId: number;
  operationType: string;
  logDate: string;
  logBy?: string | null;
  facilityId: number;
  departmentId: number;
  availabilityGenerationBatchId?: number | null;
  resourceType: string;
  resourceId: number;
  capacityIndex?: number | null;
  startDatetime: string;
  endDatetime: string;
  patientId?: number | null;
  defaultServiceId?: number | null;
  defaultPractitionerId?: number | null;
  reason?: string | null;
  bookingMode: string;
  status: string;
  service?: string | null;
  serviceGroupId?: number | null;
  deferred: boolean;
  deferredAt?: string | null;
  noShowReason?: string | null;
  cancelReason?: string | null;
  cancelledBy?: string | null;
  priority: string;
  originType?: string | null;
  originName?: string | null;
  note?: string | null;
  followUpEncounterId?: number | null;
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
  confirmedAt?: Date | null;
  checkedInAt?: Date | null;

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

export const appointmentFromTemplateService = createApi({
  reducerPath: 'appointmentFromTemplateApi',
  baseQuery: BaseQuery,
  tagTypes: ['AppointmentFromTemplate'],
  endpoints: builder => ({
    bookPatientAppointment: builder.mutation<
      AppointmentFromTemplate,
      AppointmentFromTemplateBookPatientDTO
    >({
      query: body => ({
        url: `${APPOINTMENT_BASE_URL}/book-patient`,
        method: 'PUT',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AppointmentFromTemplate']
    }),

    createQuickAppointment: builder.mutation<
      AppointmentFromTemplateQuickAppointmentResponseVM,
      AppointmentFromTemplateQuickAppointmentDTO
    >({
      query: body => ({
        url: `${APPOINTMENT_BASE_URL}/quick-appointment`,
        method: 'POST',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AppointmentFromTemplate']
    }),

    getAppointmentsByStatusBetweenDates: builder.query<
      PagedResult<AppointmentFromTemplate>,
      {
        status: AppointmentStatus[];
        startDatetime: string;
        endDatetime: string;
      } & PagedParams
    >({
      query: ({ status, startDatetime, endDatetime, page, size, sort = 'id,asc' }) => {
        const query = new URLSearchParams();
        (status ?? []).forEach(s => {
          if (s) query.append('status', s);
        });
        query.set('startDatetime', startDatetime);
        query.set('endDatetime', endDatetime);
        query.set('page', String(page));
        query.set('size', String(size));
        query.set('sort', sort);
        return {
          url: `${APPOINTMENT_BASE_URL}/by-status-and-dates?${query.toString()}`,
          method: 'GET'
        };
      },
      transformResponse: (response: AppointmentFromTemplate[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AppointmentFromTemplate']
    }),

    getAppointmentsByBatchId: builder.query<
      PagedResult<AppointmentFromTemplate>,
      { batchId: Id } & PagedParams
    >({
      query: ({ batchId, page, size, sort = 'id,asc' }) => ({
        url: `${APPOINTMENT_BASE_URL}/by-batch-id/${batchId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: AppointmentFromTemplate[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AppointmentFromTemplate']
    }),

    getAppointmentsByDepartmentBetweenDates: builder.query<
      PagedResult<AppointmentFromTemplate>,
      {
        departmentId: Id;
        startDatetime: string;
        endDatetime: string;
      } & PagedParams
    >({
      query: ({ departmentId, startDatetime, endDatetime, page, size, sort = 'id,asc' }) => ({
        url: `${APPOINTMENT_BASE_URL}/by-department-and-dates`,
        method: 'GET',
        params: { departmentId, startDatetime, endDatetime, page, size, sort }
      }),
      transformResponse: (response: AppointmentFromTemplate[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AppointmentFromTemplate']
    }),

    getAppointmentById: builder.query<AppointmentFromTemplate, { id: Id }>({
      query: ({ id }) => ({
        url: `${APPOINTMENT_BASE_URL}/${id}`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AppointmentFromTemplate']
    }),

    searchAppointments: builder.query<
      PagedResult<AppointmentFromTemplate>,
      { filter: AppointmentFromTemplateSearchFilterDTO } & PagedParams
    >({
      query: ({ filter, page, size, sort = 'id,asc' }) => ({
        url: `${APPOINTMENT_BASE_URL}/search`,
        method: 'POST',
        params: { page, size, sort },
        body: filter
      }),
      transformResponse: (response: AppointmentFromTemplate[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };
      },
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AppointmentFromTemplate']
    }),

    cancelAppointment: builder.mutation<AppointmentFromTemplate, AppointmentFromTemplateCancelDTO>({
      query: body => ({
        url: `${APPOINTMENT_BASE_URL}/cancel`,
        method: 'PUT',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AppointmentFromTemplate']
    }),

    noShowAppointment: builder.mutation<AppointmentFromTemplate, AppointmentFromTemplateNoShowDTO>({
      query: body => ({
        url: `${APPOINTMENT_BASE_URL}/no-show`,
        method: 'PUT',
        body
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AppointmentFromTemplate']
    }),

    confirmAppointment: builder.mutation<AppointmentFromTemplate, { id: Id }>({
      query: ({ id }) => ({
        url: `${APPOINTMENT_BASE_URL}/${id}/confirm`,
        method: 'PUT'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AppointmentFromTemplate']
    }),

    checkInAppointment: builder.mutation<AppointmentFromTemplate, { id: Id }>({
      query: ({ id }) => ({
        url: `${APPOINTMENT_BASE_URL}/${id}/check-in`,
        method: 'PUT'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AppointmentFromTemplate']
    }),

    getAppointmentLogs: builder.query<AppointmentLog[], { appointmentId: Id }>({
      query: ({ appointmentId }) => ({
        url: `${APPOINTMENT_BASE_URL}/${appointmentId}/logs`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AppointmentFromTemplate']
    })
  })
});

export const {
  useBookPatientAppointmentMutation,
  useCreateQuickAppointmentMutation,
  useGetAppointmentsByStatusBetweenDatesQuery,
  useLazyGetAppointmentsByStatusBetweenDatesQuery,
  useGetAppointmentsByBatchIdQuery,
  useLazyGetAppointmentsByBatchIdQuery,
  useGetAppointmentsByDepartmentBetweenDatesQuery,
  useLazyGetAppointmentsByDepartmentBetweenDatesQuery,
  useGetAppointmentByIdQuery,
  useLazyGetAppointmentByIdQuery,
  useSearchAppointmentsQuery,
  useLazySearchAppointmentsQuery,
  useCancelAppointmentMutation,
  useNoShowAppointmentMutation,
  useConfirmAppointmentMutation,
  useCheckInAppointmentMutation,
  useGetAppointmentLogsQuery,
  useLazyGetAppointmentLogsQuery
} = appointmentFromTemplateService;
