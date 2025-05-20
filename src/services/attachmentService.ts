import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { onQueryStarted, baseQuery } from '@/api';
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import { ApAttachment } from '@/types/model-types';
export const attachmentService = createApi({
  reducerPath: 'attachmentApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    upload: builder.mutation({
      query: (data: { formData: FormData; type: string; refKey: string, details:string ,accessType:string ,createdBy:string}) => ({
        url: `/attachment/upload`,
        method: 'POST',
        body: data.formData,
        headers: {
          type: data.type,
          ref_key: data.refKey,
          details:data.details,
          access_type:data.accessType,
          created_by:data.createdBy
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    fetchAttachmentsList: builder.query<ApAttachment[], { type: string; refKeys: string[] }>({
      query: (data) => ({
        url: '/attachment/fetch-attachments-list', 
        method: 'POST',
        headers: {
          type: data.type,
          'Content-Type': 'application/json',
        },
        body: data.refKeys,
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      },
      keepUnusedDataFor: 0,
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
      query: (data: { key: string, attachmentDetails: string ,updatedBy:string ,accessType:string }) => ({
        url: `/attachment/update-Attachment-details`,
        method: 'PUT',
        headers: {
          key: data.key,
          attachmentDetails: data.attachmentDetails,
          updatedBy:data.updatedBy,
          accessType:data.accessType
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
      getPatientAttachmentsList: builder.query({
          query: (listRequest: ListRequest) => ({
             url: `/attachment/patient-attachment-list?${fromListRequestToQueryParams(listRequest)}`
          }),
          onQueryStarted: onQueryStarted,
          keepUnusedDataFor: 5
        }),
  })
});

export const { useUploadMutation,
  useFetchAttachmentsListQuery,
   useFetchAttachmentQuery,
   useFetchAttachmentLightQuery,
   useFetchAttachmentByKeyQuery,
   useDeleteAttachmentMutation,
   useUpdateAttachmentDetailsMutation,
   useGetPatientAttachmentsListQuery
} = attachmentService;
