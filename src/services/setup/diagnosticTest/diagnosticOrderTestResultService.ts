import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import {
  DiagnosticOrderTestResultResponseVM,
  DiagnosticOrderTestResultCreateDTO,
  DiagnosticOrderTestResultUpdateDTO,
  DiagnosticOrderTestResultRejectDTO,
  LabResultLogResponseVM,
  FilledProfileTestIdsParams,
} from "@/types/model-types-new";
import { createApi } from "@reduxjs/toolkit/query/react";

/* ================= Types ================= */

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
};

type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

export type DiagnosticOrderTestResultFilterParams = {
  orderIdIn?: number;
  orderTestId?: number;
  profileTestId?: number;

  marker?: string;
  excludeMarker?: string;
  processingStatus?: string;

  approvedBy?: string;
  rejectedBy?: string;
  reviewBy?: string;

  approvedDateFrom?: string;
  approvedDateTo?: string;
  rejectedDateFrom?: string;
  rejectedDateTo?: string;
  reviewDateFrom?: string;
  reviewDateTo?: string;

  resultType?: "NUMBER" | "TEXT";
} & PagedParams;

export type AllDiagnosticOrderTestResultsParams = {
  resultDateFrom?: string;
  resultDateTo?: string;
  showAbnormalOnly?: boolean;
} & PagedParams;


export type DiagnosticOrderTestResultResultsVM = {
  id: number;
  orderTestId: number;
  testId: number;
  profileTestId: number;

  resultValueNumber?: number | null;
  resultValueText?: string | null;

  marker?: string | null;
  viewMarker?: string | null;
  viewNormalRange?: string | null;

  resultDate?: string | null;

  patientName?: string | null;
  mrn?: string | null;

  orderedBy?: string | null;
  orderedAt?: string | null;

  encounterId?: number | null;

  hasNote: boolean;
  isRadiology: boolean;
};

export type DiagnosticOrderTestResultsPageParams = {
  resultDateFrom?: string;
  resultDateTo?: string;
  showAbnormalOnly?: boolean;
} & PagedParams;

export type BulkIdsDTO = {
  ids: number[];
};

export type BulkRejectDTO = {
  ids: number[];
  rejectedReason: string;
};
export type DiagnosticOrderTestResultBulkCreateDTO = {
  results: DiagnosticOrderTestResultCreateDTO[];
};
export type DiagnosticOrderTestResultIdsFilterParams = Omit<
  DiagnosticOrderTestResultFilterParams,
  "page" | "size" | "sort"
>;

/* ================= Service ================= */

