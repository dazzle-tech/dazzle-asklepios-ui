import { createApi } from '@reduxjs/toolkit/query/react';

import { BaseQuery } from '../../newApi';

import type {
  AllocateFinancialDocumentNumberRequest,
  AllocatedFinancialDocumentNumber,
  BillingConfigurationStatus,
  FinancialDocumentNumbering,
  FinancialDocumentNumberingBulkRequest,
  FinancialDocumentSequenceStatus,
  SaveFinancialDocumentNumberingRequest
} from '@/types/model-types-new';

export type Id = number | string;

export const financialDocumentNumberingService = createApi({
  reducerPath: 'financialDocumentNumberingService',

  baseQuery: BaseQuery,

  tagTypes: ['FinancialDocumentNumbering'],

  endpoints: builder => ({
    getFinancialDocumentNumberingByFacility: builder.query<
      FinancialDocumentNumbering[],
      { facilityId: number }
    >({
      query: ({ facilityId }) => ({
        url: `/api/setup/financial-document-numbering/by-facility/${encodeURIComponent(String(facilityId))}`,
        method: 'GET'
      }),

      providesTags: ['FinancialDocumentNumbering']
    }),

    getFinancialDocumentNumberingByFacilityAndType: builder.query<
      FinancialDocumentNumbering,
      { facilityId: number; documentType: string }
    >({
      query: ({ facilityId, documentType }) => ({
        url: `/api/setup/financial-document-numbering/by-facility/${encodeURIComponent(String(facilityId))}/document-type/${encodeURIComponent(documentType)}`,
        method: 'GET'
      }),

      providesTags: ['FinancialDocumentNumbering']
    }),

    getFinancialDocumentSequenceStatus: builder.query<
      FinancialDocumentSequenceStatus[],
      { facilityId: number; documentType: string }
    >({
      query: ({ facilityId, documentType }) => ({
        url: `/api/setup/financial-document-numbering/by-facility/${encodeURIComponent(String(facilityId))}/sequence-status/${encodeURIComponent(documentType)}`,
        method: 'GET'
      }),

      providesTags: ['FinancialDocumentNumbering']
    }),

    allocateFinancialDocumentNumber: builder.mutation<
      AllocatedFinancialDocumentNumber,
      { facilityId: number; body: AllocateFinancialDocumentNumberRequest }
    >({
      query: ({ facilityId, body }) => ({
        url: `/api/setup/financial-document-numbering/by-facility/${encodeURIComponent(String(facilityId))}/allocate`,
        method: 'POST',
        body
      }),

      invalidatesTags: ['FinancialDocumentNumbering']
    }),

    saveFinancialDocumentNumberingBulk: builder.mutation<
      FinancialDocumentNumbering[],
      FinancialDocumentNumberingBulkRequest
    >({
      query: ({ facilityId, configurations }) => ({
        url: `/api/setup/financial-document-numbering/by-facility/${encodeURIComponent(String(facilityId))}`,
        method: 'PUT',
        body: { facilityId, configurations }
      }),

      invalidatesTags: ['FinancialDocumentNumbering']
    }),

    addFinancialDocumentNumbering: builder.mutation<
      FinancialDocumentNumbering,
      SaveFinancialDocumentNumberingRequest
    >({
      query: body => ({
        url: '/api/setup/financial-document-numbering',
        method: 'POST',
        body
      }),

      invalidatesTags: ['FinancialDocumentNumbering']
    }),

    updateFinancialDocumentNumbering: builder.mutation<
      FinancialDocumentNumbering,
      { id: Id; data: SaveFinancialDocumentNumberingRequest & { id: number } }
    >({
      query: ({ id, data }) => ({
        url: `/api/setup/financial-document-numbering/${encodeURIComponent(String(id))}`,
        method: 'PUT',
        body: data
      }),

      invalidatesTags: ['FinancialDocumentNumbering']
    }),

    changeFinancialDocumentNumberingStatus: builder.mutation<
      FinancialDocumentNumbering,
      { id: Id; status: BillingConfigurationStatus }
    >({
      query: ({ id, status }) => ({
        url: `/api/setup/financial-document-numbering/${encodeURIComponent(String(id))}/status/${encodeURIComponent(status)}`,
        method: 'PUT'
      }),

      invalidatesTags: ['FinancialDocumentNumbering']
    }),

    changeFinancialDocumentNumberingActivationStatus: builder.mutation<
      FinancialDocumentNumbering,
      { id: Id; active: boolean }
    >({
      query: ({ id, active }) => ({
        url: `/api/setup/financial-document-numbering/${encodeURIComponent(String(id))}/activation-status/${encodeURIComponent(String(active))}`,
        method: 'PUT'
      }),

      invalidatesTags: ['FinancialDocumentNumbering']
    }),

    deleteFinancialDocumentNumbering: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/financial-document-numbering/${encodeURIComponent(String(id))}`,
        method: 'DELETE'
      }),

      invalidatesTags: ['FinancialDocumentNumbering']
    })
  })
});

export const {
  useGetFinancialDocumentNumberingByFacilityQuery,
  useLazyGetFinancialDocumentNumberingByFacilityQuery,
  useGetFinancialDocumentNumberingByFacilityAndTypeQuery,
  useGetFinancialDocumentSequenceStatusQuery,
  useAllocateFinancialDocumentNumberMutation,
  useSaveFinancialDocumentNumberingBulkMutation,
  useAddFinancialDocumentNumberingMutation,
  useUpdateFinancialDocumentNumberingMutation,
  useChangeFinancialDocumentNumberingStatusMutation,
  useChangeFinancialDocumentNumberingActivationStatusMutation,
  useDeleteFinancialDocumentNumberingMutation
} = financialDocumentNumberingService;
