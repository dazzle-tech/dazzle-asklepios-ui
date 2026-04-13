import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import {
  BillingInvoiceItemCreateDTO,
  BillingInvoiceItemUpdateDTO,
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

export const patientBillingInvoiceItemService = createApi({
  reducerPath: 'patientBillingInvoiceItemService',
  baseQuery: BaseQuery,
  tagTypes: ['PatientBillingInvoiceItem'],
  endpoints: builder => ({
    createPatientInvoiceItem: builder.mutation<any, BillingInvoiceItemCreateDTO>({
      query: body => ({
        url: '/api/patient/billing/invoice-item',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PatientBillingInvoiceItem'],
    }),

    updatePatientInvoiceItem: builder.mutation<any, BillingInvoiceItemUpdateDTO>({
      query: body => ({
        url: `/api/patient/billing/invoice-item/${body.id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, body) => [
        'PatientBillingInvoiceItem',
        { type: 'PatientBillingInvoiceItem' as const, id: body.id },
      ],
    }),

    getPatientInvoiceItems: builder.query<
      PagedResult<any>,
      { page?: number; size?: number; sort?: string }
    >({
      query: ({ page = 0, size = 10, sort = 'id,desc' }) => ({
        url: `/api/patient/billing/invoice-item`,
        method: 'GET',
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: ['PatientBillingInvoiceItem'],
    }),

    // GET /api/patient/billing/by-invoice/{invoiceId}
    getPatientInvoiceItemsByInvoiceId: builder.query<
      PagedResult<any>,
      { invoiceId: number; page?: number; size?: number; sort?: string }
    >({
      query: ({ invoiceId, page = 0, size = 50, sort = 'id,asc' }) => ({
        url: `/api/patient/billing/by-invoice/${invoiceId}`,
        method: 'GET',
        params: { page, size, sort },
      }),
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: parseLinkHeader(headers?.get('Link')),
        };
      },
      providesTags: (_r, _e, { invoiceId }) => [
        'PatientBillingInvoiceItem',
        { type: 'PatientBillingInvoiceItem', id: invoiceId },
      ],
    }),

    getPatientInvoiceItemById: builder.query<any, number>({
      query: id => ({
        url: `/api/patient/billing/invoice-item/${id}`,
        method: 'GET',
      }),
      providesTags: (_r, _e, id) => [
        { type: 'PatientBillingInvoiceItem', id },
      ],
    }),
  }),
});

export const {
  useCreatePatientInvoiceItemMutation,
  useUpdatePatientInvoiceItemMutation,
  useGetPatientInvoiceItemsQuery,
  useLazyGetPatientInvoiceItemsQuery,
  useGetPatientInvoiceItemsByInvoiceIdQuery,
  useLazyGetPatientInvoiceItemsByInvoiceIdQuery,
  useGetPatientInvoiceItemByIdQuery,
} = patientBillingInvoiceItemService;

