import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { SurgicalHistory } from '@/types/model-types-new';

type Id = number;
type PagedParams = { page: number; size: number; sort?: string };

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: any;
};

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const surgicalHistoryService = createApi({
  reducerPath: 'surgicalHistoryApi',
  baseQuery: BaseQuery,
  tagTypes: ['SurgicalHistory'],

  endpoints: builder => ({

    getSurgicalHistory: builder.query<
      PagedResult<SurgicalHistory>,
      { patientId: Id } & PagedParams
    >({
      query: ({ patientId, page, size, sort = 'id,desc' }) => ({
        url: '/api/patient/surgical-history',
        params: { patientId, page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['SurgicalHistory']
    }),

    addSurgicalHistory: builder.mutation<SurgicalHistory, SurgicalHistory>({
      query: body => ({
        url: '/api/patient/surgical-history',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SurgicalHistory']
    }),

    updateSurgicalHistory: builder.mutation<SurgicalHistory, SurgicalHistory>({
      query: body => ({
        url: '/api/patient/surgical-history',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SurgicalHistory']
    }),

    deleteSurgicalHistory: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/surgical-history/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['SurgicalHistory']
    })
  })
});

export const {
  useGetSurgicalHistoryQuery,
  useLazyGetSurgicalHistoryQuery,
  useAddSurgicalHistoryMutation,
  useUpdateSurgicalHistoryMutation,
  useDeleteSurgicalHistoryMutation
} = surgicalHistoryService;
