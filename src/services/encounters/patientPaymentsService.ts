import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import * as modelTypes from '@/types/model-types-new';

type Id = number | string;

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

const mapPaged = (response: any[], meta: any): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

const normalizePaymentDetails = (raw: any): modelTypes.PatientPaymentDetails => {
  if (raw?.payment && Array.isArray(raw?.services)) {
    return raw as modelTypes.PatientPaymentDetails;
  }

  const services = Array.isArray(raw?.services) ? raw.services : [];
  const payment = { ...(raw ?? {}) };
  delete (payment as any).services;

  return {
    payment: payment as modelTypes.PatientPayments,
    services: services as modelTypes.PatientPaymentServices[]
  };
};

export type PatientLedgerSummary = {
  patientId: number;
  totalDebt: number;
  insuranceOutstandingAmount?: number;
  walletBalance: number;
  reservedBalance?: number;
  consumedAmount?: number;
};

export const patientPaymentsService = createApi({
  reducerPath: 'patientPaymentsApi',
  baseQuery: BaseQuery,
  tagTypes: [
    'PatientPayment',
    'PatientPaymentServices',
    'PatientBalance',
    'PatientLedgerSummary',
    'PatientEncounter'
  ],
  endpoints: builder => ({
    createPayment: builder.mutation<
      modelTypes.PatientPaymentDetails,
      { body: modelTypes.PatientPaymentDTO }
    >({
      query: ({ body }) => ({
        url: '/api/patient/payment',
        method: 'POST',
        body
      }),
      transformResponse: (response: any) => normalizePaymentDetails(response),
      invalidatesTags: (_res, _err, { body }) => [
        'PatientPayment',
        'PatientPaymentServices',
        { type: 'PatientBalance', id: body.patientId },
        { type: 'PatientLedgerSummary', id: body.patientId },
        { type: 'PatientEncounter', id: body.encounterId },
        'PatientEncounter'
      ]
    }),

    updatePayment: builder.mutation<
      modelTypes.PatientPaymentDetails,
      { id: Id; body: modelTypes.PatientPaymentDTO }
    >({
      query: ({ id, body }) => ({
        url: `/api/patient/payment/${id}`,
        method: 'PUT',
        body
      }),
      transformResponse: (response: any) => normalizePaymentDetails(response),
      invalidatesTags: (_res, _err, { id, body }) => [
        { type: 'PatientPayment', id },
        'PatientPayment',
        'PatientPaymentServices',
        { type: 'PatientBalance', id: body.patientId },
        { type: 'PatientLedgerSummary', id: body.patientId },
        { type: 'PatientEncounter', id: body.encounterId },
        'PatientEncounter'
      ]
    }),

    /**
     * GET Patient Payment by id
     * GET /api/patient/payment/{id}
     */
    getPaymentById: builder.query<modelTypes.PatientPaymentDetails, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/payment/${id}`,
        method: 'GET'
      }),
      transformResponse: (response: any) => normalizePaymentDetails(response),
      providesTags: (_res, _err, { id }) => [{ type: 'PatientPayment', id }, 'PatientPayment']
    }),

    getPaymentByEncounter: builder.query<
      modelTypes.PatientPaymentDetails | null,
      { encounterId: number | string }
    >({
      query: ({ encounterId }) => ({
        url: `/api/patient/encounter/${encounterId}/payment`,
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        if (!response) return null;

        return {
          payment: response,
          services: response.services ?? []
        };
      },
      transformErrorResponse: (error: any) => {
        if (error?.status === 204 || error?.status === 404) return null;
        return error;
      },
      providesTags: (_res, _err, { encounterId }) => [
        { type: 'PatientPayment', id: `encounter-${encounterId}` },
        'PatientPayment'
      ]
    }),

    /**
     * GET patient balance
     * GET /api/patient/payment/patient/{patientId}/balance
     */
    getPatientBalance: builder.query<number, { patientId: Id }>({
      query: ({ patientId }) => ({
        url: `/api/patient/payment/patient/${patientId}/balance`,
        method: 'GET'
      }),
      providesTags: (_res, _err, { patientId }) => [{ type: 'PatientBalance', id: patientId }]
    }),

    /**
     * GET patient ledger summary
     * GET /api/patient/payment/patient/{patientId}/ledger-summary
     */
    getPatientLedgerSummary: builder.query<PatientLedgerSummary, { patientId: Id }>({
      query: ({ patientId }) => ({
        url: `/api/patient/payment/patient/${patientId}/ledger-summary`,
        method: 'GET'
      }),
      providesTags: (_res, _err, { patientId }) => [{ type: 'PatientLedgerSummary', id: patientId }]
    }),

    /**
     * LIST payment services for a payment
     * GET /api/patient/payment/{paymentId}/services
     */
    getPaymentServicesByPaymentId: builder.query<
      modelTypes.PatientPaymentServices[],
      { paymentId: Id }
    >({
      query: ({ paymentId }) => ({
        url: `/api/patient/payment/${paymentId}/services`,
        method: 'GET'
      }),
      providesTags: (res, _err, { paymentId }) =>
        res
          ? [
              ...res.map(s => ({ type: 'PatientPaymentServices' as const, id: s.id })),
              { type: 'PatientPayment', id: paymentId },
              'PatientPaymentServices'
            ]
          : [{ type: 'PatientPayment', id: paymentId }, 'PatientPaymentServices']
    }),

    /**
     * LIST payments by patient
     * GET /api/patient/payment/patient/{patientId}
     */
    getPaymentsByPatient: builder.query<
      PagedResult<modelTypes.PatientPayments>,
      { patientId: Id } & PagedParams
    >({
      query: ({ patientId, page, size, sort = 'id,desc' }) => ({
        url: `/api/patient/payment/patient/${patientId}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (response: any[], meta) => {
        return mapPaged(response, meta);
      },
      providesTags: res =>
        res
          ? [
              ...res.data.map(p => ({ type: 'PatientPayment' as const, id: p.id })),
              'PatientPayment'
            ]
          : ['PatientPayment']
    }),
    calculateInsuranceAmount: builder.mutation<
  {
    dueAmount: number;
    patientShare: number;
    insuranceShare: number;
  },
  { body: modelTypes.PatientPaymentDTO }
>({
  query: ({ body }) => ({
    url: '/api/patient/insurance/calculate',
    method: 'POST',
    body
  })
}),
  })
});

export const {
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useGetPaymentByIdQuery,
  useLazyGetPaymentByIdQuery,
  useGetPaymentByEncounterQuery,
  useLazyGetPaymentByEncounterQuery,
  useGetPatientBalanceQuery,
  useLazyGetPatientBalanceQuery,
  useGetPatientLedgerSummaryQuery,
  useLazyGetPatientLedgerSummaryQuery,
  useGetPaymentServicesByPaymentIdQuery,
  useLazyGetPaymentServicesByPaymentIdQuery,
  useGetPaymentsByPatientQuery,
  useLazyGetPaymentsByPatientQuery,
  useCalculateInsuranceAmountMutation,
} = patientPaymentsService;
