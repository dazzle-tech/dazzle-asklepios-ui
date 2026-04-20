import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';

import type { DentalProcedureCreateDTO, DentalProcedureUpdateDTO } from '@/types/model-types-new';

type GetDentalProceduresByPatientParams = {
  patientId: number;
  showCancelled?: boolean;
  page?: number;
  size?: number;
};

export const dentalProcedureService = createApi({
  reducerPath: 'dentalProcedureApi',
  baseQuery: baseQuery,

  endpoints: builder => ({
    // ✅ GET
    getDentalProceduresByPatient: builder.query({
      query: ({
        patientId,
        showCancelled = false,
        page = 0,
        size = 50
      }: GetDentalProceduresByPatientParams) => ({
        url: `/dental-procedures/by-patient/${patientId}`,
        params: {
          showCancelled,
          page,
          size,
          sort: 'createdDate,desc'
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0
    }),

    // ✅ CREATE
    saveDentalProcedure: builder.mutation({
      query: (body: DentalProcedureCreateDTO) => ({
        url: `/dental-procedures`,
        method: 'POST',
        body
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    // ✅ UPDATE
    updateDentalProcedure: builder.mutation({
      query: ({ id, body }: { id: number; body: DentalProcedureUpdateDTO }) => ({
        url: `/dental-procedures/${id}`,
        method: 'PUT',
        body
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    // ✅ CANCEL
    cancelDentalProcedure: builder.mutation({
      query: ({ id }: { id: number }) => ({
        url: `/dental-procedures/${id}/cancel`,
        method: 'PUT'
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
  })
});

export const {
  useGetDentalProceduresByPatientQuery,
  useSaveDentalProcedureMutation,
  useUpdateDentalProcedureMutation,
  useCancelDentalProcedureMutation
} = dentalProcedureService;
