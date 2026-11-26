import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery as baseQuery, onQueryStarted } from '../newApi';
import type { DentalHistory } from '@/types/model-types-new';

type DentalHistoryPage = {
  data: DentalHistory[];
  totalCount: number;
};

export const dentalHistoryService = createApi({
  reducerPath: 'dentalHistoryApi',
  baseQuery: baseQuery,
  tagTypes: ['DentalHistory'],
  endpoints: builder => ({
    getDentalHistoriesByPatient: builder.query<
      DentalHistoryPage,
      { patientId: number; page?: number; size?: number }
    >({
      query: ({ patientId, page = 0, size = 10 }) => ({
        url: `/api/patient/dental-histories/by-patient/${patientId}`,
        params: {
          page,
          size,
          sort: 'createdDate,desc'
        }
      }),
      transformResponse: (response: DentalHistory[] | DentalHistoryPage, meta) => {
        const rows = Array.isArray(response) ? response : response?.data ?? [];
        const headerCount = Number(meta?.response?.headers?.get('X-Total-Count'));
        return {
          data: rows,
          totalCount: Number.isFinite(headerCount) && headerCount > 0 ? headerCount : rows.length
        };
      },
      providesTags: ['DentalHistory']
    }),

    saveDentalHistory: builder.mutation<
      DentalHistory,
      { patientId: number; encounterId: number; historyText: string }
    >({
      query: body => ({
        url: '/api/patient/dental-histories',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalHistory'],
      onQueryStarted
    }),

    updateDentalHistory: builder.mutation<
      DentalHistory,
      { id: number; historyText: string }
    >({
      query: ({ id, historyText }) => ({
        url: `/api/patient/dental-histories/${id}`,
        method: 'PUT',
        body: { id, historyText }
      }),
      invalidatesTags: ['DentalHistory'],
      onQueryStarted
    })
  })
});

export const {
  useGetDentalHistoriesByPatientQuery,
  useSaveDentalHistoryMutation,
  useUpdateDentalHistoryMutation
} = dentalHistoryService;
