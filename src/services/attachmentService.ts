import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { onQueryStarted, baseQuery } from '@/api';

export const attachmentService = createApi({
  reducerPath: 'attachmentApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    upload: builder.mutation({
      query: (data: { formData: FormData; type: string; refKey: string, details:string ,accessType:string}) => ({
        url: `/attachment/upload`,
        method: 'POST',
        body: data.formData,
        headers: {
          type: data.type,
          ref_key: data.refKey,
          details:data.details,
          access_type:data.accessType
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    fetchAttachment: builder.query({
      query: (data: { type: string; refKey: string }) => ({
        url: `/attachment/fetch-attachment`,
        headers: {
          type: data.type,
          ref_key: data.refKey
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0
    }),
    FetchAttachmentLight: builder.query({
      query: (data: { refKey: string }) => ({
        url: `/attachment/fetch-attachment-light`,
        headers: {
          ref_key: data.refKey
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0
    }),
    fetchAttachmentByKey: builder.query({
      query: (data: { key: string }) => ({
        url: `/attachment/fetch-attachment-bykey`,
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0
    }),
    deleteAttachment: builder.mutation({
      query: (data: { key: string }) => ({
        url: `/attachment/delete`,
        method: 'DELETE',
        headers: {
          key: data.key
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }) ,
    updateAttachmentDetails: builder.mutation({
      query: (data: { key: string, attachmentDetails: string }) => ({
        url: `/attachment/update-Attachment-details`,
        method: 'PUT',
        headers: {
          key: data.key,
          attachmentDetails: data.attachmentDetails
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
  })
});

export const { useUploadMutation,
   useFetchAttachmentQuery,
   useFetchAttachmentLightQuery,
   useFetchAttachmentByKeyQuery,
   useDeleteAttachmentMutation,
   useUpdateAttachmentDetailsMutation
} = attachmentService;
