import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery as baseQuery, onQueryStarted } from '../newApi';

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
  tagTypes: ['DentalProcedure'],

  endpoints: builder => ({
    getDentalProceduresByPatient: builder.query({
      query: ({
        patientId,
        showCancelled = false,
        page = 0,
        size = 50
      }: GetDentalProceduresByPatientParams) => ({
        url: `/api/patient/dental-procedures/by-patient/${patientId}`,
        params: {
          showCancelled,
          page,
          size,
          sort: 'createdDate,desc'
        }
      }),
      providesTags: ['DentalProcedure'],
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 0
    }),

    saveDentalProcedure: builder.mutation({
      query: (body: DentalProcedureCreateDTO) => ({
        url: `/api/patient/dental-procedures`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalProcedure'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    updateDentalProcedure: builder.mutation({
      query: ({ id, body }: { id: number; body: DentalProcedureUpdateDTO }) => ({
        url: `/api/patient/dental-procedures/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DentalProcedure'],
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),

    cancelDentalProcedure: builder.mutation({
      query: ({
        id,
        cancellationReason
      }: {
        id: number;
        cancellationReason: string;
      }) => ({
        url: `/api/patient/dental-procedures/${id}/cancel`,
        method: 'PUT',
        body: {
          cancellationReason
        }
      }),
      invalidatesTags: ['DentalProcedure'],
      onQueryStarted,
      transformResponse: (response: any) => response.object
    })
  })
});

export const {
  useGetDentalProceduresByPatientQuery,
  useSaveDentalProcedureMutation,
  useUpdateDentalProcedureMutation,
  useCancelDentalProcedureMutation
} = dentalProcedureService;
