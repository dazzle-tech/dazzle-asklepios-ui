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
      query: ({ id, ...body }) => ({
        url: `/api/patient/progress-notes/${id}`,
        method: 'PUT',
        body: { id, ...body }
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
    // FIND BY ENCOUNTER (toggle includeCancelled)
    // ------------------
    findByEncounter: builder.query<
      PagedResult<ProgressNote>,
      {
        encounterId: number;
        page?: number;
        size?: number;
        includeCancelled?: boolean;
      }
    >({
      query: ({ encounterId, page = 0, size = 20, includeCancelled = false }) => ({
        url: `/api/patient/progress-notes/by-encounter/${encounterId}`,
        params: { page, size, includeCancelled }
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
  useFindByEncounterQuery,
  useFindLogsQuery
} = progressNoteService;
