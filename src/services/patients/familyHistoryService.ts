import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { FamilyHistory } from '@/types/model-types-new';

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

export const familyHistoryService = createApi({
  reducerPath: 'familyHistoryApi',
  baseQuery: BaseQuery,
  tagTypes: ['FamilyHistory'],

  endpoints: builder => ({
    getFamilyHistory: builder.query<
      PagedResult<FamilyHistory>,
      { patientId: Id; showCancelled?: boolean } & PagedParams
    >({
      query: ({
        patientId,
        showCancelled = false,
        page,
        size,
        sort = 'id,desc'
      }) => ({
        url: '/api/patient/family-history',
        params: {
          patientId,
          showCancelled,
          page,
          size,
          sort
        }
      }),
      transformResponse: mapPaged,
      providesTags: ['FamilyHistory']
    }),

    /* CREATE */
    addFamilyHistory: builder.mutation<FamilyHistory, FamilyHistory>({
      query: body => ({
        url: '/api/patient/family-history',
        method: 'POST',
        body
      }),
      invalidatesTags: ['FamilyHistory']
    }),

    /* UPDATE */
    updateFamilyHistory: builder.mutation<FamilyHistory, FamilyHistory>({
      query: body => ({
        url: '/api/patient/family-history',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['FamilyHistory']
    }),

    /* CANCEL */
    cancelFamilyHistory: builder.mutation<
      FamilyHistory,
      { id: number; cancellationReason?: string }
    >({
      query: body => ({
        url: '/api/patient/family-history/cancel',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['FamilyHistory']
    }),

    /* DELETE */
    deleteFamilyHistory: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/family-history/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['FamilyHistory']
    })
  })
});

export const {
  useGetFamilyHistoryQuery,
  useLazyGetFamilyHistoryQuery,
  useAddFamilyHistoryMutation,
  useUpdateFamilyHistoryMutation,
  useCancelFamilyHistoryMutation,
  useDeleteFamilyHistoryMutation
} = familyHistoryService;