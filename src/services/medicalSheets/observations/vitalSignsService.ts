import { VitalSigns } from '@/types/model-types-new';
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
type Id = number | string;

export type VitalSignsCreateDTO = Omit<
  VitalSigns,
  'id' | 'createdDate' | 'lastModifiedDate'
>;

export type VitalSignsUpdateDTO = VitalSignsCreateDTO;

export const vitalSignsService = createApi({
  reducerPath: 'newVitalSignsApi',
  baseQuery: BaseQuery,
  tagTypes: ['VitalSigns'],
  endpoints: (builder) => ({
    createVitalSigns: builder.mutation<VitalSigns, VitalSignsCreateDTO>({
      query: (body) => ({
        url: '/api/patient/vital-signs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['VitalSigns'],
    }),

    updateVitalSigns: builder.mutation<
      VitalSigns,
      { id: Id } & VitalSignsUpdateDTO
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/vital-signs/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['VitalSigns'],
    }),
    getLatestVitalSignsByEncounterId: builder.query<
      VitalSigns,
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/vital-signs/latest/encounter/${encodeURIComponent(
          String(encounterId),
        )}`,
      }),
      providesTags: ['VitalSigns'],
    }),

    getLatestTriageVitalSignsByEncounterId: builder.query<
      VitalSigns,
      { encounterId: Id }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/vital-signs/latest/triage/encounter/${encodeURIComponent(
          String(encounterId),
        )}`,
      }),
      providesTags: ['VitalSigns'],
    }),
  }),
});

export const {
  useCreateVitalSignsMutation,
  useUpdateVitalSignsMutation,
  useGetLatestVitalSignsByEncounterIdQuery,
  useLazyGetLatestVitalSignsByEncounterIdQuery,
  useGetLatestTriageVitalSignsByEncounterIdQuery,
  useLazyGetLatestTriageVitalSignsByEncounterIdQuery,
} = vitalSignsService;
