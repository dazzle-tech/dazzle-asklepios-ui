import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { DownloadTicket, PatientAttachment, UploadAttachmentParams, UploadResponse } from '@/types/model-types-new';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type PagedResult<T> = { data: T[]; totalCount: number };

// Spring Boot Page response structure
interface SpringPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const patientAttachmentService = createApi({
  reducerPath: 'patientAttachmentApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientAttachment'],
  endpoints: builder => ({
    // POST /api/setup/patients/{patientId}/attachments
    uploadAttachments: builder.mutation<UploadResponse[], UploadAttachmentParams>({
      query: ({ patientId, files, type, details, source }) => {
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
          url: `/api/setup/patients/${patientId}/attachments`,
          method: 'POST',
          params,
          body: formData,
        };
      },
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'PatientAttachment', id: patientId }
      ],
    }),

    // GET /api/setup/patients/attachments-list-by-patientId/{patientId}
    // Returns List<PatientAttachments> directly (not paginated)
    getPatientAttachments: builder.query<PagedResult<PatientAttachment>, { patientId: number }>({
      query: ({ patientId }) => ({
        url: `/api/setup/patients/attachments-list-by-patientId/${patientId}`,
        method: 'GET',
      }),
      transformResponse: (response: PatientAttachment[]): PagedResult<PatientAttachment> => ({
        data: response || [],
        totalCount: response?.length || 0,
      }),
      providesTags: (_res, _err, { patientId }) => [
        { type: 'PatientAttachment', id: patientId }
      ],
    }),

    // GET /api/setup/patients/{patientId}/profile-picture
    // Returns DownloadTicket directly with presigned URL
    getPatientProfilePicture: builder.query<DownloadTicket, { patientId: number }>({
      query: ({ patientId }) => ({
        url: `/api/setup/patients/${patientId}/profile-picture`,
        method: 'GET',
      }),
      transformResponse: (response: DownloadTicket) => response,
      providesTags: (_res, _err, { patientId }) => [
        { type: 'PatientAttachment', id: `profile-${patientId}` }
      ],
    }),

    // POST /api/setup/patients/attachmentDownloadUrl/{id}
    getDownloadUrl: builder.mutation<DownloadTicket, number>({
      query: (id) => ({
        url: `/api/setup/patients/attachmentDownloadUrl/${id}`,
        method: 'POST',
      }),
    }),

    // PUT /api/setup/patients/attachments/{id}
    updateAttachment: builder.mutation<PatientAttachment, { id: number; patientId: number; type?: string; details?: string }>({
      query: ({ id, type, details }) => ({
        url: `/api/setup/patients/attachments/${id}`,
        method: 'PUT',
        body: {
          type,
          details,
        },
      }),
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'PatientAttachment', id: patientId }
      ],
    }),

    // DELETE /api/setup/patients/attachments/{id}
    deleteAttachment: builder.mutation<void, { id: number; patientId: number }>({
      query: ({ id }) => ({
        url: `/api/setup/patients/attachments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { patientId }) => [
        { type: 'PatientAttachment', id: patientId }
      ],
    }),
  }),
});

export const {
  useUploadAttachmentsMutation,
  useGetPatientAttachmentsQuery,
  useLazyGetPatientAttachmentsQuery,
  useGetPatientProfilePictureQuery,
  useGetDownloadUrlMutation,
  useUpdateAttachmentMutation,
  useDeleteAttachmentMutation,
} = patientAttachmentService;
