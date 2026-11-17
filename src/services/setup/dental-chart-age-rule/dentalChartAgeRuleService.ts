import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { createApi } from '@reduxjs/toolkit/dist/query/react';

type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };
type LinkMap = { next?: string | null; prev?: string | null; first?: string | null; last?: string | null };

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: LinkMap;
};

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link'))
  };
};

export const dentalChartAgeRuleService = createApi({
  reducerPath: 'dentalChartAgeRuleApi',
  baseQuery: BaseQuery,
  tagTypes: ['DentalChartAgeRule'],
  endpoints: builder => ({
    getAllDentalChartAgeRules: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/dental-chart-age-rules',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['DentalChartAgeRule']
    }),

    getDentalChartAgeRulesByName: builder.query<
      PagedResult<any>,
      { name: string; page: number; size: number; sort?: string }
    >({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/dental-chart-age-rules/by-name/${encodeURIComponent(name)}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['DentalChartAgeRule']
    }),

    getDentalChartAgeRulesByChartType: builder.query<
      PagedResult<any>,
      { chartType: string; page: number; size: number; sort?: string }
    >({
      query: ({ chartType, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/dental-chart-age-rules/by-chart-type/${encodeURIComponent(chartType)}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['DentalChartAgeRule']
    }),

    createDentalChartAgeRule: builder.mutation<any, any>({
      query: body => ({
        url: '/api/setup/dental-chart-age-rules',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalChartAgeRule']
    }),

    updateDentalChartAgeRule: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/setup/dental-chart-age-rules/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DentalChartAgeRule']
    }),

    toggleDentalChartAgeRuleActive: builder.mutation<any, number>({
      query: id => ({
        url: `/api/setup/dental-chart-age-rules/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['DentalChartAgeRule']
    })
  })
});

export const {
  useGetAllDentalChartAgeRulesQuery,
  useGetDentalChartAgeRulesByNameQuery,
  useGetDentalChartAgeRulesByChartTypeQuery,
  useCreateDentalChartAgeRuleMutation,
  useUpdateDentalChartAgeRuleMutation,
  useToggleDentalChartAgeRuleActiveMutation
} = dentalChartAgeRuleService;
