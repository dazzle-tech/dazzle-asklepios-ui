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

export const dentalToothNumberingService = createApi({
  reducerPath: 'dentalToothNumberingApi',
  baseQuery: BaseQuery,
  tagTypes: ['DentalToothNumberingMethod'],
  endpoints: builder => ({
    getAllDentalToothNumberingMethods: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/dental-tooth-numbering-methods',
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['DentalToothNumberingMethod']
    }),

    getDentalToothNumberingMethodsByName: builder.query<
      PagedResult<any>,
      { name: string; page: number; size: number; sort?: string }
    >({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/dental-tooth-numbering-methods/by-name/${encodeURIComponent(name)}`,
        method: 'GET',
        params: { page, size, sort }
      }),
      transformResponse: mapPaged,
      providesTags: ['DentalToothNumberingMethod']
    }),

    /** Active methods for selectors (Dental Chart Setup). */
    getActiveDentalToothNumberingMethods: builder.query<any[], void>({
      query: () => ({
        url: '/api/setup/dental-tooth-numbering-methods/active',
        method: 'GET'
      }),
      providesTags: ['DentalToothNumberingMethod']
    }),

    createDentalToothNumberingMethod: builder.mutation<any, any>({
      query: body => ({
        url: '/api/setup/dental-tooth-numbering-methods',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DentalToothNumberingMethod']
    }),

    updateDentalToothNumberingMethod: builder.mutation<any, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/api/setup/dental-tooth-numbering-methods/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DentalToothNumberingMethod']
    }),

    toggleDentalToothNumberingMethodActive: builder.mutation<any, number>({
      query: id => ({
        url: `/api/setup/dental-tooth-numbering-methods/${id}/toggle-active`,
        method: 'PATCH'
      }),
      invalidatesTags: ['DentalToothNumberingMethod']
    })
  })
});

export const {
  useGetAllDentalToothNumberingMethodsQuery,
  useGetDentalToothNumberingMethodsByNameQuery,
  useGetActiveDentalToothNumberingMethodsQuery,
  useCreateDentalToothNumberingMethodMutation,
  useUpdateDentalToothNumberingMethodMutation,
  useToggleDentalToothNumberingMethodActiveMutation
} = dentalToothNumberingService;
