import { BaseQuery } from "@/newApi";
import { parseLinkHeader } from "@/utils/paginationHelper";
import type {
  DiagnosticOrderTestCollectedSampleBulkSameDTO,
  DiagnosticOrderTestCollectedSampleDTO,
  DiagnosticOrderTestCollectedSampleResponseVM,
  SampleLabelVM,
} from "@/types/model-types-new";
import { createApi } from "@reduxjs/toolkit/dist/query/react";

/* ================= Types ================= */

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
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

/* ================= Service ================= */

export const diagnosticOrderTestCollectedSampleService = createApi({
  reducerPath: "diagnosticOrderTestCollectedSampleApi",
  baseQuery: BaseQuery,
  tagTypes: ["DiagnosticOrderTestCollectedSample"],

  endpoints: (builder) => ({

    /* 🔹 Get by ID */
    getCollectedSampleById: builder.query<
      DiagnosticOrderTestCollectedSampleResponseVM,
      number
    >({
      query: (id) => ({
        url: `/api/patient/diagnostic-order-test-collected-samples/${id}`,
        method: "GET",
      }),
      providesTags: (r, e, id) => [
        { type: "DiagnosticOrderTestCollectedSample", id },
      ],
    }),

    /* 🔹 Get by Order Test ID (paginated) */
    getCollectedSamplesByOrderTestId: builder.query<
      PagedResult<DiagnosticOrderTestCollectedSampleResponseVM>,
      { orderTestId: number; page: number; size: number }
    >({
      query: ({ orderTestId, page, size }) => ({
        url: `/api/patient/diagnostic-order-test-collected-samples/by-diagnostic-order-tests/${orderTestId}`,
        method: "GET",
        params: { page, size },
      }),
      transformResponse: (
        response: DiagnosticOrderTestCollectedSampleResponseVM[],
        meta
      ) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DiagnosticOrderTestCollectedSample"],
    }),

    /* 🔹 Get by Order ID (paginated) */
    getCollectedSamplesByOrderId: builder.query<
      PagedResult<DiagnosticOrderTestCollectedSampleResponseVM>,
      { orderId: number; page: number; size: number }
    >({
      query: ({ orderId, page, size }) => ({
        url: `/api/patient/diagnostic-order-test-collected-samples/by-diagnostic-orders/${orderId}`,
        method: "GET",
        params: { page, size },
      }),
      transformResponse: (
        response: DiagnosticOrderTestCollectedSampleResponseVM[],
        meta
      ) => {
        const headers = meta?.response?.headers;
        return {
          data: response,
          totalCount: Number(headers?.get("X-Total-Count") ?? 0),
          links: parseLinkHeader(headers?.get("Link")),
        };
      },
      providesTags: ["DiagnosticOrderTestCollectedSample"],
    }),

    /* 🔹 Create */
    createCollectedSample: builder.mutation<
      DiagnosticOrderTestCollectedSampleResponseVM,
      DiagnosticOrderTestCollectedSampleDTO
    >({
      query: (body) => ({
        url: "/api/patient/diagnostic-order-test-collected-samples",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticOrderTestCollectedSample"],
    }),

    /* 🔹 Bulk Create (Same Data for multiple tests) */
    bulkCreateCollectedSampleSame: builder.mutation<
      DiagnosticOrderTestCollectedSampleResponseVM[],
      DiagnosticOrderTestCollectedSampleBulkSameDTO
    >({
      query: (body) => ({
        url: "/api/patient/diagnostic-order-test-collected-samples/bulk-with-same-details",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DiagnosticOrderTestCollectedSample"],
    }),

    /* 🔹 Delete */
    deleteCollectedSample: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/patient/diagnostic-order-test-collected-samples/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DiagnosticOrderTestCollectedSample"],
    }),

    getSampleLabel: builder.query<SampleLabelVM, { orderTestId: number }>({
      query: ({ orderTestId }) => ({
        url: `/api/patient/diagnostic-order-test-collected-samples/sample-label/${orderTestId}`,
        method: 'GET'
      }),
      providesTags: ["DiagnosticOrderTestCollectedSample"],

    }),


    getSampleLabelPdf: builder.query<Blob | null, { orderTestId: number }>({
      query: ({ orderTestId }) => ({
        url: `/api/analytics/diagnostic-order-tests/${orderTestId}/sample-label/pdf`,
        method: 'GET',
        responseHandler: async (response) => {
          if (response.status === 204) {
            return null;
          }
          return await response.blob();
        }
      })
    }),
    getSampleLabelsPdf: builder.query<Blob | null, { orderTestId: number }>({
      query: ({ orderTestId }) => ({
        url: `/api/analytics/diagnostic-order-tests/${orderTestId}/sample-labels/pdf`,
        method: 'GET',
        responseHandler: async (response) => {
          if (response.status === 204) {
            return null;
          }
          return await response.blob();
        }
      })
    })
  }),
});

/* ================= Hooks ================= */

export const {
  useGetCollectedSampleByIdQuery,
  useGetCollectedSamplesByOrderTestIdQuery,
  useGetCollectedSamplesByOrderIdQuery,
  useCreateCollectedSampleMutation,
  useBulkCreateCollectedSampleSameMutation,
  useDeleteCollectedSampleMutation,
  useLazyGetSampleLabelQuery,
  useLazyGetSampleLabelPdfQuery,
  useGetSampleLabelsPdfQuery,
  useLazyGetSampleLabelsPdfQuery
} = diagnosticOrderTestCollectedSampleService;
