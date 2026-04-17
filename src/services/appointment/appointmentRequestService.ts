import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

export type AppointmentRequestListParams = {
  patientId?: number;
  facilityId?: number;
  sourceEncounterId?: number;
  status?: modelTypes.AppointmentRequestStatus;
};

export const appointmentRequestService = createApi({
  reducerPath: 'appointmentRequestApi',
  baseQuery: BaseQuery,
  tagTypes: ['AppointmentRequest'],
  endpoints: builder => ({
    createAppointmentRequest: builder.mutation<
      modelTypes.AppointmentRequestResponseVM,
      modelTypes.AppointmentRequestCreateDTO
    >({
      query: body => ({
        url: '/api/patient/appointment-requests',
        method: 'POST',
        body
      }),
      invalidatesTags: ['AppointmentRequest']
    }),

    approveAppointmentRequest: builder.mutation<
      modelTypes.AppointmentRequestResponseVM,
      modelTypes.AppointmentRequestUpdateDTO
    >({
      query: body  => ({
        url: `/api/patient/appointment-requests/approve`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_res, _err, body) => [{ type: 'AppointmentRequest', id: body.id }, 'AppointmentRequest']
    }),

    getAppointmentRequestById: builder.query<
      modelTypes.AppointmentRequestResponseVM,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/patient/appointment-requests/${id}`
      }),
      providesTags: (_res, _err, { id }) => [{ type: 'AppointmentRequest', id }]
    }),

    getAppointmentRequests: builder.query<
      modelTypes.AppointmentRequestResponseVM[],
      AppointmentRequestListParams | void
    >({
      query: params => ({
        url: '/api/patient/appointment-requests',
        params: (params ?? {}) as Record<string, any>
      }),
      providesTags: res =>
        res
          ? [
              ...res
                .map(r => r?.id)
                .filter((id): id is number => typeof id === 'number')
                .map(id => ({ type: 'AppointmentRequest' as const, id })),
              'AppointmentRequest'
            ]
          : ['AppointmentRequest']
    }),

    cancelAppointmentRequest: builder.mutation<
      modelTypes.AppointmentRequestResponseVM,
      { id: Id; data: modelTypes.AppointmentRequestCancelDTO }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/appointment-requests/${id}/cancel`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'AppointmentRequest', id }, 'AppointmentRequest']
    }),

    deleteAppointmentRequest: builder.mutation<
      void,
      { id: Id }
    >({
      query: ({ id }) => ({
        url: `/api/patient/appointment-requests/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: 'AppointmentRequest', id }, 'AppointmentRequest']
    })
  })
});

export const {
  useCreateAppointmentRequestMutation,
  useGetAppointmentRequestByIdQuery,
  useApproveAppointmentRequestMutation,
  useLazyGetAppointmentRequestByIdQuery,
  useGetAppointmentRequestsQuery,
  useLazyGetAppointmentRequestsQuery,
  useCancelAppointmentRequestMutation,
  useDeleteAppointmentRequestMutation
} = appointmentRequestService;

