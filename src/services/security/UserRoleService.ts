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
    }),
});
export const {
    useAddUserRoleMutation,
    useDeleteUserRoleMutation,
    useGetUserRolesByUserIdQuery
} = userRoleService;



