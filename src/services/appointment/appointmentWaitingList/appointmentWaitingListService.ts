import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import type {
  AppointmentWaitingListBookDTO,
  AppointmentWaitingListCreateDTO,
  AppointmentWaitingListVM,
  WaitingListAvailableSlotsByBookingModeVM,
} from '@/types/model-types-new';

type Id = number | string;

export type AppointmentWaitingListAvailableSlotsParams = {
  id: Id;
  preferredDate?: string | null;
};

export type AppointmentWaitingListQueryParams = {
  facilityId: Id;
  departmentId: Id;
};

export const appointmentWaitingListService = createApi({
  reducerPath: 'appointmentWaitingListApi',
  baseQuery: BaseQuery,
  tagTypes: ['AppointmentWaitingList'],
  endpoints: builder => ({
    createAppointmentWaitingList: builder.mutation<
      AppointmentWaitingListVM,
      AppointmentWaitingListCreateDTO
    >({
      query: body => ({
        url: '/api/patient/waiting-list',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AppointmentWaitingList'],
    }),

    getAppointmentWaitingList: builder.query<
      AppointmentWaitingListVM[],
      AppointmentWaitingListQueryParams
    >({
      query: ({ facilityId, departmentId }) => ({
        url: '/api/patient/waiting-list',
        method: 'GET',
        params: { facilityId, departmentId },
      }),
      providesTags: res =>
        res
          ? [
              ...res
                .map(item => item?.id)
                .filter((id): id is number => typeof id === 'number')
                .map(id => ({ type: 'AppointmentWaitingList' as const, id })),
              'AppointmentWaitingList',
            ]
          : ['AppointmentWaitingList'],
    }),

    getAppointmentWaitingListAvailableSlots: builder.query<
      WaitingListAvailableSlotsByBookingModeVM,
      AppointmentWaitingListAvailableSlotsParams
    >({
      query: ({ id, preferredDate }) => ({
        url: `/api/patient/waiting-list/${id}/available-slots`,
        method: 'GET',
        params: preferredDate ? { preferredDate } : undefined,
      }),
      providesTags: (_res, _err, { id }) => [
        { type: 'AppointmentWaitingList', id },
        'AppointmentWaitingList',
      ],
    }),

    bookAppointmentWaitingList: builder.mutation<
      AppointmentWaitingListVM,
      { id: Id; body: AppointmentWaitingListBookDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/waiting-list/${id}/book`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'AppointmentWaitingList', id },
        'AppointmentWaitingList',
      ],
    }),
  }),
});

export const {
  useCreateAppointmentWaitingListMutation,
  useGetAppointmentWaitingListQuery,
  useLazyGetAppointmentWaitingListQuery,
  useGetAppointmentWaitingListAvailableSlotsQuery,
  useLazyGetAppointmentWaitingListAvailableSlotsQuery,
  useBookAppointmentWaitingListMutation,
} = appointmentWaitingListService;
