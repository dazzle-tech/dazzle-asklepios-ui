import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import type { BodyMeasurements } from '@/types/model-types-new';

type Id = number | string;

export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  sort?: unknown;
  pageable?: unknown;
};

export type BodyMeasurementsResponseVM = {
  weight: number | null;
  height: number | null;
  encounterId: number | null;
  encounterNumber: string | null;
  isActive: boolean |null;
};

export type WeightResponseVM = {
  weight: number | null;
  createdAt: string;
};

export type HeightResponseVM = {
  height: number | null;
  createdAt: string;
};

// -------- DTOs --------
export type BodyMeasurementsCreateDTO = Omit<
  BodyMeasurements,
  'id' | 'createdDate' | 'lastModifiedDate'
>;

export type BodyMeasurementsUpdateDTO = BodyMeasurementsCreateDTO;

// -------- API --------
export const bodyMeasurementsService = createApi({
  reducerPath: 'newBodyMeasurementsApi',
  baseQuery: BaseQuery,
  tagTypes: ['BodyMeasurements'],
  endpoints: (builder) => ({
    createBodyMeasurements: builder.mutation<BodyMeasurements, BodyMeasurementsCreateDTO>({
      query: (body) => ({
        url: '/api/patient/body-measurements',
        method: 'POST',
        body
      }),
      invalidatesTags: ['BodyMeasurements']
    }),

    updateBodyMeasurements: builder.mutation<
      BodyMeasurements,
      { id: Id } & BodyMeasurementsUpdateDTO
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/body-measurements/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['BodyMeasurements']
    }),

    getLatestBodyMeasurementsByPatientId: builder.query<BodyMeasurements, { patientId: Id }>({
      query: ({ patientId }) => ({
        url: `/api/patient/body-measurements/latest/patient/${encodeURIComponent(
          String(patientId)
        )}`
      }),
      providesTags: ['BodyMeasurements']
    }),

    getLatestBodyMeasurementsByEncounterId: builder.query<BodyMeasurements, { encounterId: Id }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/body-measurements/latest/encounter/${encodeURIComponent(
          String(encounterId)
        )}`
      }),
      providesTags: ['BodyMeasurements']
    }),

    // ===================== NEW ENDPOINTS =====================

    getBodyMeasurementsBetweenDatesByPatientId: builder.query<
      SpringPage<BodyMeasurementsResponseVM>,
      { patientId: Id; from?: string; to?: string; page?: number; size?: number; sort?: string }
    >({
      query: ({ patientId, from, to, page, size, sort }) => ({
        url: `/api/patient/body-measurements/patient/${encodeURIComponent(String(patientId))}`,
        params: { from, to, page, size, sort }
      }),
      providesTags: ['BodyMeasurements']
    }),

    getWeightListByPatientBetweenDates: builder.query<
      WeightResponseVM[],
      { patientId: Id; from: string; to: string }
    >({
      query: ({ patientId, from, to }) => ({
        url: `/api/patient/body-measurements/patient/${encodeURIComponent(
          String(patientId)
        )}/weight/list`,
        params: { from, to }
      }),
      providesTags: ['BodyMeasurements']
    }),

    getHeightListByPatientBetweenDates: builder.query<
      HeightResponseVM[],
      { patientId: Id; from: string; to: string }
    >({
      query: ({ patientId, from, to }) => ({
        url: `/api/patient/body-measurements/patient/${encodeURIComponent(
          String(patientId)
        )}/height/list`,
        params: { from, to }
      }),
      providesTags: ['BodyMeasurements']
    })
  })
});

export const {
  useCreateBodyMeasurementsMutation,
  useUpdateBodyMeasurementsMutation,
  useGetLatestBodyMeasurementsByPatientIdQuery,
  useLazyGetLatestBodyMeasurementsByPatientIdQuery,
  useGetLatestBodyMeasurementsByEncounterIdQuery,
  useLazyGetLatestBodyMeasurementsByEncounterIdQuery,
  useGetBodyMeasurementsBetweenDatesByPatientIdQuery,
  useLazyGetBodyMeasurementsBetweenDatesByPatientIdQuery,
  useGetWeightListByPatientBetweenDatesQuery,
  useLazyGetWeightListByPatientBetweenDatesQuery,
  useGetHeightListByPatientBetweenDatesQuery,
  useLazyGetHeightListByPatientBetweenDatesQuery
} = bodyMeasurementsService;