import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { Address } from '@/types/model-types-new';

type PagedResult<T> = { data: T[]; totalCount: number };

export const addressService = createApi({
  reducerPath: 'addressApi',
  baseQuery: BaseQuery,
  tagTypes: ['Address'],
  endpoints: builder => ({
    getPatientAddresses: builder.query<PagedResult<Address>, { patientId: number }>({
      query: ({ patientId }) => ({
        url: `/api/patient/addresses/patient/${patientId}`,
        method: 'GET'
      }),
      transformResponse: (response: Address[]): PagedResult<Address> => ({
        data: response || [],
        totalCount: response?.length || 0
      }),
      providesTags: (_res, _err, { patientId }) => [{ type: 'Address', id: patientId }]
    }),

    getCurrentPatientAddress: builder.query<Address, { patientId: number }>({
      query: ({ patientId }) => ({
        url: `/api/patient/addresses/patient/${patientId}/current`,
        method: 'GET'
      }),
      providesTags: (_res, _err, { patientId }) => [{ type: 'Address', id: patientId }]
    }),

    createAddress: builder.mutation<Address, { patientId: number; body: Address }>({
      query: ({ patientId, body }) => ({
        url: `/api/patient/addresses/patient/${patientId}`,
        method: 'POST',
        body
      }),
      invalidatesTags: (_res, _err, { patientId }) => [{ type: 'Address', id: patientId }]
    }),

    updateAddress: builder.mutation<Address, { id: number; patientId: number; body: Address }>({
      query: ({ id, body }) => ({
        url: `/api/patient/addresses/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_res, _err, { patientId }) => [{ type: 'Address', id: patientId }]
    })
  })
});

export const {
  useGetPatientAddressesQuery,
  useLazyGetPatientAddressesQuery,
  useGetCurrentPatientAddressQuery,
  useLazyGetCurrentPatientAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation
} = addressService;