export const diagnosticOrderTestResultService = createApi({
  reducerPath: "diagnosticOrderTestResultApi",
  baseQuery: BaseQuery,
  tagTypes: ["DiagnosticOrderTestResult"],

  endpoints: (builder) => ({

    /* 🔹 Filter (Paginated) */
    filterDiagnosticOrderTestResults: builder.query<
      PagedResult<DiagnosticOrderTestResultResponseVM>,
      DiagnosticOrderTestResultFilterParams
    >({
      query: ({ page, size, sort, ...params }) => ({
        url: "/api/patient/diagnostic-order-tests-results",
        method: "GET",
        params: {
          page,
          size,
          sort,
          ...params,
        },
      }),
      transformResponse: (
        response: DiagnosticOrderTestResultResponseVM[],
        meta
      ) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 Create */
    createDiagnosticOrderTestResult: builder.mutation<
      DiagnosticOrderTestResultResponseVM,
      DiagnosticOrderTestResultCreateDTO
    >({
      query: (body) => ({
        url: "/api/patient/diagnostic-order-tests-results",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 Update */
    updateDiagnosticOrderTestResult: builder.mutation<
      DiagnosticOrderTestResultResponseVM,
      { id: number; body: DiagnosticOrderTestResultUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-order-tests-results/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 Toggle Review */
    toggleReviewDiagnosticOrderTestResult: builder.mutation<
      DiagnosticOrderTestResultResponseVM,
      number
    >({
      query: (id) => ({
        url: `/api/patient/diagnostic-order-tests-results/${id}/toggle-review`,
        method: "POST",
      }),
      invalidatesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 Approve */
    approveDiagnosticOrderTestResult: builder.mutation<
      DiagnosticOrderTestResultResponseVM,
      number
    >({
      query: (id) => ({
        url: `/api/patient/diagnostic-order-tests-results/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 Results Page */
    getDiagnosticOrderTestResultsPage: builder.query<
      PagedResult<DiagnosticOrderTestResultResultsVM>,
      DiagnosticOrderTestResultsPageParams
    >({
      query: ({ page, size, sort, ...params }) => ({
        url: "/api/patient/diagnostic-order-tests-results/results-page",
        method: "GET",
        params: {
          page,
          size,
          sort,
          ...params,
        },
      }),

      transformResponse: (
        response: DiagnosticOrderTestResultResultsVM[],
        meta
      ) => {
        const headers = meta?.response?.headers;

        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },

      providesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 All Test Results */
    getAllDiagnosticOrderTestResults: builder.query<
      PagedResult<DiagnosticOrderTestResultResponseVM>,
      AllDiagnosticOrderTestResultsParams
    >({
      query: ({ page, size, sort, ...params }) => ({
        url: "/api/patient/diagnostic-order-tests-results/all",
        method: "GET",
        params: {
          page,
          size,
          sort,
          ...params,
        },
      }),

      transformResponse: (
        response: DiagnosticOrderTestResultResponseVM[],
        meta
      ) => {
        const headers = meta?.response?.headers;

        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },

      providesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 Bulk Approve */
    bulkApproveDiagnosticOrderTestResult: builder.mutation<
      void,
      BulkIdsDTO
    >({
      query: (body) => ({
        url: "/api/patient/diagnostic-order-tests-results/bulk-approve",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticOrderTestResult"],
    }),

    getFilledProfileTestIds: builder.query<
      number[],
      FilledProfileTestIdsParams
    >({
      query: ({ orderTestIds }) => ({
        url: "/api/patient/diagnostic-order-tests-results/internal/filled-profile-test-ids",
        method: "GET",
        params: {
          orderTestIds,
        },
      }),
    }),

    getFilledProfileTestIdsByOrderTest: builder.query<
      Record<number, number[]>,
      FilledProfileTestIdsParams
    >({
      query: ({ orderTestIds }) => ({
        url: "/api/patient/diagnostic-order-tests-results/internal/filled-profile-test-ids/by-order-test",
        method: "GET",
        params: {
          orderTestIds,
        },
      }),
    }),

    getLabResultLogsByResultId: builder.query<
      LabResultLogResponseVM[],
      number
    >({
      query: (resultId) => ({
        url: `/api/patient/lab-result-logs/by-result/${resultId}`,
        method: "GET",
      }),
    }),

    rejectDiagnosticOrderTestResult: builder.mutation<
      DiagnosticOrderTestResultResponseVM,
      { id: number; body: DiagnosticOrderTestResultRejectDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-order-tests-results/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticOrderTestResult"],
    }),

    /* 🔹 Bulk Reject */
    bulkRejectDiagnosticOrderTestResult: builder.mutation<
      void,
      BulkRejectDTO
    >({
      query: (body) => ({
        url: "/api/patient/diagnostic-order-tests-results/bulk-reject",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticOrderTestResult"],
    }),
    /* 🔹 Bulk Create */
    bulkCreateDiagnosticOrderTestResult: builder.mutation<
      void,
      DiagnosticOrderTestResultBulkCreateDTO>({
        query: (body) => ({
          url: "/api/patient/diagnostic-order-tests-results/bulk",
          method: "POST",
          body,
        }),
        invalidatesTags: ["DiagnosticOrderTestResult"],
      }
      ),
    bulkToggleReviewDiagnosticOrderTestResult: builder.mutation<
      void,
      BulkIdsDTO>({
        query: (body) => ({
          url: "/api/patient/diagnostic-order-tests-results/bulk-toggle-review",
          method: "POST",
          body,
        }),
        invalidatesTags: ["DiagnosticOrderTestResult"],
      }),
    getDiagnosticOrderTestResultIds: builder.query<
      number[],
      DiagnosticOrderTestResultIdsFilterParams
    >({
      query: (params) => ({
        url: "/api/patient/diagnostic-order-tests-results/ids",
        method: "GET",
        params,
      }),
    }),

  }),

});

/* ================= Hooks ================= */

export const {
  useFilterDiagnosticOrderTestResultsQuery,
  useGetAllDiagnosticOrderTestResultsQuery,
  useCreateDiagnosticOrderTestResultMutation,
  useGetDiagnosticOrderTestResultsPageQuery,
  useUpdateDiagnosticOrderTestResultMutation,
  useToggleReviewDiagnosticOrderTestResultMutation,
  useApproveDiagnosticOrderTestResultMutation,
  useBulkApproveDiagnosticOrderTestResultMutation,
  useRejectDiagnosticOrderTestResultMutation,
  useBulkRejectDiagnosticOrderTestResultMutation,
  useGetFilledProfileTestIdsQuery,
  useGetFilledProfileTestIdsByOrderTestQuery,
  useGetLabResultLogsByResultIdQuery,
  useBulkCreateDiagnosticOrderTestResultMutation,
  useBulkToggleReviewDiagnosticOrderTestResultMutation,
  useGetDiagnosticOrderTestResultIdsQuery,
  useLazyFilterDiagnosticOrderTestResultsQuery,
  useLazyGetDiagnosticOrderTestResultIdsQuery
} = diagnosticOrderTestResultService;