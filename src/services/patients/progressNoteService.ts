import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import {
  ProgressNote,
  ProgressNoteCreateVM,
  ProgressNoteUpdateVM,
  ProgressNoteCancelVM,
  ProgressNoteLogVM
} from '@/types/model-types-new';

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

export const progressNoteService = createApi({
  reducerPath: 'progressNoteApi',
  baseQuery: BaseQuery,
  tagTypes: ['ProgressNote'],

  endpoints: builder => ({
    // ------------------
    // CREATE
    // ------------------
    create: builder.mutation<ProgressNote, ProgressNoteCreateVM>({
      query: body => ({
        url: '/api/patient/progress-notes',
        method: 'POST',
        body
      }),
      invalidatesTags: ['ProgressNote']
    }),

    // ------------------
    // UPDATE
    // ------------------
    update: builder.mutation<ProgressNote, ProgressNoteUpdateVM>({
      query: body => ({
        url: `/api/patient/progress-notes/${body.id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ProgressNote']
    }),

    // ------------------
    // CANCEL
    // ------------------
    cancel: builder.mutation<ProgressNote, ProgressNoteCancelVM>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/progress-notes/${id}/cancel`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ProgressNote']
    }),

    // ------------------
    // FIND NOT CANCELLED
    // ------------------
    findByEncounterNotCancelled: builder.query<
      PagedResult<ProgressNote>,
      {
        encounterId: number;
        page?: number;
        size?: number;
      }
    >({
      query: ({ encounterId, page = 0, size = 20 }) => ({
        url: `/api/patient/progress-notes/by-encounter/${encounterId}/not-cancelled`,
        params: { page, size }
      }),

      transformResponse: (response: ProgressNote[], meta): PagedResult<ProgressNote> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['ProgressNote']
    }),

    // ------------------
    // FIND ALL (including cancelled)
    // ------------------
    findByEncounterAll: builder.query<
      PagedResult<ProgressNote>,
      {
        encounterId: number;
        page?: number;
        size?: number;
      }
    >({
      query: ({ encounterId, page = 0, size = 20 }) => ({
        url: `/api/patient/progress-notes/by-encounter/${encounterId}/all`,
        params: { page, size }
      }),

      transformResponse: (response: ProgressNote[], meta): PagedResult<ProgressNote> => {
        const totalCount = Number(meta?.response?.headers.get('X-Total-Count')) || 0;

        return {
          data: response ?? [],
          totalCount
        };
      },

      providesTags: ['ProgressNote']
    }),

    // ------------------
    // LOGS
    // ------------------
    findLogs: builder.query<ProgressNoteLogVM[], number>({
      query: progressNoteId => ({
        url: `/api/patient/progress-notes/${progressNoteId}/logs`,
        method: 'GET'
      })
    })
  })
});

export const {
  useCreateMutation,
  useUpdateMutation,
  useCancelMutation,
  useFindByEncounterNotCancelledQuery,
  useFindByEncounterAllQuery,
  useFindLogsQuery
} = progressNoteService;
