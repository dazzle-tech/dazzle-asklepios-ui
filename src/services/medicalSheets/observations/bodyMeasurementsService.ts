import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import type { BodyMeasurements } from '@/types/model-types-new';

type Id = number | string;

export type BodyMeasurementsCreateDTO = Omit<
  BodyMeasurements,
  'id' | 'createdDate' | 'lastModifiedDate'
>;

export type BodyMeasurementsUpdateDTO = BodyMeasurementsCreateDTO;

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
    })
  })
});

export const {
  useCreateBodyMeasurementsMutation,
  useUpdateBodyMeasurementsMutation,
  useGetLatestBodyMeasurementsByPatientIdQuery,
  useLazyGetLatestBodyMeasurementsByPatientIdQuery,
  useGetLatestBodyMeasurementsByEncounterIdQuery,
  useLazyGetLatestBodyMeasurementsByEncounterIdQuery
} = bodyMeasurementsService;
