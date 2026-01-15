import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  DiagnosticOrderTest,
  DiagnosticOrderTestCreateDTO,
  DiagnosticOrderTestUpdateDTO,
  DiagnosticOrderTestRejectDTO,
  DiagnosticOrderTestCancelDTO,
} from '@/types/model-types-new';

/* ===================== TYPES ===================== */

type PageableParams = {
  page?: number;
  size?: number;
  sort?: string;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

/* ===================== SERVICE ===================== */

export const diagnosticOrderTestService = createApi({
  reducerPath: 'diagnosticOrderTestApi',
  baseQuery: BaseQuery,
  tagTypes: ['DiagnosticOrderTest'],
  endpoints: builder => ({

    /* -------------------------------------------------
     * CRUD
     * ------------------------------------------------- */

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

    /* -------------------------------------------------
     * GET tests by orderId (with pagination)
     * ------------------------------------------------- */

    getTestsByOrderId: builder.query<
      PagedResult<DiagnosticOrderTest>,
      {
        orderId: number;
        status?: string;
        excludeStatus?: string[];
      } & PageableParams
    >({
      query: ({ orderId, ...params }) => ({
        url: `/api/patient/diagnostic-orders/${orderId}/tests`,
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

    /* -------------------------------------------------
     * FILTER (diagnostic-order-tests)
     * ------------------------------------------------- */

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

    /* -------------------------------------------------
     * ACTIONS (Status Transitions)
     * ------------------------------------------------- */

    collectSample: builder.mutation<DiagnosticOrderTest, number>({
      query: id => ({
        url: `/api/patient/diagnostic-order-tests/${id}/collect-sample`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrderTest', id },
      ],
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
      { id: number; body: DiagnosticOrderTestRejectDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-order-tests/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticOrderTest', id },
      ],
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

/* ===================== HOOKS ===================== */

export const {
  useCreateDiagnosticOrderTestMutation,
  useUpdateDiagnosticOrderTestMutation,
  useGetDiagnosticOrderTestByIdQuery,
  useDeleteDiagnosticOrderTestMutation,

  useGetTestsByOrderIdQuery,
  useLazyGetTestsByOrderIdQuery,

  useFilterDiagnosticOrderTestsQuery,
  useLazyFilterDiagnosticOrderTestsQuery,

  useCollectSampleMutation,
  useAcceptDiagnosticOrderTestMutation,
  useMarkReadyMutation,
  useReviewDiagnosticOrderTestMutation,
  useApproveDiagnosticOrderTestMutation,
  useRejectDiagnosticOrderTestMutation,
  useCancelDiagnosticOrderTestMutation,
} = diagnosticOrderTestService;
