import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { DownloadTicket, InventoryTransferAttachment, UploadInventoryTransferAttachmentParams, UploadResponse } from '@/types/model-types-new';

type PagedResult<T> = { data: T[]; totalCount: number };

export const inventoryTransferAttachmentService = createApi({
  reducerPath: 'inventoryTransferAttachmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['InventoryTransferAttachment'],
  endpoints: builder => ({
    // POST /api/setup/inventoryTransfer/{transactionId}/attachments
    uploadAttachments: builder.mutation<UploadResponse, UploadInventoryTransferAttachmentParams>({
      query: ({ transactionId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return {
          url: `/api/setup/inventoryTransfer/${transactionId}/attachments`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { transactionId }) => [
        { type: 'InventoryTransferAttachment', id: transactionId }
      ],
    }),

    // GET /api/setup/inventoryTransfer/attachments/by-transactionId?transactionId=1
    getInventoryTransferAttachments: builder.query<PagedResult<InventoryTransferAttachment>, { transactionId: number }>({
      query: ({ transactionId }) => ({
        url: `/api/setup/inventoryTransfer/attachments/by-transactionId`,
        method: 'GET',
        params: { transactionId },
      }),
      transformResponse: (response: InventoryTransferAttachment[]): PagedResult<InventoryTransferAttachment> => ({
        data: response || [],
        totalCount: response?.length || 0,
      }),
      providesTags: (_res, _err, { transactionId }) => [
        { type: 'InventoryTransferAttachment', id: transactionId }
      ],
    }),

    // POST /api/setup/inventoryTransfer/attachmentDownloadUrl/{id}
    getDownloadUrl: builder.mutation<DownloadTicket, number>({
      query: (id) => ({
        url: `/api/setup/inventoryTransfer/attachmentDownloadUrl/${id}`,
        method: 'POST',
      }),
    }),

    // DELETE /api/setup/inventoryTransfer/attachments/{id}
    deleteAttachment: builder.mutation<void, { id: number; transactionId: number }>({
      query: ({ id }) => ({
        url: `/api/setup/inventoryTransfer/attachments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { transactionId }) => [
        { type: 'InventoryTransferAttachment', id: transactionId }
      ],
    }),
  }),
});

export const {
  useUploadAttachmentsMutation,
  useGetInventoryTransferAttachmentsQuery,
  useLazyGetInventoryTransferAttachmentsQuery,
  useGetDownloadUrlMutation,
  useDeleteAttachmentMutation,
} = inventoryTransferAttachmentService;

