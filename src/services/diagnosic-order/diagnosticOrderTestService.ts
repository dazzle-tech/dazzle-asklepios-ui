import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  DiagnosticOrderTest,
  DiagnosticOrderTestCreateDTO,
  DiagnosticOrderTestUpdateDTO,
  DiagnosticOrderTestRejectDTO,
  DiagnosticOrderTestCancelDTO,
  BulkIdsDTO,
  BulkRejectDTO,
  PatientArrivedCreateRequestDTO,
  PatientArrivedResponseVM,
} from '@/types/model-types-new';


type PageableParams = {
  page?: number;
  size?: number;
  sort?: string;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

export const diagnosticOrderTestService = createApi({
  reducerPath: 'diagnosticOrderTestApi',
  baseQuery: BaseQuery,
  tagTypes: ['DiagnosticOrderTest'],
  endpoints: builder => ({

    createDiagnosticOrderTest: builder.mutation<
      DiagnosticOrderTest,
      DiagnosticOrderTestCreateDTO
    >({
      query: body => ({
        url: '/api/patient/diagnostic-order-tests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DiagnosticOrderTest'],
    }),

    updateDiagnosticOrderTest: builder.mutation<
      DiagnosticOrderTest,
      { id: number; body: DiagnosticOrderTestUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-order-tests/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),

    getDiagnosticOrderTestById: builder.query<
      DiagnosticOrderTest,
      number
    >({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),

    deleteDiagnosticOrderTest: builder.mutation<
      void,
      number
    >({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DiagnosticOrderTest'],
    }),

    getTestsByOrderId: builder.query<
      PagedResult<DiagnosticOrderTest>,
      {
        orderId: number;
        status?: string;
        excludeStatus?: string[];
      } & PageableParams
    >({
      query: ({ orderId, ...params }) => ({
        url: `/api/patient/diagnostic-order-tests/by-order/${orderId}`,
        method: 'GET',
        params,
      }),
      transformResponse: (
        response: DiagnosticOrderTest[],
        meta
      ): PagedResult<DiagnosticOrderTest> => ({
        data: response ?? [],
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0),
      }),
      providesTags: (_r, _e, { orderId }) => [
        { type: 'DiagnosticOrderTest', id: `order-${orderId}` },
      ],
    }),

    filterDiagnosticOrderTests: builder.query<
      PagedResult<DiagnosticOrderTest>,
      Record<string, any> & PageableParams
    >({
      query: params => ({
        url: '/api/patient/diagnostic-order-tests',
        method: 'GET',
        params,
      }),
      transformResponse: (
        response: DiagnosticOrderTest[],
        meta
      ): PagedResult<DiagnosticOrderTest> => ({
        data: response ?? [],
        totalCount: Number(meta?.response?.headers?.get('X-Total-Count') ?? 0),
      }),
      providesTags: ['DiagnosticOrderTest'],
    }),


    acceptDiagnosticOrderTest: builder.mutation<DiagnosticOrderTest, number>({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),

    markReady: builder.mutation<DiagnosticOrderTest, number>({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}/mark-ready`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),

    reviewDiagnosticOrderTest: builder.mutation<DiagnosticOrderTest, number>({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}/review`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),

    approveDiagnosticOrderTest: builder.mutation<DiagnosticOrderTest, number>({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),

    rejectDiagnosticOrderTest: builder.mutation<
      DiagnosticOrderTest,
      { id: number; body: { rejectedReason: string } }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-order-tests/${id}/reject`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticOrderTest', id }
      ],
    }),

    bulkAcceptDiagnosticOrderTests: builder.mutation<
      void,
      BulkIdsDTO
    >({
      query: body => ({
        url: '/api/patient/diagnostic-order-tests/bulk-accept',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DiagnosticOrderTest'],
    }),


    bulkRejectDiagnosticOrderTests: builder.mutation<
      void,
      BulkRejectDTO
    >({
      query: body => ({
        url: '/api/patient/diagnostic-order-tests/bulk-reject',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DiagnosticOrderTest'],
    }),

    undoAcceptDiagnosticOrderTest: builder.mutation<
      DiagnosticOrderTest,
      number
    >({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}/undo-accept`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrderTest', id },
        'DiagnosticOrderTest',
      ],
    }),

    patientArrivedRadiology: builder.mutation<
      PatientArrivedResponseVM,
      { id: number; body: PatientArrivedCreateRequestDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-order-tests/${id}/radiology/patient-arrived`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),


    getPatientArrivedRadiology: builder.query<
      PatientArrivedResponseVM,
      number
    >({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}/radiology/patient-arrived`,
        method: 'GET',
      }),
    }),


    cancelDiagnosticOrderTest: builder.mutation<
      DiagnosticOrderTest,
      { id: number; body: DiagnosticOrderTestCancelDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-order-tests/${id}/cancel`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticOrderTest', id },
      ],
    }),

  }),
});

export const {
  useCreateDiagnosticOrderTestMutation,
  useUpdateDiagnosticOrderTestMutation,
  useGetDiagnosticOrderTestByIdQuery,
  useDeleteDiagnosticOrderTestMutation,
  useGetTestsByOrderIdQuery,
  useLazyGetTestsByOrderIdQuery,
  useFilterDiagnosticOrderTestsQuery,
  useLazyFilterDiagnosticOrderTestsQuery,
  useAcceptDiagnosticOrderTestMutation,
  useMarkReadyMutation,
  useReviewDiagnosticOrderTestMutation,
  useApproveDiagnosticOrderTestMutation,
  useRejectDiagnosticOrderTestMutation,
  useCancelDiagnosticOrderTestMutation,
  useBulkAcceptDiagnosticOrderTestsMutation,
  useBulkRejectDiagnosticOrderTestsMutation,
  useUndoAcceptDiagnosticOrderTestMutation,
  useLazyGetDiagnosticOrderTestByIdQuery,
  usePatientArrivedRadiologyMutation,
  useGetPatientArrivedRadiologyQuery,
} = diagnosticOrderTestService;
