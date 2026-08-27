import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';
import type { TpaDefinition, TpaLinkedInsuranceCompany } from '@/types/model-types-new';

type PagedParams = {
  page: number;
  size: number;
  sort?: string;
  timestamp?: number;
};

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

const toPagedResult = <T>(res: T[], meta: any): PagedResult<T> => {
  const h = meta?.response?.headers;
  const data = Array.isArray(res) ? res : [];
  return {
    data,
    totalCount: Number(h?.get('X-Total-Count') ?? data.length),
    links: parseLinkHeader(h?.get('Link'))
  };
};

export const TpaDefinitionService = createApi({
  reducerPath: 'tpaDefinitionApi',
  baseQuery: BaseQuery,
  tagTypes: ['TpaDefinition', 'NphiesPayer'],
  endpoints: builder => ({
    getAllTpaDefinitions: builder.query<PagedResult<TpaDefinition>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/tpa-definitions',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getActiveTpaDefinitions: builder.query<PagedResult<TpaDefinition>, PagedParams>({
      query: ({ page, size, sort = 'name,asc' }) => ({
        url: '/api/setup/tpa-definitions/active',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getTpaDefinitionsByCode: builder.query<PagedResult<TpaDefinition>, { tpaCode: string } & PagedParams>({
      query: ({ tpaCode, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/tpa-definitions/by-code/${encodeURIComponent(tpaCode)}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getTpaDefinitionsByName: builder.query<PagedResult<TpaDefinition>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/tpa-definitions/by-name/${encodeURIComponent(name)}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: (res: TpaDefinition[], meta) => toPagedResult(res, meta),
      providesTags: ['TpaDefinition']
    }),

    getTpaDefinitionById: builder.query<TpaDefinition, number | string>({
      query: id => ({
        url: `/api/setup/tpa-definitions/${id}`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'TpaDefinition', id }]
    }),

    getTpaLinkedInsuranceCompanies: builder.query<TpaLinkedInsuranceCompany[], number | string>({
      query: id => ({
        url: `/api/setup/tpa-definitions/${id}/insurance-companies`,
        method: 'GET'
      }),
      providesTags: (_result, _error, id) => [{ type: 'TpaDefinition', id }]
    }),

    createTpaDefinition: builder.mutation<TpaDefinition, Partial<TpaDefinition>>({
      query: body => ({
        url: '/api/setup/tpa-definitions',
        method: 'POST',
        body
      }),
      invalidatesTags: ['TpaDefinition', 'NphiesPayer']
    }),

    updateTpaDefinition: builder.mutation<TpaDefinition, Partial<TpaDefinition>>({
      query: body => ({
        url: '/api/setup/tpa-definitions',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['TpaDefinition', 'NphiesPayer']
    }),

    toggleTpaDefinitionActive: builder.mutation<TpaDefinition, number | string>({
      query: id => ({
        url: `/api/setup/tpa-definitions/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['TpaDefinition', 'NphiesPayer']
    })
  })
});

export const {
  useGetAllTpaDefinitionsQuery,
  useGetActiveTpaDefinitionsQuery,
  useGetTpaDefinitionsByCodeQuery,
  useGetTpaDefinitionsByNameQuery,
  useGetTpaDefinitionByIdQuery,
  useGetTpaLinkedInsuranceCompaniesQuery,
  useCreateTpaDefinitionMutation,
  useUpdateTpaDefinitionMutation,
  useToggleTpaDefinitionActiveMutation
} = TpaDefinitionService;
