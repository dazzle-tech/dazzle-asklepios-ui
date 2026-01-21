import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '@/newApi';
import { FavoriteDiagnosticTest, FavoriteDiagnosticTestCreateDTO } from '@/types/model-types-new';

export const favoriteDiagnosticTestService = createApi({
  reducerPath: 'favoriteDiagnosticTestApi',
  baseQuery: BaseQuery,
  tagTypes: ['FavoriteDiagnosticTest'],
  endpoints: builder => ({
    /* ========================= ADD ========================= */

    addFavoriteDiagnosticTest: builder.mutation<
      FavoriteDiagnosticTest,
      FavoriteDiagnosticTestCreateDTO
    >({
      query: payload => ({
        url: '/api/setup/favorite-diagnostic-test',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['FavoriteDiagnosticTest']
    }),

    /* ========================= DELETE ========================= */

    deleteFavoriteDiagnosticTest: builder.mutation<void, { userId: number; testId: number }>({
      query: ({ userId, testId }) => ({
        url: '/api/setup/favorite-diagnostic-test',
        method: 'DELETE',
        params: { userId, testId }
      }),
      invalidatesTags: ['FavoriteDiagnosticTest']
    }),

    /* ========================= LIST BY USER ========================= */

    getFavoriteDiagnosticTestsByUser: builder.query<
      FavoriteDiagnosticTest[],
      { userId: number; page?: number; size?: number }
    >({
      query: ({ userId, page = 0, size = 100 }) => ({
        url: '/api/setup/favorite-diagnostic-test',
        method: 'GET',
        params: { userId, page, size }
      }),
      providesTags: ['FavoriteDiagnosticTest']
    })
  })
});

export const {
  useAddFavoriteDiagnosticTestMutation,
  useDeleteFavoriteDiagnosticTestMutation,
  useGetFavoriteDiagnosticTestsByUserQuery
} = favoriteDiagnosticTestService;
