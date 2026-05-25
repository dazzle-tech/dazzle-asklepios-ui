import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../../../newApi';
import type { AppointmentPolicyAssignmentResponseVM } from '@/types/model-types-new';

type Id = number | string;

export const appointmentPolicyAssignmentService = createApi({
  reducerPath: 'appointmentPolicyAssignmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['AppointmentPolicyAssignment'],
  endpoints: builder => ({
    getAppointmentPolicyAssignmentsByAppointmentId: builder.query<
      AppointmentPolicyAssignmentResponseVM[],
      Id
    >({
      query: appointmentId => ({
        url: `/api/patient/appointment-policy-assignment/by-appointment-id/${appointmentId}`,
        method: 'GET'
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
      providesTags: ['AppointmentPolicyAssignment']
    })
  })
});

export const {
  useGetAppointmentPolicyAssignmentsByAppointmentIdQuery,
  useLazyGetAppointmentPolicyAssignmentsByAppointmentIdQuery
} = appointmentPolicyAssignmentService;
