import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientContraindication } from '@/types/model-types-new';

const TAG = 'ActiveIngredientContraindication' as const;
type Id = number | string;

export const activeIngredientContraindicationService = createApi({
  reducerPath: 'activeIngredientContraindicationApi',
  baseQuery: BaseQuery,
  tagTypes: [TAG],
  endpoints: builder => ({
    getByActiveIngredientId: builder.query<ActiveIngredientContraindication[], Id>({
      query: activeIngredientId => ({
        url: `/api/setup/active-ingredient-contraindications/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: result =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientContraindication & { id: Id } => item.id != null)
                .map(item => ({ type: TAG, id: item.id as Id })),
              { type: TAG, id: 'LIST' },
            ]
          : [{ type: TAG, id: 'LIST' }],
    }),

    create: builder.mutation<ActiveIngredientContraindication, ActiveIngredientContraindication>({
      query: body => ({
        url: '/api/setup/active-ingredient-contraindications',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: TAG, id: 'LIST' }],
    }),

    update: builder.mutation<ActiveIngredientContraindication, ActiveIngredientContraindication>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-contraindications/${id}`,
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
        url: `/api/setup/active-ingredient-contraindications/${id}`,
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
  useGetByActiveIngredientIdQuery: useGetContraindicationsByActiveIngredientIdQuery,
  useLazyGetByActiveIngredientIdQuery: useLazyGetContraindicationsByActiveIngredientIdQuery,
  useCreateMutation: useCreateContraindicationMutation,
  useUpdateMutation: useUpdateContraindicationMutation,
  useDeleteMutation: useDeleteContraindicationMutation,
} = activeIngredientContraindicationService;

export default activeIngredientContraindicationService;
