import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientSpecialPopulation } from '@/types/model-types-new';

type Id = number | string;

export const activeIngredientSpecialPopulationService = createApi({
  reducerPath: 'activeIngredientSpecialPopulationApi',
  baseQuery: BaseQuery,
  tagTypes: ['ActiveIngredientSpecialPopulations'],
  endpoints: (builder) => ({
    getActiveIngredientSpecialPopulations: builder.query<ActiveIngredientSpecialPopulation[], Id>({
      query: (activeIngredientId) => ({
        url: `/api/setup/active-ingredient-special-populations/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: (result) =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientSpecialPopulation & { id: Id } => item?.id != null)
                .map((item) => ({ type: 'ActiveIngredientSpecialPopulations' as const, id: item.id as Id })),
              { type: 'ActiveIngredientSpecialPopulations', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredientSpecialPopulations', id: 'LIST' }],
    }),

    createActiveIngredientSpecialPopulation: builder.mutation<
      ActiveIngredientSpecialPopulation,
      ActiveIngredientSpecialPopulation
    >({
      query: (body) => ({
        url: '/api/setup/active-ingredient-special-populations',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ActiveIngredientSpecialPopulations', id: 'LIST' }],
    }),

    updateActiveIngredientSpecialPopulation: builder.mutation<
      ActiveIngredientSpecialPopulation,
      ActiveIngredientSpecialPopulation
    >({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-special-populations/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id != null
          ? [
              { type: 'ActiveIngredientSpecialPopulations', id },
              { type: 'ActiveIngredientSpecialPopulations', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredientSpecialPopulations', id: 'LIST' }],
    }),

    deleteActiveIngredientSpecialPopulation: builder.mutation<void, Id>({
      query: (id) => ({
        url: `/api/setup/active-ingredient-special-populations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ActiveIngredientSpecialPopulations', id },
        { type: 'ActiveIngredientSpecialPopulations', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetActiveIngredientSpecialPopulationsQuery,
  useLazyGetActiveIngredientSpecialPopulationsQuery,
  useCreateActiveIngredientSpecialPopulationMutation,
  useUpdateActiveIngredientSpecialPopulationMutation,
  useDeleteActiveIngredientSpecialPopulationMutation,
} = activeIngredientSpecialPopulationService;

export default activeIngredientSpecialPopulationService;
