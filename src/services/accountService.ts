import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../newApi';

export const accountApi = createApi({
  reducerPath: 'accountApi',
  baseQuery: BaseQuery,
  endpoints: (builder) => ({
    getAccount: builder.query<any, void>({
      query: () => '/api/account',
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
    }),
  }),
});

export const { useLazyGetAccountQuery } = accountApi;
