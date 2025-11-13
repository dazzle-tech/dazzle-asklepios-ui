import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';

type Id = number | string;
type PagedParams = { page: number; size: number; sort?: string; timestamp?: number };

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

const mapPaged = (response: any[], meta): PagedResult<any> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const allergensService = createApi({
  reducerPath: 'allergensApi',
  baseQuery: BaseQuery,
  tagTypes: ['Allergens'],
  endpoints: (builder) => ({
    getAllergens: builder.query<PagedResult<any>, PagedParams>({
      query: ({ page, size, sort = 'id,asc' }) => ({
        url: '/api/setup/allergen',
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Allergens'],
    }),

    getAllergensByType: builder.query<PagedResult<any>, { type: string } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/allergen/by-type/${encodeURIComponent(type)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Allergens'],
    }),

    getAllergensByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/allergen/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: ['Allergens'],
    }),

    addAllergen: builder.mutation<any, any>({
      query: (body) => ({
        url: '/api/setup/allergen',
        method: 'POST',
        body: { ...body },
      }),
      invalidatesTags: ['Allergens'],
    }),

    updateAllergen: builder.mutation<any, { id: Id } & any>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/allergen/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: ['Allergens'],
    }),

    deleteAllergen: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/allergen/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Allergens'],
    }),

    toggleAllergenIsActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/allergen/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Allergens'],
    }),
  }),
});

export const {
  useGetAllergensQuery,
  useLazyGetAllergensByTypeQuery,
  useLazyGetAllergensByNameQuery,
  useAddAllergenMutation,
  useUpdateAllergenMutation,
  useDeleteAllergenMutation,
  useToggleAllergenIsActiveMutation,
} = allergensService;
