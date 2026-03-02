import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery, onQueryStarted } from '../api';

export const idParsingService = createApi({
  reducerPath: 'idParsingApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    parseIdDocument: builder.mutation<any, File>({
      query: file => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: `/encounter/api/passport/parse`,
          method: 'POST',
          body: formData
        };
      },
      onQueryStarted,
      transformResponse: (response: any) => {
        return response;
      }
    }),

    healthCheck: builder.query<{ status: string }, void>({
      query: () => ({
        url: `/encounter/api/passport/health`
      }),
      onQueryStarted
    })
  })
});

export const { useParseIdDocumentMutation, useHealthCheckQuery } = idParsingService;
