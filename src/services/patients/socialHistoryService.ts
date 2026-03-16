import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { SocialHistory } from '@/types/model-types-new';

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

export const socialHistoryService = createApi({
  reducerPath: 'socialHistoryApi',
  baseQuery: BaseQuery,
  tagTypes: ['SocialHistory'],

  endpoints: builder => ({

    getSocialHistory: builder.query<
      PagedResult<SocialHistory>,
      { patientId: Id } & PagedParams
    >({
      query: ({ patientId, page, size, sort = 'id,desc' }) => ({
        url: '/api/patient/social-history',
        params: { patientId, page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['SocialHistory']
    }),

    addSocialHistory: builder.mutation<SocialHistory, SocialHistory>({
      query: body => ({
        url: '/api/patient/social-history',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SocialHistory']
    }),

    updateSocialHistory: builder.mutation<SocialHistory, SocialHistory>({
      query: body => ({
        url: '/api/patient/social-history',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SocialHistory']
    }),

    deleteSocialHistory: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/patient/social-history/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['SocialHistory']
    })
  })
});

export const {
  useGetSocialHistoryQuery,
  useLazyGetSocialHistoryQuery,
  useAddSocialHistoryMutation,
  useUpdateSocialHistoryMutation,
  useDeleteSocialHistoryMutation
} = socialHistoryService;
