import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery, onQueryStarted } from '../newApi';


export const userService = createApi({
  reducerPath: 'newApi',
  baseQuery: BaseQuery,
  endpoints: builder => ({
    // ==== Users APIs ====
    getUser: builder.query({
      query: (_: void) => '/api/admin/users',
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

    getUserByLogin: builder.query({ query: (login: string) => ({ url: `/api/admin/users/${encodeURIComponent(login)}`, method: 'GET', }), }),


    getActiveAdmins: builder.query({
      query: (pageable?: { page?: number; size?: number; sort?: string }) => {
        const params = new URLSearchParams();
        if (pageable?.page !== undefined) {
          params.append('page', pageable.page.toString());
        }
        if (pageable?.size !== undefined) {
          params.append('size', pageable.size.toString());
        }
        if (pageable?.sort) {
          params.append('sort', pageable.sort);
        }
        const queryString = params.toString();
        return `/api/admin/users/admins/active${queryString ? `?${queryString}` : ''}`;
      },
    }),


    getUsersBasic: builder.query({
      query: ({
        page = 0,
        size = 15,
        sort = 'id,asc',
        login,
        email,
        name,
        jobRole,
      }) => {
        const params = new URLSearchParams();

        params.append('page', String(page));
        params.append('size', String(size));
        params.append('sort', sort);

        if (login) params.append('login', login);
        if (email) params.append('email', email);
        if (name) params.append('name', name);
        if (jobRole) params.append('jobRole', jobRole);

        return {
          url: `/api/admin/users-basic?${params.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any[], meta) => {
        const headers = meta?.response?.headers;
        return {
          data: response ?? [],
          totalCount: Number(headers?.get('X-Total-Count') ?? 0),
          links: headers?.get('Link'),
        };
      },
    }),


    getUserEncountersAccess: builder.query({
      query: (userId: number) =>
        `/api/admin/users/${userId}/encounters-access`,
    }),

    updateUserEncountersAccess: builder.mutation({
      query: ({ userId, data }) => ({
        url: `/api/admin/users/${userId}/encounters-access`,
        method: 'PUT',
        body: data,
      }),
    }),


    addUser: builder.mutation({
      query: user => ({
        url: '/api/admin/users',
        method: 'POST',
        body: user,
      }),
    }),
    searchUsers: builder.query({
      query: ({
        filter,
        page = 0,
        size = 10,
        sort = 'id,asc',
      }) => ({
        url: `/api/admin/users/search?page=${page}&size=${size}&sort=${sort}`,
        method: 'POST',
        body: filter,
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

    // Create-password flow
    finishCreatePassword: builder.mutation({
      query: (keyAndPassword) => ({
        url: '/api/account/create-password/finish',
        method: 'POST',
        body: keyAndPassword,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    validateCreatePasswordKey: builder.query({
      query: (key: string) => ({
        url: `/api/account/create-password/validate?key=${encodeURIComponent(key)}`,
        method: 'GET',
      }),
      onQueryStarted: onQueryStarted,
      transformResponse: (response: any) => {
        return response;
      },
      transformErrorResponse: (response: any) => {
        return response;
      },
    }),

    // ==== Duplication Candidates APIs ====
    getDuplicationCandidates: builder.query({
      query: (role?: string) =>
        role
          ? `/api/setup/duplication-candidates?role=${role}`
          : '/api/setup/duplication-candidates',
    }),

    getRolePermissions: builder.query({
      query: (roleId: number) => `/api/setup/role/${roleId}/screens`,
    }),

    getUserFullNameByLogin: builder.query({
      query: (login: string) => ({
        url: `/api/setup/user-departments/user/full-name?login=${encodeURIComponent(login)}`,
        method: 'GET',
        responseHandler: 'text',
      }),
      transformResponse: (response: string) => response,
    }),

    updateRolePermissions: builder.mutation({
      query: ({ roleId, permissions }) => ({
        url: `/api/setup/role/${roleId}/screens`,
        method: 'PUT',
        body: permissions,
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
    resendCreatePasswordEmail: builder.mutation<void, string>({
      query: (login) => ({
        url: `/api/admin/users/resend-create-password-email/${encodeURIComponent(login)}`,
        method: 'POST',
      }),
    }),
    toggleUserActivation: builder.mutation<void, string>({
      query: login => ({
        url: `/api/admin/users/${encodeURIComponent(login)}/toggle-activation`,
        method: 'POST',
      }),
    }),
  }),

});

export const {
  useGetActiveAdminsQuery,
  useGetUserQuery,
  useGetUsersBasicQuery,
  useAddUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
  useSearchUsersQuery,
  useRequestPasswordResetMutation,
  useGetAccountQuery,
  useSaveAccountMutation,
  useFinishPasswordResetMutation,
  useChangePasswordMutation,
  useGetDuplicationCandidatesQuery,
  useCreateDuplicationCandidateMutation,
  useUpdateDuplicationCandidateMutation,
  useReactivateDuplicationCandidateMutation,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
  useFinishCreatePasswordMutation,
  useValidateCreatePasswordKeyQuery,
  useLazyValidateCreatePasswordKeyQuery,
  useGetUserFullNameByLoginQuery,
  useLazyGetUserFullNameByLoginQuery,
  useResendCreatePasswordEmailMutation,
  useToggleUserActivationMutation,
  useGetUserEncountersAccessQuery,
  useLazyGetUserEncountersAccessQuery,
  useUpdateUserEncountersAccessMutation,
  useGetUserByLoginQuery,
  useLazyGetUserByLoginQuery,
} = userService;
