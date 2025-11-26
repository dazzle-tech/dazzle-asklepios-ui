import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: any[], meta: any): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const patientDocumentsService = createApi({
  reducerPath: 'patientDocumentsApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientDocument'],

  endpoints: builder => ({
    // ======================================
    // GET ALL DOCUMENTS (PAGED)
    // ======================================
    getAllDocuments: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/patient-documents/documents',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['PatientDocument']
    }),

    // ======================================
    // GET SECONDARY DOCUMENTS (Paged)
    // ======================================
    getSecondaryDocumentsByPatient: builder.query<
      PagedResult<any>,
      { patientId: Id } & PagedParams
    >({
      query: ({ patientId, page, size, sort = 'id,asc' }) => ({
        url: `/api/patient-documents/documents/secondary/${patientId}`,
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['PatientDocument']
    }),

    // ======================================
    // GET PRIMARY DOCUMENTS (Non-paged)
    // ======================================
    getPrimaryDocumentsByPatient: builder.query<any[], { patientId: Id }>({
      query: ({ patientId }) => ({
        url: `/api/patient-documents/documents/primary/${patientId}`
      }),
      providesTags: ['PatientDocument']
    }),

    // ======================================
    // CREATE DOCUMENT
    // ======================================
    addPatientDocument: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient-documents/documents',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientDocument']
    }),

    // ======================================
    // UPDATE DOCUMENT
    // ======================================
    updatePatientDocument: builder.mutation<any, { id: Id } & any>({
      query: ({ id, ...body }) => ({
        url: `/api/patient-documents/documents/${id}`,
        method: 'PUT',
        body: { id, ...body }
      }),
      invalidatesTags: ['PatientDocument']
    }),

    // ======================================
    // DELETE DOCUMENT
    // ======================================
    deletePatientDocument: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient-documents/documents/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['PatientDocument']
    })
  })
});

export const {
  useGetAllDocumentsQuery,
  useLazyGetAllDocumentsQuery,

  useGetPrimaryDocumentsByPatientQuery,
  useLazyGetPrimaryDocumentsByPatientQuery,

  useGetSecondaryDocumentsByPatientQuery,
  useLazyGetSecondaryDocumentsByPatientQuery,

  useAddPatientDocumentMutation,
  useUpdatePatientDocumentMutation,
  useDeletePatientDocumentMutation
} = patientDocumentsService;
