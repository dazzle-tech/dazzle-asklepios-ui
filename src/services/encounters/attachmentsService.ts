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
    uploadAttachment: builder.mutation<UploadResponse, UploadEncounterAttachmentParams>({
      query: ({ encounterId, file, type, details, source, sourceId }) => {
        const formData = new FormData();
        
        formData.append('file', file);
        const finalSourceId = sourceId !== undefined && sourceId !== null ? sourceId : 0;
        formData.append('sourceId', String(finalSourceId));
        
        if (type && type.trim()) {
          formData.append('type', type);
        }
        if (details && details.trim()) {
          formData.append('details', details);
        }
        if (source && source.trim()) {
          formData.append('source', source);
        }
        
        // Log FormData contents for debugging
        console.log('Upload Encounter Attachment Request:', {
          encounterId,
          sourceId: finalSourceId,
          source,
          type,
          details,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });
        for (let pair of formData.entries()) {
          console.log(pair[0], '=', pair[1]);
        }
        
        return {
          url: `/api/setup/encounters/${encounterId}/attachments`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { encounterId }) => [
        { type: 'EncounterAttachment', id: encounterId }
      ],
    }),

    // GET /api/setup/encounters/attachments/by-encounterIdAndSource/{encounterId}/{source}?sourceId={sourceId}
    getEncounterAttachmentsBySource: builder.query<PagedResult<EncounterAttachment>, { encounterId: number; source: string; sourceId?: number }>({
      query: ({ encounterId, source, sourceId }) => {
        const params = new URLSearchParams();
        if (sourceId !== undefined && sourceId !== null) {
          params.append('sourceId', String(sourceId));
        }
        
        const queryString = params.toString();
        const url = `/api/setup/encounters/attachments/by-encounterIdAndSource/${encounterId}/${source}${queryString ? `?${queryString}` : ''}`;
        
        console.log('Fetching encounter attachments:', { encounterId, source, sourceId, url });
        
        return {
          url,
          method: 'GET',
        };
      },
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
  useUploadAttachmentMutation,
  useGetEncounterAttachmentsBySourceQuery,
  useLazyGetEncounterAttachmentsBySourceQuery,
  useGetDownloadUrlMutation,
  useUpdateAttachmentMutation,
  useDeleteAttachmentMutation,
} = encounterAttachmentsService;

