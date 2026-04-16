import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import * as modelTypes from '@/types/model-types-new';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;

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


export const uccMedicationOrderService = createApi({
  reducerPath: 'uccMedicationOrderApi',
  baseQuery: BaseQuery,
  tagTypes: ['UccMedicationOrder'],
  endpoints: builder => ({

    // ================= CREATE =================
    createUccMedicationOrder: builder.mutation<
      modelTypes.PatientUccMedicationOrder,
      modelTypes.PatientUccMedicationOrder
    >({
      query: data => ({
        url: `/api/patient/urgent-care-medication-orders`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['UccMedicationOrder'],
    }),

    // ================= UPDATE =================
    updateUccMedicationOrder: builder.mutation<
      modelTypes.PatientUccMedicationOrder,
      { id: Id; data: modelTypes.PatientUccMedicationOrder }
    >({
      query: ({ id, data }) => ({
        url: `/api/patient/urgent-care-medication-orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'UccMedicationOrder', id },
        'UccMedicationOrder',
      ],
    }),

    // ================= GET BY ID =================
    getUccMedicationOrderById: builder.query<
      modelTypes.PatientUccMedicationOrder,
      Id
    >({
      query: id => ({
        url: `/api/patient/urgent-care-medication-orders/${id}`,
      }),
      providesTags: (_res, _err, id) => [
        { type: 'UccMedicationOrder', id },
      ],
    }),

    // ================= FILTER (PAGINATION) =================
    filterUccMedicationOrders: builder.query<
      PagedResult<modelTypes.PatientUccMedicationOrder>,
      {
        patientId?: Id;
        encounterId?: Id;
        activeIngredientId?: Id;
        status?: string;
        statusIn?: string[];
        statusNotIn?: string[];
        route?: string;
        frequency?: string;
        page?: number;
        size?: number;
        sort?: string;
        timestamp?: number;
      }
    >({
      query: ({
        patientId,
        encounterId,
        activeIngredientId,
        status,
        statusIn,
        statusNotIn,
        route,
        frequency,
        page = 0,
        size = 10,
        sort = 'createdDate,desc',
      }) => ({
        url: `/api/patient/urgent-care-medication-orders/filter`,
        params: {
          patientId,
          encounterId,
          activeIngredientId,
          status,
          statusIn,
          statusNotIn,
          route,
          frequency,
          page,
          size,
          sort,
        },
      }),

      transformResponse: (
        response: any,
        meta
      ): PagedResult<modelTypes.PatientUccMedicationOrder> => {
        const headers = meta?.response?.headers;

        // 🔥 الحالة 1: Spring Page object
        if (response?.content) {
          return {
            data: response.content ?? [],
            totalCount: response.totalElements ?? 0,
          };
        }

        // 🔥 الحالة 2: Header-based pagination
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },

      providesTags: ['UccMedicationOrder'],
    }),

    // ================= SUBMIT =================
submitUccMedicationOrder: builder.mutation<
  modelTypes.PatientUccMedicationOrder,
  { id: Id; isHighAlert: boolean }
>({
  query: ({ id, isHighAlert }) => ({
    url: `/api/patient/urgent-care-medication-orders/${id}/submit`,
    method: 'POST',
    body: { isHighAlert }, // 🔥 لازم
  }),
  invalidatesTags: (_res, _err, { id }) => [
    { type: 'UccMedicationOrder', id },
    'UccMedicationOrder',
  ],
}),

    // ================= ADMINISTER =================
    administerUccMedicationOrder: builder.mutation<
      modelTypes.PatientUccMedicationOrder,
      Id
    >({
      query: id => ({
        url: `/api/patient/urgent-care-medication-orders/${id}/administer`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'UccMedicationOrder', id },
        'UccMedicationOrder',
      ],
    }),

    // ================= DOUBLE CHECK =================
    doubleCheckUccMedicationOrder: builder.mutation<
      modelTypes.PatientUccMedicationOrder,
      Id
    >({
      query: id => ({
        url: `/api/patient/urgent-care-medication-orders/${id}/double-check`,
        method: 'POST',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'UccMedicationOrder', id },
        'UccMedicationOrder',
      ],
    }),

    // ================= DISCARD =================
    discardUccMedicationOrder: builder.mutation<
      modelTypes.PatientUccMedicationOrder,
      { id: Id; discardReason: string }
    >({
      query: ({ id, discardReason }) => ({
        url: `/api/patient/urgent-care-medication-orders/${id}/discard`,
        method: 'POST',
        body: { discardReason },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'UccMedicationOrder', id },
        'UccMedicationOrder',
      ],
    }),

    // ================= CANCEL =================
    cancelUccMedicationOrder: builder.mutation<
      modelTypes.PatientUccMedicationOrder,
      { id: Id; cancellationReason: string }
    >({
      query: ({ id, cancellationReason }) => ({
        url: `/api/patient/urgent-care-medication-orders/${id}/cancel`,
        method: 'POST',
        body: { cancellationReason },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'UccMedicationOrder', id },
        'UccMedicationOrder',
      ],
    }),

  }),
});

export const {
  useCreateUccMedicationOrderMutation,
  useUpdateUccMedicationOrderMutation,
  useGetUccMedicationOrderByIdQuery,
  useLazyGetUccMedicationOrderByIdQuery,
  useFilterUccMedicationOrdersQuery,

  useSubmitUccMedicationOrderMutation,
  useAdministerUccMedicationOrderMutation,
  useDoubleCheckUccMedicationOrderMutation,
  useDiscardUccMedicationOrderMutation,
  useCancelUccMedicationOrderMutation,

} = uccMedicationOrderService;