// src/services/attachmentService.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '@/newApi'; 
import { ListRequest } from '@/types/types';
import { fromListRequestToQueryParams } from '@/utils';
import { ApAttachment } from '@/types/model-types';

export const attachmentService = createApi({
  reducerPath: 'attachmentApi',
  baseQuery: BaseQuery, 
  endpoints: (builder) => ({
    upload: builder.mutation<
      ApAttachment,
      {
        formData: FormData;
        type: string;
        refKey: string;
        details: string;
        accessType: string;
        createdBy: string;
        patientKey: string;
      }
    >({
      query: (data) => ({
        url: `/attachment/upload`,
        method: 'POST',
        body: data.formData,
        // custom headers with dashes:
        headers: {
          'type': data.type,
          'ref-key': data.refKey,
          'details': data.details,
          'access-type': data.accessType,
          'created-by': data.createdBy,
          'patient-key': data.patientKey,
        },
      }),
      onQueryStarted,
      transformResponse: (response: any) => response.object,
    }),

    fetchAttachmentsList: builder.query<
      ApAttachment[],
      { type: string; refKeys: string[] }
    >({
      query: (data) => ({
        url: '/attachment/fetch-attachments-list',
        method: 'POST',
        headers: {
          type: data.type,
          'Content-Type': 'application/json',
        },
        body: data.refKeys,
      }),
      onQueryStarted,
      transformResponse: (response: any) => response.object,
      keepUnusedDataFor: 0,
    }),

    fetchAttachment: builder.query<ApAttachment, { type: string; refKey: string }>({
      query: (data) => ({
        url: `/attachment/fetch-attachment`,
        headers: {
          type: data.type,
          'ref-key': data.refKey,
        },
      }),
      onQueryStarted,
      transformResponse: (response: any) => response.object,
      keepUnusedDataFor: 0,
    }),


    fetchAttachmentLight: builder.query<ApAttachment, { refKey: string }>({
      query: (data) => ({
        url: `/attachment/fetch-attachment-light`,
        headers: {
          'ref-key': data.refKey,
        },
      }),
      onQueryStarted,
      transformResponse: (response: any) => response.object,
      keepUnusedDataFor: 0,
    }),

    fetchAttachmentByKey: builder.query<ApAttachment, { key: string }>({
      query: (data) => ({
        url: `/attachment/fetch-attachment-bykey`,
        headers: {
          key: data.key,
        },
      }),
      onQueryStarted,
      transformResponse: (response: any) => response.object,
      keepUnusedDataFor: 0,
    }),

    deleteAttachment: builder.mutation<boolean, { key: string }>({
      query: (data) => ({
        url: `/attachment/delete`,
        method: 'DELETE',
        headers: {
          key: data.key,
        },
      }),
      onQueryStarted,
      transformResponse: (response: any) => response.object,
    }),

    updateAttachmentDetails: builder.mutation<
      ApAttachment,
      { key: string; attachmentDetails: string; updatedBy: string; accessType: string }
    >({
      query: (data) => ({
        url: `/attachment/update-Attachment-details`,
        method: 'PUT',
        headers: {
          'key': data.key,
          'attachment-details': data.attachmentDetails,
          'updated-by': data.updatedBy,
          'access-type': data.accessType,
        },
      }),
      onQueryStarted,
      transformResponse: (response: any) => response.object,
    }),

    getPatientAttachmentsList: builder.query<any, ListRequest>({
      query: (listRequest) => ({
        url: `/attachment/patient-attachment-list?${fromListRequestToQueryParams(
          listRequest
        )}`,
      }),
      onQueryStarted,
      keepUnusedDataFor: 5,
    }),
  }),
});

export const {
  useUploadMutation,
  useFetchAttachmentsListQuery,
  useFetchAttachmentQuery,
  useFetchAttachmentLightQuery,
  useFetchAttachmentByKeyQuery,
  useDeleteAttachmentMutation,
  useUpdateAttachmentDetailsMutation,
  useGetPatientAttachmentsListQuery,
} = attachmentService;
