import { VitalSigns } from '@/types/model-types-new';
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';

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

export type VitalSignsResponseVM = {
  temperature: number | null;
  pulseRate: number | null;
  respiratoryRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  oxygenSaturation: number | null;
  encounterId: number | null;
  encounterNumber: string | null;
  isActive: boolean |null;
};

export type TemperatureResponseVM = {
  temperature: number | null;
  createdAt: string;
};

export type PulseRateResponseVM = {
  pulseRate: number | null;
  createdAt: string;
};

export type RespiratoryRateResponseVM = {
  respiratoryRate: number | null;
  createdAt: string;
};

export type OxygenSaturationResponseVM = {
  oxygenSaturation: number | null;
  createdAt: string;
};

export type BloodPressureResponseVM = {
  systolic: number | null;
  diastolic: number | null;
  createdAt: string;
};

// --------- DTOs ---------
export type VitalSignsCreateDTO = Omit<VitalSigns, 'id' | 'createdDate' | 'lastModifiedDate'>;

export type VitalSignsUpdateDTO = VitalSignsCreateDTO;

// --------- API ---------
export const vitalSignsService = createApi({
  reducerPath: 'newVitalSignsApi',
  baseQuery: BaseQuery,
  tagTypes: ['VitalSigns'],
  endpoints: (builder) => ({
    createVitalSigns: builder.mutation<VitalSigns, VitalSignsCreateDTO>({
      query: (body) => ({
        url: '/api/patient/vital-signs',
        method: 'POST',
        body
      }),
      invalidatesTags: ['VitalSigns']
    }),

    updateVitalSigns: builder.mutation<VitalSigns, { id: Id } & VitalSignsUpdateDTO>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/vital-signs/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['VitalSigns']
    }),

    getLatestVitalSignsByEncounterId: builder.query<VitalSigns, { encounterId: Id }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/vital-signs/latest/encounter/${encodeURIComponent(String(encounterId))}`
      }),
      providesTags: ['VitalSigns']
    }),

    getLatestTriageVitalSignsByEncounterId: builder.query<VitalSigns, { encounterId: Id }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/vital-signs/latest/triage/encounter/${encodeURIComponent(
          String(encounterId)
        )}`
      }),
      providesTags: ['VitalSigns']
    }),

    // ===================== NEW ENDPOINTS =====================

    getVitalSignsBetweenDatesByPatientId: builder.query<
      SpringPage<VitalSignsResponseVM>,
      { patientId: Id; from?: string; to?: string; page?: number; size?: number; sort?: string }
    >({
      query: ({ patientId, from, to, page, size, sort }) => ({
        url: `/api/patient/vital-signs/patient/${encodeURIComponent(
          String(patientId)
        )}/between-dates`,
        params: { from, to, page, size, sort }
      }),
      providesTags: ['VitalSigns']
    }),

    getRespiratoryRateListByPatientBetweenDates: builder.query<
      RespiratoryRateResponseVM[],
      { patientId: Id; from: string; to: string }
    >({
      query: ({ patientId, from, to }) => ({
        url: `/api/patient/vital-signs/patient/${encodeURIComponent(
          String(patientId)
        )}/respiratory-rate/list`,
        params: { from, to }
      }),
      providesTags: ['VitalSigns']
    }),

    getTemperatureListByPatientBetweenDates: builder.query<
      TemperatureResponseVM[],
      { patientId: Id; from: string; to: string }
    >({
      query: ({ patientId, from, to }) => ({
        url: `/api/patient/vital-signs/patient/${encodeURIComponent(
          String(patientId)
        )}/temperature/list`,
        params: { from, to }
      }),
      providesTags: ['VitalSigns']
    }),

    getPulseRateListByPatientBetweenDates: builder.query<
      PulseRateResponseVM[],
      { patientId: Id; from: string; to: string }
    >({
      query: ({ patientId, from, to }) => ({
        url: `/api/patient/vital-signs/patient/${encodeURIComponent(
          String(patientId)
        )}/pulse-rate/list`,
        params: { from, to }
      }),
      providesTags: ['VitalSigns']
    }),

    getOxygenSaturationListByPatientBetweenDates: builder.query<
      OxygenSaturationResponseVM[],
      { patientId: Id; from: string; to: string }
    >({
      query: ({ patientId, from, to }) => ({
        url: `/api/patient/vital-signs/patient/${encodeURIComponent(
          String(patientId)
        )}/oxygen-saturation/list`,
        params: { from, to }
      }),
      providesTags: ['VitalSigns']
    }),

    getBloodPressureListByPatientBetweenDates: builder.query<
      BloodPressureResponseVM[],
      { patientId: Id; from: string; to: string }
    >({
      query: ({ patientId, from, to }) => ({
        url: `/api/patient/vital-signs/patient/${encodeURIComponent(
          String(patientId)
        )}/blood-pressure/list`,
        params: { from, to }
      }),
      providesTags: ['VitalSigns']
    })
  })
});

export const {
  useCreateVitalSignsMutation,
  useUpdateVitalSignsMutation,
  useGetLatestVitalSignsByEncounterIdQuery,
  useLazyGetLatestVitalSignsByEncounterIdQuery,
  useGetLatestTriageVitalSignsByEncounterIdQuery,
  useLazyGetLatestTriageVitalSignsByEncounterIdQuery,
  useGetVitalSignsBetweenDatesByPatientIdQuery,
  useLazyGetVitalSignsBetweenDatesByPatientIdQuery,
  useGetRespiratoryRateListByPatientBetweenDatesQuery,
  useLazyGetRespiratoryRateListByPatientBetweenDatesQuery,
  useGetTemperatureListByPatientBetweenDatesQuery,
  useLazyGetTemperatureListByPatientBetweenDatesQuery,
  useGetPulseRateListByPatientBetweenDatesQuery,
  useLazyGetPulseRateListByPatientBetweenDatesQuery,
  useGetOxygenSaturationListByPatientBetweenDatesQuery,
  useLazyGetOxygenSaturationListByPatientBetweenDatesQuery,
  useGetBloodPressureListByPatientBetweenDatesQuery,
  useLazyGetBloodPressureListByPatientBetweenDatesQuery
} = vitalSignsService;