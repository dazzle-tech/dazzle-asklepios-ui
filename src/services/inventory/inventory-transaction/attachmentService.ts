import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { DownloadTicket, InventoryTransactionAttachment, UploadInventoryTransactionAttachmentParams, UploadResponse } from '@/types/model-types-new';

type PagedResult<T> = { data: T[]; totalCount: number };

export const inventoryTransactionAttachmentService = createApi({
  reducerPath: 'inventoryTransactionAttachmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['InventoryTransactionAttachment'],
  endpoints: builder => ({
    // POST /api/setup/inventoryTransaction/{transactionId}/attachments
    uploadAttachments: builder.mutation<UploadResponse, UploadInventoryTransactionAttachmentParams>({
      query: ({ transactionId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return {
          url: `/api/setup/inventoryTransaction/${transactionId}/attachments`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { transactionId }) => [
        { type: 'InventoryTransactionAttachment', id: transactionId }
      ],
    }),

    // GET /api/setup/inventoryTransaction/attachments/by-transactionId?transactionId=1
    getInventoryTransactionAttachments: builder.query<PagedResult<InventoryTransactionAttachment>, { transactionId: number }>({
      query: ({ transactionId }) => ({
        url: `/api/setup/inventoryTransaction/attachments/by-transactionId`,
        method: 'GET',
        params: { transactionId },
      }),
      transformResponse: (response: InventoryTransactionAttachment[]): PagedResult<InventoryTransactionAttachment> => ({
        data: response || [],
        totalCount: response?.length || 0,
      }),
      providesTags: (_res, _err, { transactionId }) => [
        { type: 'InventoryTransactionAttachment', id: transactionId }
      ],
    }),

    // POST /api/setup/inventoryTransaction/attachmentDownloadUrl/{id}
    getDownloadUrl: builder.mutation<DownloadTicket, number>({
      query: (id) => ({
        url: `/api/setup/inventoryTransaction/attachmentDownloadUrl/${id}`,
        method: 'POST',
      }),
    }),

    // DELETE /api/setup/inventoryTransaction/attachments/{id}
    deleteAttachment: builder.mutation<void, { id: number; transactionId: number }>({
      query: ({ id }) => ({
        url: `/api/setup/inventoryTransaction/attachments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { transactionId }) => [
        { type: 'InventoryTransactionAttachment', id: transactionId }
      ],
    }),
  }),
});

export const {
  useUploadAttachmentsMutation,
  useGetInventoryTransactionAttachmentsQuery,
  useLazyGetInventoryTransactionAttachmentsQuery,
  useGetDownloadUrlMutation,
  useDeleteAttachmentMutation,
} = inventoryTransactionAttachmentService;

