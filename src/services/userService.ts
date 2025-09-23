import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../newApi';

export const userService = createApi({
  reducerPath: 'newApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    // ==== Users APIs ====
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
        body: accountData,
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


    // ==== Duplication Candidates APIs ====
    getDuplicationCandidates: builder.query({
      query: (role?: string) =>
        role
          ? `/api/setup/duplication-candidates?role=${role}`
          : '/api/setup/duplication-candidates',
    }),

    getScreens: builder.query({
      query: () => '/api/setup/screen',
    }),
    getRolePermissions: builder.query({
      query: (roleId: number) => `/api/setup/role/${roleId}/screens`,
    }),

    // 🔹 تحديث صلاحيات الرول
    updateRolePermissions: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/api/setup/role/${roleId}/screens`,
        method: 'PUT',
        body: permissions, // array of { screen, permission }
      }),
    }),



    createDuplicationCandidate: builder.mutation({
      query: (candidate) => ({
        url: '/api/setup/duplication-candidates',
        method: 'POST',
        body: candidate,
      }),
    }),
    updateDuplicationCandidate: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/setup/duplication-candidates/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),
    deactivateDuplicationCandidate: builder.mutation({
      query: (id) => ({
        url: `/api/setup/duplication-candidates/deactivate/${id}`,
        method: 'PUT',
      }),
    }),

    reactivateDuplicationCandidate: builder.mutation({
      query: (id) => ({
        url: `/api/setup/duplication-candidates/reactivate/${id}`,
        method: 'PUT',
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
  useChangePasswordMutation,

  // Hooks for duplication candidates
  useGetDuplicationCandidatesQuery,
  useCreateDuplicationCandidateMutation,
  useUpdateDuplicationCandidateMutation,
  useDeactivateDuplicationCandidateMutation,
  useReactivateDuplicationCandidateMutation
  ,

  useGetScreensQuery,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation
} = userService;

