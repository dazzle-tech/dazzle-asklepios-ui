import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { ActiveIngredientPreRequestedTest } from '@/types/model-types-new';

type Id = number | string;

export const activeIngredientPreRequestedTestService = createApi({
  reducerPath: 'activeIngredientPreRequestedTestsApi',
  baseQuery: BaseQuery,
  tagTypes: ['ActiveIngredientPreRequestedTests'],
  endpoints: (builder) => ({
    getActiveIngredientPreRequestedTests: builder.query<
      ActiveIngredientPreRequestedTest[],
      Id
    >({
      query: (activeIngredientId) => ({
        url: `/api/setup/active-ingredient-pre-requested-tests/by-active-ingredient/${activeIngredientId}`,
      }),
      providesTags: (result) =>
        result?.length
          ? [
              ...result
                .filter((item): item is ActiveIngredientPreRequestedTest & { id: Id } =>
                  item?.id != null
                )
                .map((item) => ({
                  type: 'ActiveIngredientPreRequestedTests' as const,
                  id: item.id as Id,
                })),
              { type: 'ActiveIngredientPreRequestedTests', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredientPreRequestedTests', id: 'LIST' }],
    }),

    createActiveIngredientPreRequestedTest: builder.mutation<
      ActiveIngredientPreRequestedTest,
      ActiveIngredientPreRequestedTest
    >({
      query: (body) => ({
        url: '/api/setup/active-ingredient-pre-requested-tests',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'ActiveIngredientPreRequestedTests', id: 'LIST' }],
    }),

    updateActiveIngredientPreRequestedTest: builder.mutation<
      ActiveIngredientPreRequestedTest,
      ActiveIngredientPreRequestedTest
    >({
      query: ({ id, ...body }) => ({
        url: `/api/setup/active-ingredient-pre-requested-tests/${id}`,
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: (_result, _error, { id }) =>
        id != null
          ? [
              { type: 'ActiveIngredientPreRequestedTests', id },
              { type: 'ActiveIngredientPreRequestedTests', id: 'LIST' },
            ]
          : [{ type: 'ActiveIngredientPreRequestedTests', id: 'LIST' }],
    }),

    deleteActiveIngredientPreRequestedTest: builder.mutation<void, Id>({
      query: (id) => ({
        url: `/api/setup/active-ingredient-pre-requested-tests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ActiveIngredientPreRequestedTests', id },
        { type: 'ActiveIngredientPreRequestedTests', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetActiveIngredientPreRequestedTestsQuery,
  useLazyGetActiveIngredientPreRequestedTestsQuery,
  useCreateActiveIngredientPreRequestedTestMutation,
  useUpdateActiveIngredientPreRequestedTestMutation,
  useDeleteActiveIngredientPreRequestedTestMutation,
} = activeIngredientPreRequestedTestService;

export default activeIngredientPreRequestedTestService;
