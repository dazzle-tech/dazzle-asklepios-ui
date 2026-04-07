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
        url: '/api/patient/appointments/book-patient',
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
        status: AppointmentStatus;
        startDatetime: string;
        endDatetime: string;
      } & PagedParams
    >({
      query: ({ status, startDatetime, endDatetime, page, size, sort = 'id,asc' }) => ({
        url: '/api/patient/appointments/by-status-and-dates',
        method: 'GET',
        params: { status, startDatetime, endDatetime, page, size, sort }
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

    searchAppointments: builder.query<
      PagedResult<AppointmentFromTemplate>,
      { filter: AppointmentFromTemplateSearchFilterDTO } & PagedParams
    >({
      query: ({ filter, page, size, sort = 'id,asc' }) => ({
        url: '/api/patient/appointments/search',
        method: 'GET',
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
        url: '/api/patient/appointments/cancel',
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
        url: '/api/patient/appointments/no-show',
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
        url: `/api/patient/appointments/${id}/confirm`,
        method: 'PUT'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      invalidatesTags: ['AppointmentFromTemplate']
    }),

    checkInAppointment: builder.mutation<AppointmentFromTemplate, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/appointments/${id}/check-in`,
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
