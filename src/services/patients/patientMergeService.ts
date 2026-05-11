import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

export const patientMergeService = createApi({
  reducerPath: 'patientMergeApi',
  baseQuery: BaseQuery,
  tagTypes: ['PatientMerge'],

  endpoints: builder => ({
    previewMerge: builder.query<any, { fromPatientId: number; toPatientId: number }>({
      query: ({ fromPatientId, toPatientId }) => ({
        url: `/api/patient/patient-merge/preview/${fromPatientId}/${toPatientId}`,
        method: 'GET'
      }),
      providesTags: ['PatientMerge']
    }),

    summarizeMerge: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient/patient-merge/summary',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientMerge']
    }),

    executeMerge: builder.mutation<any, any>({
      query: body => ({
        url: '/api/patient/patient-merge/execute',
        method: 'POST',
        body
      }),
      invalidatesTags: ['PatientMerge']
    }),

    undoMerge: builder.mutation<any, { mergeLogId: number }>({
      query: ({ mergeLogId }) => ({
        url: `/api/patient/patient-merge/${mergeLogId}/undo`,
        method: 'POST'
      }),
      invalidatesTags: ['PatientMerge']
    }),

    getMergeTransactions: builder.query<any, { patientId?: number } | void>({
      query: params => ({
        url: params?.patientId
          ? `/api/patient/patient-merge/transactions?patientId=${params.patientId}`
          : '/api/patient/patient-merge/transactions',
        method: 'GET'
      }),
      providesTags: ['PatientMerge']
    }),

    getMergeTransactionChanges: builder.query<any, { mergeLogId: number }>({
      query: ({ mergeLogId }) => ({
        url: `/api/patient/patient-merge/transactions/${mergeLogId}/changes`,
        method: 'GET'
      }),
      providesTags: ['PatientMerge']
    })
  })
});

export const {
  usePreviewMergeQuery,
  useLazyPreviewMergeQuery,
  useSummarizeMergeMutation,
  useExecuteMergeMutation,
  useUndoMergeMutation,
  useGetMergeTransactionsQuery,
  useLazyGetMergeTransactionsQuery,
  useGetMergeTransactionChangesQuery,
  useLazyGetMergeTransactionChangesQuery
} = patientMergeService;