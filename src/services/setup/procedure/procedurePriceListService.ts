import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import type { ProcedurePriceList } from '@/types/model-types-new';

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

type ProcedurePriceListCreate = Pick<ProcedurePriceList, 'price' | 'currency'>;

export const procedurePriceListService = createApi({
  reducerPath: 'newProcedurePriceListApi',
  baseQuery: BaseQuery,
  tagTypes: ['ProcedurePriceList'],
  endpoints: (builder) => ({

    getProcedurePriceListByProcedure: builder.query<
      PagedResult<ProcedurePriceList>,
      { procedureId: Id } & PagedParams
    >({
      query: ({ procedureId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure-price-list/by-procedure/${encodeURIComponent(String(procedureId))}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['ProcedurePriceList'],
    }),

    addProcedurePriceList: builder.mutation<
      ProcedurePriceList,
      { procedureId: Id } & ProcedurePriceListCreate
    >({
      query: ({ procedureId, ...body }) => ({
        url: '/api/setup/procedure-price-list',
        method: 'POST',
        params: { procedureId },
        body,
      }),
      invalidatesTags: ['ProcedurePriceList'],
    }),

    // ===== DELETE =====
    deleteProcedurePriceList: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/procedure-price-list/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProcedurePriceList'],
    }),

  }),
});

export const {
  useGetProcedurePriceListByProcedureQuery,
  useLazyGetProcedurePriceListByProcedureQuery,
  useAddProcedurePriceListMutation,
  useDeleteProcedurePriceListMutation,
} = procedurePriceListService;
