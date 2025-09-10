// services/authServiceApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../newApi';

interface LoginRequest {
  username: string;
  password: string;
  facilityId: number;
  rememberMe: boolean;
}

interface LoginResponse {
  id_token: string;
}

export const authServiceApi = createApi({
  reducerPath: 'authServiceApi',
  baseQuery: BaseQuery, 
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/api/authenticate', 
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useLoginMutation } = authServiceApi;
