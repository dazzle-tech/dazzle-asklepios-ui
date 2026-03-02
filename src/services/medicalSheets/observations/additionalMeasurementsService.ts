import { AdditionalMeasurements } from '@/types/model-types-new';
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';

type Id = number | string;

export type AdditionalMeasurementsInfantCreateDTO = Omit<
  AdditionalMeasurements,
  'id' | 'createdDate' | 'lastModifiedDate' | 'createdBy' | 'lastModifiedBy'
>;

export type AdditionalMeasurementsInfantUpdateDTO = AdditionalMeasurementsInfantCreateDTO;

export type AdditionalMeasurementsGeriatricCreateDTO = Omit<
  AdditionalMeasurements,
  'id' | 'createdDate' | 'lastModifiedDate' | 'createdBy' | 'lastModifiedBy'
>;

export type AdditionalMeasurementsGeriatricUpdateDTO = AdditionalMeasurementsGeriatricCreateDTO;

export const additionalMeasurementsService = createApi({
  reducerPath: 'newAdditionalMeasurementsApi',
  baseQuery: BaseQuery,
  tagTypes: ['AdditionalMeasurements'],
  endpoints: (builder) => ({
    createAdditionalMeasurementsInfant: builder.mutation<
      AdditionalMeasurements,
      AdditionalMeasurementsInfantCreateDTO
    >({
      query: (body) => ({
        url: '/api/patient/additional-measurements/infant',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdditionalMeasurements'],
    }),

    updateAdditionalMeasurementsInfant: builder.mutation<
      AdditionalMeasurements,
      { id: Id } & AdditionalMeasurementsInfantUpdateDTO
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/additional-measurements/infant/${encodeURIComponent(
          String(id),
        )}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdditionalMeasurements'],
    }),

    createAdditionalMeasurementsGeriatric: builder.mutation<
      AdditionalMeasurements,
      AdditionalMeasurementsGeriatricCreateDTO
    >({
      query: (body) => ({
        url: '/api/patient/additional-measurements/geriatric',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdditionalMeasurements'],
    }),

    updateAdditionalMeasurementsGeriatric: builder.mutation<
      AdditionalMeasurements,
      { id: Id } & AdditionalMeasurementsGeriatricUpdateDTO
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/additional-measurements/geriatric/${encodeURIComponent(
          String(id),
        )}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdditionalMeasurements'],
    }),

    getLatestAdditionalMeasurementsByEncounterId: builder.query<
      AdditionalMeasurements,
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/additional-measurements/latest/encounter/${encodeURIComponent(
          String(encounterId),
        )}`,
      }),
      providesTags: ['AdditionalMeasurements'],
    }),
  }),
});

export const {
  useCreateAdditionalMeasurementsInfantMutation,
  useUpdateAdditionalMeasurementsInfantMutation,
  useCreateAdditionalMeasurementsGeriatricMutation,
  useUpdateAdditionalMeasurementsGeriatricMutation,
  useGetLatestAdditionalMeasurementsByEncounterIdQuery,
  useLazyGetLatestAdditionalMeasurementsByEncounterIdQuery,
} = additionalMeasurementsService;
