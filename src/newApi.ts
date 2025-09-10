// src/newApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { notify } from '@/utils/uiReducerActions';
import config from '../app-config';
import { RootState } from './store'; 

// Create a base query instance with JWT token injection
export const BaseQuery = fetchBaseQuery({
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

/**
 * Generic `onQueryStarted` handler for error handling & notifications
 */
export const onQueryStarted = async (body: any, { dispatch, queryFulfilled }: any) => {
  try {
    // Wait for the query to be fulfilled
    const { data } = await queryFulfilled;

    // If API response contains a message, notify the user
    if (data._responseMsg) {
      dispatch(notify(data._responseMsg));
    }
  } catch (err: any) {
    // Handle errors
    if (err?.error?.status == 422) {
      // Validation error (Unprocessable Entity)
      dispatch(
        notify({
          msg: err.error?.data?.message || 'Unprocessable Entity',
          sev: 'error',
        })
      );
    } else {
      // Generic server error
      dispatch(
        notify({
          msg: err.error?.data?.msg || 'Internal Server Error',
          sev: 'error',
        })
      );
    }
  }
};
