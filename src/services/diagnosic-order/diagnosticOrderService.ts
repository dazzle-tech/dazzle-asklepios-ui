import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import {
  DiagnosticOrder,
  DiagnosticOrderCreateDTO,
  DiagnosticOrderUpdateDTO,
} from '@/types/model-types-new';

/* ===================== TYPES ===================== */

type PageableParams = {
  page?: number;
  size?: number;
  sort?: string[];
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
};

/* ===================== SAFE MAPPER ===================== */
/**
 * IMPORTANT:
 * Protect large numeric IDs from JS precision loss
 * without affecting any other fields.
 */
const mapDiagnosticOrder = (o: any): DiagnosticOrder => ({
  ...o,
  id: o?.id != null ? String(o.id) : o.id,
  patientId: o?.patientId != null ? String(o.patientId) : o.patientId,
  encounterId: o?.encounterId != null ? String(o.encounterId) : o.encounterId,
});

/* ===================== SERVICE ===================== */

export const diagnosticOrderService = createApi({
  reducerPath: 'diagnosticOrderApi',
  baseQuery: BaseQuery,
  tagTypes: ['DiagnosticOrder'],
  endpoints: builder => ({

    /* -------------------------------------------------
     * CRUD
     * ------------------------------------------------- */

    createDiagnosticOrder: builder.mutation<
      DiagnosticOrder,
      DiagnosticOrderCreateDTO
    >({
      query: body => ({
        url: '/api/patient/diagnostic-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DiagnosticOrder'],
    }),

    updateDiagnosticOrder: builder.mutation<
      DiagnosticOrder,
      { id: number; body: DiagnosticOrderUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/diagnostic-orders/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DiagnosticOrder', id },
      ],
    }),

    getDiagnosticOrderById: builder.query<DiagnosticOrder, number>({
      query: id => ({
        url: `/api/patient/diagnostic-orders/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: DiagnosticOrder) =>
        mapDiagnosticOrder(response),
      providesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrder', id },
      ],
    }),

    deleteDiagnosticOrder: builder.mutation<void, number>({
      query: id => ({
        url: `/api/patient/diagnostic-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DiagnosticOrder'],
    }),

    /* -------------------------------------------------
     * LEGACY LIST ENDPOINTS
     * ------------------------------------------------- */

    getOrdersByPatient: builder.query<
      PagedResult<DiagnosticOrder>,
      { patientId: number; status?: string } & PageableParams
    >({
      query: ({ patientId, ...params }) => ({
        url: `/api/patient/diagnostic-orders/by-patient/${patientId}`,
        method: 'GET',
        params,
      }),
      transformResponse: (response: DiagnosticOrder[], meta): PagedResult<DiagnosticOrder> => ({
        data: (response ?? []).map(mapDiagnosticOrder),
        totalCount: Number(
          meta?.response?.headers?.get('X-Total-Count') ?? 0
        ),
      }),
      providesTags: (_r, _e, { patientId }) => [
        { type: 'DiagnosticOrder', id: `patient-${patientId}` },
      ],
    }),

    getOrdersByEncounter: builder.query<
      PagedResult<DiagnosticOrder>,
      { encounterId: number; status?: string } & PageableParams
    >({
      query: ({ encounterId, ...params }) => ({
        url: `/api/patient/diagnostic-orders/by-encounter/{encounterId}`,
        method: 'GET',
        params,
      }),
      transformResponse: (response: DiagnosticOrder[], meta): PagedResult<DiagnosticOrder> => ({
        data: (response ?? []).map(mapDiagnosticOrder),
        totalCount: Number(
          meta?.response?.headers?.get('X-Total-Count') ?? 0
        ),
      }),
      providesTags: (_r, _e, { encounterId }) => [
        { type: 'DiagnosticOrder', id: `encounter-${encounterId}` },
      ],
    }),

    getOrdersByPatientAndEncounter: builder.query<
      PagedResult<DiagnosticOrder>,
      { patientId: number; encounterId: number; status?: string } & PageableParams
    >({
      query: ({ patientId, encounterId, ...params }) => ({
        url: `/api/patient/diagnostic-orders/by-patient/${patientId}/by-encounter/${encounterId}`,
        method: 'GET',
        params,
      }),
      transformResponse: (response: DiagnosticOrder[], meta): PagedResult<DiagnosticOrder> => ({
        data: (response ?? []).map(mapDiagnosticOrder),
        totalCount: Number(
          meta?.response?.headers?.get('X-Total-Count') ?? 0
        ),
      }),
      providesTags: (_r, _e, { patientId, encounterId }) => [
        { type: 'DiagnosticOrder', id: `patient-${patientId}-encounter-${encounterId}` },
      ],
    }),

      filterDiagnosticOrders: builder.query<
        PagedResult<DiagnosticOrder>,
        {
          page?: number;
          size?: number;
          sort?: string[];
          [key: string]: any;
        }
      >({
        query: ({ sort, ...rest }) => {
          const params = new URLSearchParams();
          Object.entries(rest).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
          if (Array.isArray(sort)) {
            sort.forEach(s => params.append('sort', s));
          }

          return {
            url: `/api/patient/diagnostic-orders?${params.toString()}`,
            method: 'GET',
            responseHandler: r => r.text(),
          };
        },

        transformResponse: (responseText: string, meta): PagedResult<DiagnosticOrder> => {
          const parsed = JSON.parse(responseText, (_k, v) =>
            typeof v === 'number' && !Number.isSafeInteger(v) ? String(v) : v
          );

          return {
            data: (parsed ?? []).map(mapDiagnosticOrder),
            totalCount: Number(
              meta?.response?.headers?.get('X-Total-Count') ?? 0
            ),
          };
        },

        providesTags: ['DiagnosticOrder'],
      }),


    /* -------------------------------------------------
     * ACTIONS
     * ------------------------------------------------- */

    submitDiagnosticOrder: builder.mutation<DiagnosticOrder, number>({
      query: id => ({
        url: `/api/patient/diagnostic-orders/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DiagnosticOrder', id },
      ],
    }),

  }),
});

/* ===================== HOOKS ===================== */

export const {
  useCreateDiagnosticOrderMutation,
  useUpdateDiagnosticOrderMutation,
  useGetDiagnosticOrderByIdQuery,
  useLazyGetDiagnosticOrderByIdQuery,
  useDeleteDiagnosticOrderMutation,
  useGetOrdersByPatientQuery,
  useGetOrdersByEncounterQuery,
  useGetOrdersByPatientAndEncounterQuery,
  useFilterDiagnosticOrdersQuery,
  useLazyFilterDiagnosticOrdersQuery,
  useSubmitDiagnosticOrderMutation,
} = diagnosticOrderService;
