import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';

/* ===================== TYPES ===================== */

export type TestType = 'LABORATORY' | 'RADIOLOGY' | 'PATHOLOGY';

export interface DiagnosticTestRequest {
  id?: string;
  name?: string;
  type?: TestType;
  status?: DiagnosticTestRequestStatus;
  diagnosticTestId?: string;
  fromDepartmentId?: string;
  fromFacilityId?: string;
  indication:string;
  createdBy?: string;
  createdDate?: string;
  approvedDate?: string;
  rejectedDate?: string;
  rejectedReason?: string;
}

export interface DiagnosticTestRequestCreateDTO {
  name: string;
  type: TestType;
  fromDepartmentId: number | string;
  fromFacilityId: number | string;
  indication: string;
}

export interface DiagnosticTestRequestUpdateDTO {
  id: number | string;
  name: string;
  type: TestType;
  indication: string;
}

export interface DiagnosticTestRequestRejectDTO {
  rejectedReason: string;
}

export type DiagnosticTestRequestStatus =
  | 'NEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';


type PageableParams = {
  page?: number;
  size?: number;
  sort?: string;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

/* ===================== SAFE MAPPER ===================== */
/**
 * Protect large numeric IDs from JS precision loss
 */
const mapDiagnosticTestRequest = (r: any): DiagnosticTestRequest => ({
  ...r,
  id: r?.id != null ? String(r.id) : r.id,
  diagnosticTestId:
    r?.diagnosticTestId != null ? String(r.diagnosticTestId) : r.diagnosticTestId,
  fromDepartmentId:
    r?.fromDepartmentId != null ? String(r.fromDepartmentId) : r.fromDepartmentId,
  fromFacilityId:
    r?.fromFacilityId != null ? String(r.fromFacilityId) : r.fromFacilityId,
});

/* ===================== SERVICE ===================== */

export const diagnosticTestRequestService = createApi({
  reducerPath: 'diagnosticTestRequestApi',
  baseQuery: BaseQuery,
  tagTypes: ['DiagnosticTestRequest'],
  endpoints: builder => ({

    /* -------------------------------------------------
     * CRUD
     * ------------------------------------------------- */

    createDiagnosticTestRequest: builder.mutation<
      DiagnosticTestRequest,
      DiagnosticTestRequestCreateDTO
    >({
      query: body => ({
        url: '/api/patient/diagnostic-test-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DiagnosticTestRequest'],
    }),

    updateDiagnosticTestRequest: builder.mutation<
      DiagnosticTestRequest,
      { id: number | string; body: DiagnosticTestRequestUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-test-requests/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticTestRequest', id },
      ],
    }),

    getDiagnosticTestRequestById: builder.query<
      DiagnosticTestRequest,
      number | string
    >({
      query: id => ({
        url: `/api/patient/diagnostic-test-requests/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: DiagnosticTestRequest) =>
        mapDiagnosticTestRequest(response),
      providesTags: (_r, _e, id) => [
        { type: 'DiagnosticTestRequest', id },
      ],
    }),

    deleteDiagnosticTestRequest: builder.mutation<void, number | string>({
      query: id => ({
        url: `/api/patient/diagnostic-test-requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DiagnosticTestRequest'],
    }),

    /* -------------------------------------------------
     * ACTIONS
     * ------------------------------------------------- */

    approveDiagnosticTestRequest: builder.mutation<
      DiagnosticTestRequest,
      number | string
    >({
      query: id => ({
        url: `/api/patient/diagnostic-test-requests/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticTestRequest', id },
      ],
    }),

    rejectDiagnosticTestRequest: builder.mutation<
      DiagnosticTestRequest,
      { id: number | string; body: DiagnosticTestRequestRejectDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-test-requests/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticTestRequest', id },
      ],
    }),

    setDiagnosticTestForRequest: builder.mutation<
      DiagnosticTestRequest,
      { id: number | string; diagnosticTestId: number | string }
    >({
      query: ({ id, diagnosticTestId }) => ({
        url: `/api/patient/diagnostic-test-requests/${id}/diagnostic-test`,
        method: 'PUT',
        body: { diagnosticTestId }
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticTestRequest', id },
      ],
    }),

    filterDiagnosticTestRequests: builder.query<
      PagedResult<DiagnosticTestRequest>,
      Record<string, any> & PageableParams
    >({
      query: params => ({
        url: '/api/patient/diagnostic-test-requests',
        method: 'GET',
        params,
        responseHandler: response => response.text(),
      }),

      transformResponse: (responseText: string, meta): PagedResult<DiagnosticTestRequest> => {
        const parsed = JSON.parse(responseText, (_k, v) => {
          if (typeof v === 'number' && !Number.isSafeInteger(v)) {
            return String(v);
          }
          return v;
        });

        return {
          data: (parsed ?? []).map(mapDiagnosticTestRequest),
          totalCount: Number(
            meta?.response?.headers?.get('X-Total-Count') ?? 0
          ),
        };
      },

    providesTags: (result) =>
      result?.data
        ? [
            ...result.data.map((r) => ({
              type: 'DiagnosticTestRequest' as const,
              id: r.id
            })),
            { type: 'DiagnosticTestRequest', id: 'LIST' }
          ]
        : [{ type: 'DiagnosticTestRequest', id: 'LIST' }],    }),

      }),
});

/* ===================== HOOKS ===================== */

export const {
  useCreateDiagnosticTestRequestMutation,
  useUpdateDiagnosticTestRequestMutation,
  useGetDiagnosticTestRequestByIdQuery,
  useDeleteDiagnosticTestRequestMutation,
  useSetDiagnosticTestForRequestMutation,
  useApproveDiagnosticTestRequestMutation,
  useRejectDiagnosticTestRequestMutation,
  useFilterDiagnosticTestRequestsQuery,
  useLazyFilterDiagnosticTestRequestsQuery,
} = diagnosticTestRequestService;
