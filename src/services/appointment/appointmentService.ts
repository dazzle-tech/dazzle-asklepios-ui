import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type {
  AppointmentFromTemplate,
  AppointmentFromTemplateBookPatientDTO,
  AppointmentFromTemplateCancelDTO,
  AppointmentFromTemplateNoShowDTO,
  AppointmentFromTemplateSearchFilterDTO
} from '@/types/model-types-new';

type Id = number | string;
type AppointmentStatus = string;

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
const APPOINTMENT_BASE_URL = '/api/patient/appointments';

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
    })
  })
});

export const {
  useBookPatientAppointmentMutation,
  useGetAppointmentsByStatusBetweenDatesQuery,
  useLazyGetAppointmentsByStatusBetweenDatesQuery,
  useSearchAppointmentsQuery,
  useLazySearchAppointmentsQuery,
  useCancelAppointmentMutation,
  useNoShowAppointmentMutation,
  useConfirmAppointmentMutation,
  useCheckInAppointmentMutation
} = appointmentFromTemplateService;
