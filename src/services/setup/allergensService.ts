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
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map((i: any) => ({ type: 'Allergens' as const, id: i.id })),
            { type: 'Allergens', id: 'LIST' },
          ]
          : [{ type: 'Allergens', id: 'LIST' }],
    }),

    getAllergensByType: builder.query<PagedResult<any>, { type: any } & PagedParams>({
      query: ({ type, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/allergen/by-type/${encodeURIComponent(type)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map((i: any) => ({ type: 'Allergens' as const, id: i.id })),
            { type: 'Allergens', id: 'LIST' },
          ]
          : [{ type: 'Allergens', id: 'LIST' }],
    }),

    getAllergensByCode: builder.query<PagedResult<any>, { code: string } & PagedParams>({
      query: ({ code, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/allergen/by-code/${encodeURIComponent(code)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map((i: any) => ({ type: 'Allergens' as const, id: i.id })),
            { type: 'Allergens', id: 'LIST' },
          ]
          : [{ type: 'Allergens', id: 'LIST' }],
    }),

    getAllergensByName: builder.query<PagedResult<any>, { name: string } & PagedParams>({
      query: ({ name, page, size, sort = 'id,asc' }) => ({
        url: `/api/setup/allergen/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort },
      }),
      transformResponse: mapPaged,
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map((i: any) => ({ type: 'Allergens' as const, id: i.id })),
            { type: 'Allergens', id: 'LIST' },
          ]
          : [{ type: 'Allergens', id: 'LIST' }],
    }),

    // ===== ALLERGENS (Non-paginated / single) =====
    getAllergenById: builder.query<any, Id>({
      query: (id) => `/api/setup/allergen/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Allergens', id }],
    }),

    // ===== CREATE / UPDATE / DELETE / TOGGLE =====
    addAllergen: builder.mutation<any, any /* AllergenCreate */>({
      query: (body) => ({
        url: '/api/setup/allergen',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Allergens', id: 'LIST' }],
    }),

    updateAllergen: builder.mutation<any, { id: Id } & any /* AllergenUpdate */>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/allergen/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Allergens', id },
        { type: 'Allergens', id: 'LIST' },
      ],
    }),

    deleteAllergen: builder.mutation<void, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/allergen/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Allergens', id },
        { type: 'Allergens', id: 'LIST' },
      ],
    }),

    toggleAllergenIsActive: builder.mutation<any, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/allergen/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Allergens', id },
        { type: 'Allergens', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAllergensQuery,
  useGetAllergensByTypeQuery,
  useLazyGetAllergensByTypeQuery,
  useGetAllergensByCodeQuery,
  useLazyGetAllergensByCodeQuery,
  useGetAllergensByNameQuery,
  useLazyGetAllergensByNameQuery,
  useGetAllergenByIdQuery,
  useAddAllergenMutation,
  useUpdateAllergenMutation,
  useDeleteAllergenMutation,
  useToggleAllergenIsActiveMutation,
} = allergensService;
