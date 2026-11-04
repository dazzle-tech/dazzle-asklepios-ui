import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import {
  BillingInvoiceCreateDTO,
  BillingInvoiceUpdateDTO,
} from '@/types/model-types-new';

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

export const patientBillingInvoiceService = createApi({
  reducerPath: 'patientBillingInvoiceService',
  baseQuery: BaseQuery,
  tagTypes: ['PatientBillingInvoice'],
  endpoints: builder => ({
    // POST /api/patient/billing/invoice
    createPatientInvoice: builder.mutation<any, BillingInvoiceCreateDTO>({
      query: body => ({
        url: '/api/patient/billing/invoice',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PatientBillingInvoice'],
    }),

    // PUT /api/patient/billing/invoice/{id}
    updatePatientInvoice: builder.mutation<any, BillingInvoiceUpdateDTO>({
      query: body => ({
        url: `/api/patient/billing/invoice/${body.id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, body) => [
        'PatientBillingInvoice',
        { type: 'PatientBillingInvoice' as const, id: body.id },
      ],
    }),

    // GET /api/patient/billing/invoice?patientId=...
    getPatientInvoices: builder.query<
      PagedResult<any>,
      { page?: number; size?: number; sort?: string; patientId: number }
    >({
      query: ({ page = 0, size = 10, sort = 'id,desc', patientId }) => ({
        url: `/api/patient/billing/invoice`,
        method: 'GET',
        params: { page, size, sort, patientId },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['PatientBillingInvoice'],
    }),

    // GET /api/patient/billing/invoice/{id}
    getPatientInvoiceById: builder.query<any, number>({
      query: id => ({
        url: `/api/patient/billing/invoice/${id}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [
        { type: 'PatientBillingInvoice', id },
      ],
    }),

  }),
});

export const {
  useCreatePatientInvoiceMutation,
  useUpdatePatientInvoiceMutation,
  useGetPatientInvoicesQuery,
  useLazyGetPatientInvoicesQuery,
  useGetPatientInvoiceByIdQuery,
} = patientBillingInvoiceService;

