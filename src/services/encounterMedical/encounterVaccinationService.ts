import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export type LinksMap = { first?: string; prev?: string; next?: string; last?: string };
export type PatientVaccineIdsResp = number[];

export type PatientVaccineDetailsResp = {
  records: any[]; 
  brandIds: number[];
  doseIds: number[];
};

const parseLinkHeader = (linkHeader?: string | null): LinksMap => {
  if (!linkHeader) return {};
  const links: LinksMap = {};
  const parts = linkHeader
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="([^"]+)"/i);
    if (!match) continue;
    const url = match[1];
    const rel = match[2] as keyof LinksMap;
    if (rel === 'first' || rel === 'prev' || rel === 'next' || rel === 'last') links[rel] = url;
  }
  return links;
};

type PagedResp = { data: any[]; totalCount: number; links: LinksMap };

const toPaged = (response: any, meta: any): PagedResp => {
  const headers = meta?.response?.headers;
  return {
    data: Array.isArray(response) ? response : response?.data ?? [],
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const encounterVaccinationService = createApi({
  reducerPath: 'encounterVaccinationApi',
  baseQuery: BaseQuery,
  tagTypes: ['EncounterVaccination'],
  endpoints: builder => ({
    getEncounterVaccinationsActive: builder.query<
      PagedResp,
      { encounterId: number; page: number; size: number; sort: string; timestamp?: number }
    >({
      query: ({ encounterId, page, size, sort }) => ({
        url: `/api/patient/encounter-vaccination/encounter/${encounterId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any, meta) => toPaged(response, meta),
      providesTags: ['EncounterVaccination']
    }),

    getEncounterVaccinationsAll: builder.query<
      PagedResp,
      { encounterId: number; page: number; size: number; sort: string; timestamp?: number }
    >({
      query: ({ encounterId, page, size, sort }) => ({
        url: `/api/patient/encounter-vaccination/encounter/${encounterId}/all`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any, meta) => toPaged(response, meta),
      providesTags: ['EncounterVaccination']
    }),

    getPatientVaccinationsActive: builder.query<
      PagedResp,
      { patientId: number; page: number; size: number; sort: string; timestamp?: number }
    >({
      query: ({ patientId, page, size, sort }) => ({
        url: `/api/patient/encounter-vaccination/patient/${patientId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any, meta) => toPaged(response, meta),
      providesTags: ['EncounterVaccination']
    }),

    getPatientVaccinationsAll: builder.query<
      PagedResp,
      { patientId: number; page: number; size: number; sort: string; timestamp?: number }
    >({
      query: ({ patientId, page, size, sort }) => ({
        url: `/api/patient/encounter-vaccination/patient/${patientId}/all`,
        params: { page, size, sort }
      }),
      transformResponse: (response: any, meta) => toPaged(response, meta),
      providesTags: ['EncounterVaccination']
    }),

    addEncounterVaccination: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient/encounter-vaccination',
        method: 'POST',
        body
      }),
      invalidatesTags: ['EncounterVaccination']
    }),

    updateEncounterVaccination: builder.mutation<any, any>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/encounter-vaccination/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['EncounterVaccination']
    }),

    cancelEncounterVaccination: builder.mutation<
      any,
      { id: number; cancellationReason: string }
    >({
      query: body => ({
        url: `/api/patient/encounter-vaccination/cancel`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['EncounterVaccination']
    }),

    reviewEncounterVaccination: builder.mutation<any, { id: number }>({
      query: body => ({
        url: `/api/patient/review`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['EncounterVaccination']
    }),

    getPatientVaccineIds: builder.query<PatientVaccineIdsResp, { patientId: number; timestamp?: number }>({
      query: ({ patientId }) => ({
        url: `/api/patient/encounter-vaccination/patient/${patientId}/vaccine-ids`
      }),
      transformResponse: (res: any) => (Array.isArray(res) ? res : []),
      providesTags: ['EncounterVaccination']
    }),

    getPatientVaccineDetails: builder.query<
      { records: PagedResp; brandIds: number[]; doseIds: number[] },
      {
        patientId: number;
        vaccineId: number;
        includeCancelled?: boolean;
        page: number;
        size: number;
        sort: string;
        timestamp?: number;
      }
    >({
      query: ({ patientId, vaccineId, includeCancelled = false, page, size, sort }) => ({
        url: `/api/patient/encounter-vaccination/patient/${patientId}/vaccine/${vaccineId}/details`,
        params: { includeCancelled, page, size, sort }
      }),
      transformResponse: (response: any, meta) => {
        const pageJson = response?.records ?? {};
        const content = Array.isArray(pageJson?.content) ? pageJson.content : [];
        const headers = meta?.response?.headers;

        const recordsPaged: PagedResp = {
          data: content,
          totalCount: Number(headers?.get('X-Total-Count') ?? pageJson?.totalElements ?? content.length ?? 0),
          links: parseLinkHeader(headers?.get('Link'))
        };

        return {
          records: recordsPaged,
          brandIds: Array.isArray(response?.brandIds) ? response.brandIds : [],
          doseIds: Array.isArray(response?.doseIds) ? response.doseIds : []
        };
      },
      providesTags: ['EncounterVaccination']
    })
  })
});

export const {
  useGetEncounterVaccinationsActiveQuery,
  useGetEncounterVaccinationsAllQuery,

  useGetPatientVaccinationsActiveQuery,
  useGetPatientVaccinationsAllQuery,

  useGetPatientVaccineIdsQuery,
  useGetPatientVaccineDetailsQuery,
  useLazyGetPatientVaccineDetailsQuery,

  useAddEncounterVaccinationMutation,
  useUpdateEncounterVaccinationMutation,
  useCancelEncounterVaccinationMutation,
  useReviewEncounterVaccinationMutation
} = encounterVaccinationService;
