import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientAdverseEffect } from '@/types/model-types-new';

const TAG = 'ActiveIngredientAdverseEffect' as const;
type Id = number | string;

export const activeIngredientAdverseEffectService = createApi({
  reducerPath: 'activeIngredientAdverseEffectApi',
  baseQuery: BaseQuery,
  tagTypes: [TAG],
  endpoints: builder => ({
    getByActiveIngredientId: builder.query<ActiveIngredientAdverseEffect[], Id>({
      query: activeIngredientId => ({
        url: `/api/setup/active-ingredient-adverse-effects/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: result =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientAdverseEffect & { id: Id } => item.id != null)
                .map(item => ({ type: TAG, id: item.id as Id })),
              { type: TAG, id: 'LIST' },
            ]
          : [{ type: TAG, id: 'LIST' }],
    }),

    create: builder.mutation<ActiveIngredientAdverseEffect, ActiveIngredientAdverseEffect>({
      query: body => ({
        url: '/api/setup/active-ingredient-adverse-effects',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),

    update: builder.mutation<ActiveIngredientAdverseEffect, ActiveIngredientAdverseEffect>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-adverse-effects/${id}`,
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
        url: `/api/setup/active-ingredient-adverse-effects/${id}`,
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
  useGetByActiveIngredientIdQuery: useGetAdverseEffectsByActiveIngredientIdQuery,
  useLazyGetByActiveIngredientIdQuery: useLazyGetAdverseEffectsByActiveIngredientIdQuery,
  useCreateMutation: useCreateAdverseEffectMutation,
  useUpdateMutation: useUpdateAdverseEffectMutation,
  useDeleteMutation: useDeleteAdverseEffectMutation,
} = activeIngredientAdverseEffectService;

export default activeIngredientAdverseEffectService;
