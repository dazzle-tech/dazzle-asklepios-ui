import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../newApi';

type UserBasicNameResponseVM = {
  firstName: string;
  lastName: string;
};

export const accountApi = createApi({
  reducerPath: 'accountApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    getAccount: builder.query<any, void>({
      query: () => '/api/account',
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
    }),

    // POST: /account/bulk/basic-name
    getUsersBasicNamesBulk: builder.mutation<UserBasicNameResponseVM[], number[]>({
      query: ids => ({
        url: '/api/account/bulk/basic-name',
        method: 'POST',
        body: ids,
      }),
      async onQueryStarted(arg, api) {
        await onQueryStarted(arg, api);
      },
    }),
  }),
});

export const {
  useLazyGetAccountQuery,
  useGetUsersBasicNamesBulkMutation,
} = accountApi;
