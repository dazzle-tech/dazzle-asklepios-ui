import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { Consultation, ConsultationUpdatePayload } from '@/types/model-types-new';

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

export const consultationService = createApi({
  reducerPath: 'consultationApi',
  baseQuery: BaseQuery,
  tagTypes: ['Consultation'],

  endpoints: builder => ({
    create: builder.mutation<Consultation, Consultation>({
      query: body => ({
        url: '/api/patient/consultation',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Consultation']
    }),

    update: builder.mutation<Consultation, ConsultationUpdatePayload>({
      query: body => ({
        url: `/api/patient/consultation/${body.id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Consultation']
    }),

    cancel: builder.mutation<Consultation, { id: number; cancellationReason: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/consultation/${id}/cancel`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Consultation']
    }),

    findByEncounterAll: builder.query<
      PagedResult<Consultation>,
      { encounterId: string; page?: number; size?: number }
    >({
      query: ({ encounterId, page = 0, size = 20 }) => ({
        url: `/api/patient/consultation/by-encounter/${encounterId}`,
        params: { page, size }
      }),

      transformResponse: (response: Consultation[], meta): PagedResult<Consultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;
        return { data: response ?? [], totalCount };
      },

      providesTags: ['Consultation']
    }),

    findByEncounterNotCancelled: builder.query<
      PagedResult<Consultation>,
      { encounterId: string; page?: number; size?: number }
    >({
      query: ({ encounterId, page = 0, size = 20 }) => ({
        url: `/api/patient/consultation/by-encounter/${encounterId}/not-cancelled`,
        params: { page, size }
      }),

      transformResponse: (response: Consultation[], meta): PagedResult<Consultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;
        return { data: response ?? [], totalCount };
      },

      providesTags: ['Consultation']
    }),

    findByEncounterWithDateRange: builder.query<
      PagedResult<Consultation>,
      { encounterId: string; fromDate: string; toDate: string; page?: number; size?: number }
    >({
      query: ({ encounterId, fromDate, toDate, page = 0, size = 20 }) => ({
        url: `/api/patient/consultation/by-encounter/${encounterId}/date-range`,
        params: { fromDate, toDate, page, size }
      }),

      transformResponse: (response: Consultation[], meta): PagedResult<Consultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;
        return { data: response ?? [], totalCount };
      },

      providesTags: ['Consultation']
    }),

    findByEncounterWithDateRangeNotCancelled: builder.query<
      PagedResult<Consultation>,
      { encounterId: string; fromDate: string; toDate: string; page?: number; size?: number }
    >({
      query: ({ encounterId, fromDate, toDate, page = 0, size = 20 }) => ({
        url: `/api/patient/consultation/by-encounter/${encounterId}/date-range/not-cancelled`,
        params: { fromDate, toDate, page, size }
      }),

      transformResponse: (response: Consultation[], meta): PagedResult<Consultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;
        return { data: response ?? [], totalCount };
      },

      providesTags: ['Consultation']
    }),

    getDepartmentIdsByEncounter: builder.query<number[], { encounterId: string }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/consultation/destination/department-ids/${encounterId}`,
        method: 'GET'
      }),
      providesTags: ['Consultation']
    }),

    getPractitionerIdsByEncounter: builder.query<number[], { encounterId: string }>({
      query: ({ encounterId }) => ({
        url: `/api/patient/consultation/destination/practitioner-ids/${encounterId}`,
        method: 'GET'
      }),
      providesTags: ['Consultation']
    })
  })
});

export const {
  useCreateMutation,
  useUpdateMutation,
  useCancelMutation,

  useFindByEncounterAllQuery,
  useFindByEncounterNotCancelledQuery,
  useFindByEncounterWithDateRangeQuery,
  useFindByEncounterWithDateRangeNotCancelledQuery,

  useGetDepartmentIdsByEncounterQuery,
  useGetPractitionerIdsByEncounterQuery
} = consultationService;
