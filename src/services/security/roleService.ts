import { createApi } from '@reduxjs/toolkit/query/react';
import {BaseQuery } from '../../newApi'; 
export const roleService = createApi({
  reducerPath: 'roleApi',
  baseQuery: BaseQuery,
    endpoints: builder => ({
        addRole: builder.mutation({
            query: role => ({
                url: '/api/setup/role',
                method: 'POST',
                body: role,
            }),
        }),
        deleteRole: builder.mutation({
            query: (roleId) => ({
                url: `/api/setup/role/${roleId}`,
                method: 'DELETE',
            }),
        }),
        updateRole: builder.mutation({
            query: (role) => ({
                url: `/api/setup/role/${role.id}`,
                method: 'PUT',
                body: role,
            }),
        }),
        getAllRoles: builder.query({
            query: () => ({
                url: '/api/setup/role',
                method: 'GET',
            }), 
        }),
        getRole: builder.mutation({
            query: (roleId) => ({
                url: `/api/setup/role/${roleId}`,
                method: 'GET',
            }),
        }),
        getRolesByFacility: builder.query
        ({
            query: (facilityId) => ({
                url: `/api/setup/role/facility/${facilityId}`,
                method: 'GET',
            }),
        }),

        

    }),
});
export const {
    useAddRoleMutation, 
    useDeleteRoleMutation,
    useUpdateRoleMutation,
    useGetAllRolesQuery,
    useGetRoleMutation,
    useGetRolesByFacilityQuery,
} = roleService;