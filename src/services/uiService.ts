import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { onQueryStarted, baseQuery } from '@/api';

export const uiService = createApi({
  reducerPath: 'uiApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    changeLang: builder.mutation({
      query: (lang: string) => ({
        url: `/utility/load-ui-translations`,
        method: 'POST',
        headers: {
          lang
        }
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response.object;
      }
    }),
    loadNavigationMap: builder.query({
      query: () => ({
        url: `/setup/navigation-map`
      }),
      onQueryStarted: onQueryStarted,
      keepUnusedDataFor: 1,
      transformResponse: (response: any) => {
        return response.object;
      }
    })
  })
});

export const { useChangeLangMutation, useLoadNavigationMapQuery } = uiService;
