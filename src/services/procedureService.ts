import { ApAudiometryPuretone, ApElectrocardiogramEcg, ApOptometricExam, ApProcedureRegistration, ApTreadmillStress } from './../types/model-types';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import {
  ApProcedure
} from '@/types/model-types';
export const procedureService = createApi({
  reducerPath: 'procedureApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getProcedures: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/procedures/procedures-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveProcedures: builder.mutation({
      query: (order: ApProcedure) => ({
        url: `/procedures/save-procedures`,
        method: 'POST',
        body: order
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getProceduresRegistration: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/procedures/procedures-registration-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveProceduresRegistration: builder.mutation({
      query: (order: ApProcedureRegistration) => ({
        url: `/procedures/save-registration-procedures`,
        method: 'POST',
        body: order
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    getProceduresStaff: builder.query({
      query: (listRequest: ListRequest) => ({
        url: `/procedures/procedure-staff-list?${fromListRequestToQueryParams(listRequest)}`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 5
    }),
    saveProceduresStaff: builder.mutation({
      query: (order: ApProcedureRegistration) => ({
        url: `/procedures/save-procedure-staff`,
        method: 'POST',
        body: order
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    deleteProceduresStaff: builder.mutation({
      query: (key: string) => ({
        url: `/procedures/delete-procedure-staff?key=${key}`,
        method: 'DELETE'
      }),
      onQueryStarted: onQueryStarted
    })

  })
});

export const {
  useGetProceduresQuery,
  useSaveProceduresMutation,
  useGetProceduresRegistrationQuery,
  useSaveProceduresRegistrationMutation,
  useGetProceduresStaffQuery,
  useSaveProceduresStaffMutation,
  useDeleteProceduresStaffMutation

} = procedureService;

