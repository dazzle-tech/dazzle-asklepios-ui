import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientIndication } from '@/types/model-types-new';

const TAG = 'ActiveIngredientIndication' as const;
type Id = number | string;

export const activeIngredientIndicationService = createApi({
  reducerPath: 'activeIngredientIndicationApi',
  baseQuery: BaseQuery,
  tagTypes: [TAG],
  endpoints: builder => ({
    getByActiveIngredientId: builder.query<ActiveIngredientIndication[], Id>({
      query: activeIngredientId => ({
        url: `/api/setup/active-ingredient-indications/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: result =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientIndication & { id: Id } => item.id != null)
                .map(item => ({ type: TAG, id: item.id as Id })),
              { type: TAG, id: 'LIST' },
            ]
          : [{ type: TAG, id: 'LIST' }],
    }),

    create: builder.mutation<ActiveIngredientIndication, ActiveIngredientIndication>({
      query: body => ({
        url: '/api/setup/active-ingredient-indications',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),

    update: builder.mutation<ActiveIngredientIndication, ActiveIngredientIndication>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-indications/${id}`,
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
        url: `/api/setup/active-ingredient-indications/${id}`,
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
  useGetByActiveIngredientIdQuery: useGetIndicationsByActiveIngredientIdQuery,
  useLazyGetByActiveIngredientIdQuery: useLazyGetIndicationsByActiveIngredientIdQuery,
  useCreateMutation: useCreateIndicationMutation,
  useUpdateMutation: useUpdateIndicationMutation,
  useDeleteMutation: useDeleteIndicationMutation,
} = activeIngredientIndicationService;

export default activeIngredientIndicationService;
