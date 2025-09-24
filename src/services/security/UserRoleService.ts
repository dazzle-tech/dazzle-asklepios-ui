import { createApi } from '@reduxjs/toolkit/query/react';
import {BaseQuery } from '../../newApi'; 
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
            query: (roleId) => ({
                url: `/api/setup/user-role/${roleId}`,
                method: 'DELETE',
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



