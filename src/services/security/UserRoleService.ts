import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';
export const userRoleService = createApi({
    reducerPath: 'userRoleApi',
    baseQuery: BaseQuery,
    endpoints: builder => ({
        addUserRole: builder.mutation({
            query: role => ({
                url: '/api/setup/user-role',
                method: 'POST',
                body: role,
            }),
        }),
        deleteUserRole: builder.mutation({
            query: ({ userId, roleId }) => ({
                url: `/api/setup/user-role`,
                method: 'DELETE',
                body: { userId, roleId },
            }),
        }),



        getUserRolesByUserId: builder.query({
            query: (userId) => ({
                url: `/api/setup/user-role/by-user/${userId}`,
                method: "GET",
            }),
        }),

      getMenu: builder.query({
      query: ({ userId, facilityId }) => ({
        url: `/api/setup/menu?userId=${userId}&facilityId=${facilityId}`,
        method: 'GET',
      }),
    }),
    }),
});
export const {
    useAddUserRoleMutation,
    useDeleteUserRoleMutation,
    useGetUserRolesByUserIdQuery,
    useGetMenuQuery
} = userRoleService;



