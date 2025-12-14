import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientDrugInteraction } from '@/types/model-types-new';

const TAG = 'ActiveIngredientDrugInteraction' as const;
type Id = number | string;

export const activeIngredientDrugInteractionService = createApi({
  reducerPath: 'activeIngredientDrugInteractionApi',
  baseQuery: BaseQuery,
  tagTypes: [TAG],
  endpoints: builder => ({
    getByActiveIngredientId: builder.query<ActiveIngredientDrugInteraction[], Id>({
      query: activeIngredientId => ({
        url: `/api/setup/active-ingredient-drug-interactions/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: result =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientDrugInteraction & { id: Id } => item.id != null)
                .map(item => ({ type: TAG, id: item.id as Id })),
              { type: TAG, id: 'LIST' },
            ]
          : [{ type: TAG, id: 'LIST' }],
    }),

    create: builder.mutation<ActiveIngredientDrugInteraction, ActiveIngredientDrugInteraction>({
      query: body => ({
        url: '/api/setup/active-ingredient-drug-interactions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),

    update: builder.mutation<ActiveIngredientDrugInteraction, ActiveIngredientDrugInteraction>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-drug-interactions/${id}`,
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
        url: `/api/setup/active-ingredient-drug-interactions/${id}`,
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
  useGetByActiveIngredientIdQuery,
  useLazyGetByActiveIngredientIdQuery,
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation,
} = activeIngredientDrugInteractionService;

export default activeIngredientDrugInteractionService;

