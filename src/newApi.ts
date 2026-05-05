// src/newApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { notify } from '@/utils/uiReducerActions';
import config from '../app-config';
import { RootState } from './store'; 

// Create a base query instance with JWT token injection
const baseFetchBaseQuery = fetchBaseQuery({
  baseUrl: config.backendBaseURL ? config.backendBaseURL : 'http://localhost:8080',
  prepareHeaders: (headers: Headers, { getState }) => {
    const state = getState() as RootState;

    // Read JWT token from localStorage (id_token or token)
    const jwt = localStorage.getItem('id_token') || localStorage.getItem('token');
    if (jwt) {
      headers.set('Authorization', `Bearer ${jwt}`); // Attach token to Authorization header
    }

    return headers;
  }
});

// Export BaseQuery
export const BaseQuery = baseFetchBaseQuery;

/**
 * Generic `onQueryStarted` handler for error handling & notifications
 */
export const onQueryStarted = async (body: any, { dispatch, queryFulfilled }: any) => {
  try {
    const { data } = await queryFulfilled;

    if (data && data._responseMsg) {
      dispatch(notify(data._responseMsg));
    }
  } catch (err: any) {
    console.error('API Error:', err);

    const status = err?.error?.status;

    if (status && status < 500) {
      return;
    }

    dispatch(
      notify({
        msg: err?.error?.data?.message || err?.error?.data?.msg || 'Internal Server Error',
        sev: 'error'
      })
    );
  }
};