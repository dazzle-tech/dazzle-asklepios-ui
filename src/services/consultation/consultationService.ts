import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { Consultation, ConsultationUpdatePayload } from '@/types/model-types-new';

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

type FindByEncounterParams = {
  encounterId: string;
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
  includeCancelled?: boolean;
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

    cancel: builder.mutation<
      Consultation,
      { id: number; cancellationReason: string; cancelledBy?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/api/patient/consultation/${id}/cancel`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Consultation']
    }),

    findNotCancelledByEncounter: builder.query<
      PagedResult<Consultation>,
      { encounterId: string; page?: number; size?: number }
    >({
      query: ({ encounterId, page = 0, size = 20 }) => ({
        url: `/api/patient/consultation/not-cancelled/by-encounter/${encounterId}`,
        params: { page, size }
      }),

      transformResponse: (response: Consultation[], meta): PagedResult<Consultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;
        return { data: response ?? [], totalCount };
      },

      providesTags: ['Consultation']
    }),

    findByEncounter: builder.query<PagedResult<Consultation>, FindByEncounterParams>({
      query: ({
        encounterId,
        page = 0,
        size = 20,
        fromDate,
        toDate,
        includeCancelled = false
      }) => ({
        url: `/api/patient/consultation/by-encounter/${encounterId}`,
        params: { page, size, fromDate, toDate, includeCancelled }
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
    }),

    findByEncounterAll: builder.query<
      PagedResult<Consultation>,
      { encounterId: string; page?: number; size?: number }
    >({
      query: ({ encounterId, page = 0, size = 20 }) => ({
        url: `/api/patient/consultation/by-encounter/${encounterId}/all`,
        params: { page, size }
      }),

      transformResponse: (response: Consultation[], meta): PagedResult<Consultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;
        return { data: response ?? [], totalCount };
      },

      providesTags: ['Consultation']
    })
  })
});

export const {
  useCreateMutation,
  useUpdateMutation,
  useCancelMutation,
  useFindNotCancelledByEncounterQuery,
  useFindByEncounterQuery,
  useGetDepartmentIdsByEncounterQuery,
  useGetPractitionerIdsByEncounterQuery,
  useFindByEncounterAllQuery
} = consultationService;
