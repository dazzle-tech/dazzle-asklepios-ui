import { BaseQuery } from './../../newApi';
import { createApi } from '@reduxjs/toolkit/query/react';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };
type PagedResult<T> = { data: T[]; totalCount: number; links?: LinkMap };

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const visitDurationService = createApi({
  reducerPath: 'visitDurationApi',
  baseQuery: BaseQuery,
  tagTypes: ['VisitDuration'],
  endpoints: builder => ({

    getVisitDurations: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/visit-duration',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['VisitDuration'],
    }),

    getVisitDurationsByType: builder.query<
      PagedResult<any>,
      { visitType: string } & PagedParams
    >({
      query: ({ visitType, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/visit-duration/by-type/${encodeURIComponent(visitType)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['VisitDuration'],
    }),

    addVisitDuration: builder.mutation<any, any>({
      query: body => ({
        url: '/api/setup/visit-duration',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['VisitDuration'],
    }),

    updateVisitDuration: builder.mutation<any, { id: Id } & any>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/visit-duration/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: ['VisitDuration'],
    }),

    deleteVisitDuration: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/visit-duration/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['VisitDuration'],
    }),
  }),
});

export const {
  useGetVisitDurationsQuery,
  useLazyGetVisitDurationsQuery,
  useGetVisitDurationsByTypeQuery,
  useLazyGetVisitDurationsByTypeQuery,
  useAddVisitDurationMutation,
  useUpdateVisitDurationMutation,
  useDeleteVisitDurationMutation,
} = visitDurationService;
