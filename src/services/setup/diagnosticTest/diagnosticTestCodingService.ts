import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

import type { DiagnosticTestCoding, CodeOption } from '@/types/model-types-new';

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

type DiagnosticTestCodingCreate = Pick<DiagnosticTestCoding, 'codeType' | 'codeId'>;

export const diagnosticTestCodingService = createApi({
  reducerPath: 'newDiagnosticTestCodingApi',
  baseQuery: BaseQuery,
  tagTypes: ['DiagnosticTestCoding'],
  endpoints: (builder) => ({

    // -----------------------------------------------------
    // GET BY DIAGNOSTIC TEST (Paginated)
    // -----------------------------------------------------
    getDiagnosticTestCodingsByTest: builder.query<
      PagedResult<DiagnosticTestCoding>,
      { diagnosticTestId: Id } & PagedParams
    >({
      query: ({ diagnosticTestId, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/diagnostic-test-coding/by-diagnostic-test/${encodeURIComponent(
          String(diagnosticTestId)
        )}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['DiagnosticTestCoding'],
    }),

    // -----------------------------------------------------
    // GET CODE OPTIONS BY TYPE (CPT, CDT, ICD10, LOINC)
    // -----------------------------------------------------
    getDiagnosticCodeOptionsByType: builder.query<
      PagedResult<CodeOption>,
      { type: string } & PagedParams
    >({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/diagnostic-test-coding/codes`,
        params: { type, page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['DiagnosticTestCoding'],
    }),

    // -----------------------------------------------------
    // CREATE
    // -----------------------------------------------------
    addDiagnosticTestCoding: builder.mutation<DiagnosticTestCoding, { diagnosticTestId: Id } & DiagnosticTestCodingCreate>({
      query: ({ diagnosticTestId, ...body }) => ({
        url: `/api/setup/diagnostic-test-coding`,
        method: 'POST',
        params: { diagnosticTestId },
        body,
      }),
      invalidatesTags: ['DiagnosticTestCoding'],
    }),

    // -----------------------------------------------------
    // DELETE
    // -----------------------------------------------------
    deleteDiagnosticTestCoding: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/diagnostic-test-coding/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DiagnosticTestCoding'],
    }),
  }),
});

export const {
  useGetDiagnosticTestCodingsByTestQuery,
  useLazyGetDiagnosticTestCodingsByTestQuery,
  useGetDiagnosticCodeOptionsByTypeQuery,
  useLazyGetDiagnosticCodeOptionsByTypeQuery,
  useAddDiagnosticTestCodingMutation,
  useDeleteDiagnosticTestCodingMutation,
} = diagnosticTestCodingService;
