import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '../api';

export const userService = createApi({
  reducerPath: 'newApi',
  baseQuery: baseQuery,
  endpoints: builder => ({
    getUser: builder.query({
      query: (_: void) => '/api/admin/users',
    }),
    addUser: builder.mutation({
      query: user => ({
        url: '/api/admin/users',
        method: 'POST',
        body: user,
      }),
    }),
    deleteUser: builder.mutation({
      query: (login) => ({
        url: `/api/admin/users/${login}`,
        method: 'DELETE',
      }),
    }),
    updateUser: builder.mutation({
      query: (user) => ({
        url: '/api/admin/users',
        method: 'PUT',
        body: user,
      }),
    }),

    requestPasswordReset: builder.mutation({
      query: (email) => ({
        url: '/api/account/reset-password/init',
        method: 'POST',
        body: email,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    getAccount: builder.query({
      query: () => ({
        url: '/api/account',
        method: 'GET',
      }),
    }),

    saveAccount: builder.mutation({
      query: (accountData) => ({
        url: '/api/account',
        method: 'POST',
        body: accountData
      }),
    }),
    finishPasswordReset: builder.mutation({
      query: (keyAndPassword) => ({
        url: '/api/account/reset-password/finish',
        method: 'POST',
        body: keyAndPassword,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    changePassword: builder.mutation({
      query: (passwordChangeDto) => ({
        url: '/api/account/change-password',
        method: 'POST',
        body: passwordChangeDto,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),


  }),


});
export const {
  useGetUserQuery,
  useAddUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useRequestPasswordResetMutation,
  useGetAccountQuery,
  useSaveAccountMutation,
  useFinishPasswordResetMutation,
  useChangePasswordMutation
} = userService;