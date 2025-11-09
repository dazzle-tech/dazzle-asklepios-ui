import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { parseLinkHeader } from '@/utils/paginationHelper';
import { ActiveIngredient } from '@/types/model-types-new';

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

const mapPaged = <T>(response: T[], meta): PagedResult<T> => {
  const headers = meta?.response?.headers;
  return {
    data: response,
    totalCount: Number(headers?.get('X-Total-Count') ?? 0),
    links: parseLinkHeader(headers?.get('Link')),
  };
};

export const activeIngredientsService = createApi({
  reducerPath: 'activeIngredientsApi',
  baseQuery: BaseQuery,
  tagTypes: ['ActiveIngredients'],
  endpoints: (builder) => ({
    getActiveIngredients: builder.query<PagedResult<ActiveIngredient>, PagedParams>({
      query: ({ page, size, sort = 'id,asc', timestamp }) => ({
        url: '/api/setup/active-ingredients',
        params: { page, size, sort, timestamp },
      }),
      transformResponse: (response: ActiveIngredient[], meta) =>
        mapPaged<ActiveIngredient>(response, meta),
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data
              .filter((item): item is ActiveIngredient & { id: number | string } => item.id != null)
              .map((item) => ({
                type: 'ActiveIngredients' as const,
                id: item.id as Id,
              })),
              { type: 'ActiveIngredients', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredients', id: 'LIST' }],
    }),

    getActiveIngredientsByName: builder.query<
      PagedResult<ActiveIngredient>,
      { name: string } & PagedParams
    >({
      query: ({ name, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/active-ingredients/by-name/${encodeURIComponent(name)}`,
        params: { page, size, sort, timestamp },
      }),
      transformResponse: (response: ActiveIngredient[], meta) =>
        mapPaged<ActiveIngredient>(response, meta),
      providesTags: [{ type: 'ActiveIngredients', id: 'LIST' }],
    }),

    getActiveIngredientsByDrugClass: builder.query<
      PagedResult<ActiveIngredient>,
      { drugClassIds: (number | string)[] } & PagedParams
    >({
      query: ({ drugClassIds, page, size, sort = 'id,asc', timestamp }) => ({
        url: '/api/setup/active-ingredients/by-drugClass',
        params: { drugClassIds, page, size, sort, timestamp },
      }),
      transformResponse: (response: ActiveIngredient[], meta) =>
        mapPaged<ActiveIngredient>(response, meta),
      providesTags: [{ type: 'ActiveIngredients', id: 'LIST' }],
    }),

    getActiveIngredientsByAtcCode: builder.query<
      PagedResult<ActiveIngredient>,
      { atcCode: string } & PagedParams
    >({
      query: ({ atcCode, page, size, sort = 'id,asc', timestamp }) => ({
        url: `/api/setup/active-ingredients/by-atc/${encodeURIComponent(atcCode)}`,
        params: { page, size, sort, timestamp },
      }),
      transformResponse: (response: ActiveIngredient[], meta) =>
        mapPaged<ActiveIngredient>(response, meta),
      providesTags: [{ type: 'ActiveIngredients', id: 'LIST' }],
    }),

    createActiveIngredient: builder.mutation<ActiveIngredient, ActiveIngredient>({
      query: (body) => ({
        url: '/api/setup/active-ingredients',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ActiveIngredients', id: 'LIST' }],
    }),

    updateActiveIngredient: builder.mutation<ActiveIngredient, ActiveIngredient>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredients/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id != null
          ? [
              { type: 'ActiveIngredients', id },
              { type: 'ActiveIngredients', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredients', id: 'LIST' }],
    }),

    toggleActiveIngredientIsActive: builder.mutation<ActiveIngredient, { id: Id }>({
      query: ({ id }) => ({
        url: `/api/setup/active-ingredients/${id}/toggle-active`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id != null
          ? [
              { type: 'ActiveIngredients', id },
              { type: 'ActiveIngredients', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredients', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetActiveIngredientsQuery,
  useLazyGetActiveIngredientsQuery,
  useGetActiveIngredientsByNameQuery,
  useLazyGetActiveIngredientsByNameQuery,
  useGetActiveIngredientsByDrugClassQuery,
  useLazyGetActiveIngredientsByDrugClassQuery,
  useGetActiveIngredientsByAtcCodeQuery,
  useLazyGetActiveIngredientsByAtcCodeQuery,
  useCreateActiveIngredientMutation,
  useUpdateActiveIngredientMutation,
  useToggleActiveIngredientIsActiveMutation,
} = activeIngredientsService;

export default activeIngredientsService;