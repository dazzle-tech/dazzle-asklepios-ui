import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

import type { ProcedureCoding, CodeOption } from '@/types/model-types-new';

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

type ProcedureCodingCreate = Pick<ProcedureCoding, 'codeType' | 'codeId'>;
type ProcedureCodingUpdate = { id: Id } & Partial<
  Pick<ProcedureCoding, 'codeType' | 'codeId'  | 'lastModifiedBy'>
>;

export const procedureCodingService = createApi({
  reducerPath: 'newProcedureCodingApi',
  baseQuery: BaseQuery,
  tagTypes: ['ProcedureCoding'],
  endpoints: (builder) => ({

    getProcedureCodingsByProcedure: builder.query<
      PagedResult<ProcedureCoding>,
      { procedureId: Id } & PagedParams
    >({
      query: ({ procedureId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure-coding/by-procedure/${encodeURIComponent(String(procedureId))}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['ProcedureCoding'],
    }),

    getCodeOptionsByType: builder.query<PagedResult<CodeOption>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/procedure-coding/codes`,
        params: { type, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['ProcedureCoding'],
    }),

    addProcedureCoding: builder.mutation<
      ProcedureCoding,
      { procedureId: Id } & ProcedureCodingCreate
    >({
      query: ({ procedureId, ...body }) => ({
        url: '/api/setup/procedure-coding',
        method: 'POST',
        params: { procedureId },
        body, 
      }),
      invalidatesTags: ['ProcedureCoding'],
    }),

    deleteProcedureCoding: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/procedure-coding/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProcedureCoding'],
    }),

  }),
});

export const {
  useGetProcedureCodingsByProcedureQuery,
  useLazyGetProcedureCodingsByProcedureQuery,
  useGetCodeOptionsByTypeQuery,
  useLazyGetCodeOptionsByTypeQuery,
  useAddProcedureCodingMutation,
  useDeleteProcedureCodingMutation,
} = procedureCodingService;
