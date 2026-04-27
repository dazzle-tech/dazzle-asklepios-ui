import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import {
  TelephonicConsultation,
  TelephonicConsultationCreateVM,
  TelephonicConsultationUpdateVM
} from '@/types/model-types-new';

type SpringPageResponse<T> = {
  content: T[];
  totalElements: number;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

type FindAllByEncounterParams = {
  encounterId: string;
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
  includeCancelled?: boolean;
};

export const telephonicConsultationService = createApi({
  reducerPath: 'telephonicConsultationApi',
  baseQuery: BaseQuery,
  tagTypes: ['TelephonicConsultation'],

  endpoints: builder => ({
    create: builder.mutation<TelephonicConsultation, TelephonicConsultationCreateVM>({
      query: body => ({
        url: '/api/patient/telephonic-consultation',
        method: 'POST',
        body
      }),
      invalidatesTags: ['TelephonicConsultation']
    }),

    update: builder.mutation<TelephonicConsultation, TelephonicConsultationUpdateVM>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/telephonic-consultation/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['TelephonicConsultation']
    }),

    cancel: builder.mutation<TelephonicConsultation, { id: number; reason: string }>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/telephonic-consultation/${id}/cancel`,
        method: 'PUT',
        body // ✅ JSON body
      }),
      invalidatesTags: ['TelephonicConsultation']
    }),

    findNotCancelledByEncounter: builder.query<
      PagedResult<TelephonicConsultation>,
      { encounterId: string; page?: number; size?: number }
    >({
      query: ({ encounterId, page = 0, size = 20 }) => ({
        url: `/api/patient/telephonic-consultation/not-cancelled/by-encounter/${encounterId}`,
        params: { page, size }
      }),

      transformResponse: (
        response: TelephonicConsultation[],
        meta
      ): PagedResult<TelephonicConsultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['TelephonicConsultation']
    }),

    findByPatient: builder.query<
      PagedResult<TelephonicConsultation>,
      { patientId: string; page?: number; size?: number }
    >({
      query: ({ patientId, page = 0, size = 20 }) => ({
        url: `/api/patient/telephonic-consultation/by-patient/${patientId}`,
        params: { page, size }
      }),

      transformResponse: (
        response: TelephonicConsultation[],
        meta
      ): PagedResult<TelephonicConsultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['TelephonicConsultation']
    }),

    findAllByEncounter: builder.query<
      PagedResult<TelephonicConsultation>,
      FindAllByEncounterParams
    >({
      query: ({
        encounterId,
        page = 0,
        size = 20,
        fromDate,
        toDate,
        includeCancelled = false
      }) => ({
        url: `/api/patient/telephonic-consultation/by-encounter/${encounterId}`,
        params: {
          page,
          size,
          fromDate,
          toDate,
          includeCancelled
        }
      }),

      transformResponse: (
        response: TelephonicConsultation[],
        meta
      ): PagedResult<TelephonicConsultation> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['TelephonicConsultation']
    })
  })
});

export const {
  useCreateMutation,
  useUpdateMutation,
  useCancelMutation,
  useFindNotCancelledByEncounterQuery,
  useFindAllByEncounterQuery,
  useFindByPatientQuery
} = telephonicConsultationService;