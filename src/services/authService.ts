import { createApi } from '@reduxjs/toolkit/query/react';
import config from "../../app-config";
import {baseQuery, onQueryStarted} from "../api";


export const authService  = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQuery,
    endpoints: (builder) => ({
        loadTenant: builder.query({
            query: (id:string) => ({
                url:`/general/get-tenant?tenantId=${id}`,
                headers: {
                    'access_token': config.tenantSecurityToken,
                },
            }),
            transformResponse: (response:any) => {
                return response.object
            }
        }),
        login: builder.mutation({
            query: (body: { username: string; password: string, orgKey:string }) => ({
                url: `/auth/login`,
                method: 'POST',
                body,
            }),
            onQueryStarted:onQueryStarted,
            transformResponse: (response:any) => {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('selectedDepartment');
                }
                return response.object
            }
        }),
        autoLogin: builder.query({
            query: () => ({
                url: `auth/autoLogin`
            }),
            onQueryStarted:onQueryStarted,
            transformResponse: (response:any) => {
                return response.object
            },
            keepUnusedDataFor: 60 * 5
        }),
        logout: builder.mutation({
            query: () => ({
                url: `/auth/logout`,
                method: 'POST',
                body:{},
            }),
            onQueryStarted:onQueryStarted,
            transformResponse: (response:any) => {
                return response.object
            }
        })

    })
})

export const {
    useLogoutMutation,
    useLoadTenantQuery,
    useLoginMutation,
    useAutoLoginQuery
} = authService