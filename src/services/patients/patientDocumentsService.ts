import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export const patientDocumentsService = createApi({
  reducerPath: 'patientDocumentsApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientDocument'],

  endpoints: builder => ({
    // GET all documents (paged)
    getAllDocuments: builder.query<any, any>({
      query: ({ page, size, sort }) => ({
        url: '/api/patient/documents',
        params: { page, size, sort }
      }),
      transformResponse: (response, meta) => ({
        data: response,
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0)
      }),
      providesTags: ['PatientDocument']
    }),

    // GET all documents for a specific patient (paged)
    getDocumentsByPatient: builder.query<any, any>({
      query: ({ patientId, page, size, sort }) => ({
        url: `/api/patient/documents/patient/${patientId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response, meta) => ({
        data: response,
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0)
      }),
      providesTags: ['PatientDocument']
    }),

    // GET secondary documents (isPrimary = false)
    getSecondaryDocumentsByPatient: builder.query<any, any>({
      query: ({ patientId, page, size, sort }) => ({
        url: `/api/patient/documents/secondary/${patientId}`,
        params: { page, size, sort }
      }),
      transformResponse: (response, meta) => ({
        data: response,
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0)
      }),
      providesTags: ['PatientDocument']
    }),

    // GET primary document (isPrimary = true)
    getPrimaryDocumentsByPatient: builder.query<any, any>({
      query: ({ patientId }) => ({
        url: `/api/patient/documents/primary/${patientId}`
      }),
      providesTags: ['PatientDocument']
    }),

    // CREATE document
    addPatientDocument: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient/documents',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientDocument']
    }),

    // UPDATE document
    updatePatientDocument: builder.mutation<any, any>({
      query: ({ id, ...body }) => ({
        url: `/api/patient/documents/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['PatientDocument']
    }),

    // DELETE document
    deletePatientDocument: builder.mutation<any, any>({
      query: ({ id }) => ({
        url: `/api/patient/documents/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['PatientDocument']
    }),

    addNoDocument: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient/documents/no-document',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientDocument']
    }),
    getPrimaryDocumentByPatient: builder.query<any, number>({
      query: patientId => ({
        url: `/api/patient/documents/patient/${patientId}/primary`
      }),
      providesTags: ['PatientDocument']
    }),
  })
});

export const {
  useGetAllDocumentsQuery,
  useLazyGetAllDocumentsQuery,

  useGetDocumentsByPatientQuery,
  useLazyGetDocumentsByPatientQuery,

  useGetPrimaryDocumentsByPatientQuery,
  useLazyGetPrimaryDocumentsByPatientQuery,

  useGetSecondaryDocumentsByPatientQuery,
  useLazyGetSecondaryDocumentsByPatientQuery,

  useAddPatientDocumentMutation,
  useAddNoDocumentMutation,
  useUpdatePatientDocumentMutation,
  useDeletePatientDocumentMutation,
  useGetPrimaryDocumentByPatientQuery,
  useLazyGetPrimaryDocumentByPatientQuery,
} = patientDocumentsService;
