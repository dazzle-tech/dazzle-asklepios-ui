import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { DownloadTicket, EncounterAttachment, UploadEncounterAttachmentParams, UploadResponse } from '@/types/model-types-new';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type PagedResult<T> = { data: T[]; totalCount: number };

export const encounterAttachmentsService = createApi({
  reducerPath: 'encounterAttachmentsApi',
  baseQuery: BaseQuery,
  tagTypes: ['EncounterAttachment'],
  endpoints: builder => ({
    // POST /api/setup/encounters/{encounterId}/attachments
    uploadAttachments: builder.mutation<UploadResponse[], UploadEncounterAttachmentParams>({
      query: ({ encounterId, files, type, details, source }) => {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
    
        // Build params object with optional fields
        const params: any = { };
        if (type && type.trim()) params.type = type;
        if (details && details.trim()) params.details = details;
        if (source && source.trim()) params.source = source;
        return {
          url: `/api/setup/encounters/${encounterId}/attachments`,
          method: 'POST',
          params,
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterAttachment', id: encounterId }
      ],
    }),

    // GET /api/setup/encounters/attachments/by-encounterIdAndSource/{encounterId}/{source}
    getEncounterAttachmentsBySource: builder.query<PagedResult<EncounterAttachment>, { encounterId: number; source: string }>({
      query: ({ encounterId, source }) => ({
        url: `/api/setup/encounters/attachments/by-encounterIdAndSource/${encounterId}/${source}`,
        method: 'GET',
      }),
      transformResponse: (response: EncounterAttachment[]): PagedResult<EncounterAttachment> => ({
        data: response || [],
        totalCount: response?.length || 0,
      }),
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterAttachment', id: encounterId }
      ],
    }),

    // POST /api/setup/encounters/attachmentDownloadUrl/{id}
    getDownloadUrl: builder.mutation<DownloadTicket, number>({
      query: (id) => ({
        url: `/api/setup/encounters/attachmentDownloadUrl/${id}`,
        method: 'POST',
      }),
    }),

    // PUT /api/setup/encounters/attachments/{id}
    updateAttachment: builder.mutation<EncounterAttachment, { id: number; encounterId: number; type?: string; details?: string }>({
      query: ({ id, type, details }) => ({
        url: `/api/setup/encounters/attachments/${id}`,
        method: 'PUT',
        body: {
          type,
          details,
        },
      }),
      invalidatesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterAttachment', id: encounterId }
      ],
    }),

    // DELETE /api/setup/encounters/attachments/{id}
    deleteAttachment: builder.mutation<void, { id: number; encounterId: number }>({
      query: ({ id }) => ({
        url: `/api/setup/encounters/attachments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterAttachment', id: encounterId }
      ],
    }),
  }),
});

export const {
  useUploadAttachmentsMutation,
  useGetEncounterAttachmentsBySourceQuery,
  useLazyGetEncounterAttachmentsBySourceQuery,
  useGetDownloadUrlMutation,
  useUpdateAttachmentMutation,
  useDeleteAttachmentMutation,
} = encounterAttachmentsService;

