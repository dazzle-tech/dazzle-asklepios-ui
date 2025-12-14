import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientSynonym } from '@/types/model-types-new';

type Id = number | string;

type ActiveIngredientIdArg = Id;

type SynonymPayload = ActiveIngredientSynonym & { id?: Id };

export const activeIngredientSynonymsService = createApi({
  reducerPath: 'activeIngredientSynonymsApi',
  baseQuery: BaseQuery,
  tagTypes: ['ActiveIngredientSynonyms'],
  endpoints: (builder) => ({
    getActiveIngredientSynonyms: builder.query<ActiveIngredientSynonym[], ActiveIngredientIdArg>({
      query: (activeIngredientId) => ({
        url: `/api/setup/active-ingredient-synonyms/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: (result) =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientSynonym & { id: Id } => item?.id != null)
                .map((item) => ({
                  type: 'ActiveIngredientSynonyms' as const,
                  id: item.id as Id,
                })),
              { type: 'ActiveIngredientSynonyms', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredientSynonyms', id: 'LIST' }],
    }),

    createActiveIngredientSynonym: builder.mutation<ActiveIngredientSynonym, SynonymPayload>({
      query: (body) => ({
        url: '/api/setup/active-ingredient-synonyms',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ActiveIngredientSynonyms', id: 'LIST' }],
    }),

    updateActiveIngredientSynonym: builder.mutation<ActiveIngredientSynonym, SynonymPayload>({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-synonyms/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id != null
          ? [
              { type: 'ActiveIngredientSynonyms', id },
              { type: 'ActiveIngredientSynonyms', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredientSynonyms', id: 'LIST' }],
    }),

    deleteActiveIngredientSynonym: builder.mutation<void, Id>({
      query: (id) => ({
        url: `/api/setup/active-ingredient-synonyms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ActiveIngredientSynonyms', id },
        { type: 'ActiveIngredientSynonyms', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetActiveIngredientSynonymsQuery,
  useLazyGetActiveIngredientSynonymsQuery,
  useCreateActiveIngredientSynonymMutation,
  useUpdateActiveIngredientSynonymMutation,
  useDeleteActiveIngredientSynonymMutation,
} = activeIngredientSynonymsService;

export default activeIngredientSynonymsService;
