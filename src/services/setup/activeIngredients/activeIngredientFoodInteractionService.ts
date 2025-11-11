import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientFoodInteraction } from '@/types/model-types-new';

const TAG = 'ActiveIngredientFoodInteraction' as const;
type Id = number | string;

export const activeIngredientFoodInteractionService = createApi({
  reducerPath: 'activeIngredientFoodInteractionApi',
  baseQuery: BaseQuery,
  tagTypes: [TAG],
  endpoints: builder => ({
    getByActiveIngredientId: builder.query<ActiveIngredientFoodInteraction[], Id>({
      query: activeIngredientId => ({
        url: `/api/setup/active-ingredient-food-interactions/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: result =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientFoodInteraction & { id: Id } => item.id != null)
                .map(item => ({ type: TAG, id: item.id as Id })),
              { type: TAG, id: 'LIST' },
            ]
          : [{ type: TAG, id: 'LIST' }],
    }),

    create: builder.mutation<ActiveIngredientFoodInteraction, ActiveIngredientFoodInteraction>({
      query: body => ({
        url: '/api/setup/active-ingredient-food-interactions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),

    update: builder.mutation<ActiveIngredientFoodInteraction, ActiveIngredientFoodInteraction>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-food-interactions/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id != null
          ? [
              { type: TAG, id },
              { type: TAG, id: 'LIST' },
            ]
          : [{ type: TAG, id: 'LIST' }],
    }),

    delete: builder.mutation<void, Id>({
      query: id => ({
        url: `/api/setup/active-ingredient-food-interactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: TAG, id },
        { type: TAG, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetByActiveIngredientIdQuery: useGetFoodInteractionsByActiveIngredientIdQuery,
  useLazyGetByActiveIngredientIdQuery: useLazyGetFoodInteractionsByActiveIngredientIdQuery,
  useCreateMutation: useCreateFoodInteractionMutation,
  useUpdateMutation: useUpdateFoodInteractionMutation,
  useDeleteMutation: useDeleteFoodInteractionMutation,
} = activeIngredientFoodInteractionService;

export default activeIngredientFoodInteractionService;
