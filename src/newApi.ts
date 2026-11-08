// src/newApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { notify } from '@/utils/uiReducerActions';
import { expireSession } from '@/utils/sessionExpiry';
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

/**
 * Logs the user out when the backend rejects their token (expired / invalid).
 * Only reacts if the request carried the token that is still current, so a late
 * 401 from an old session can't log out a fresh login, and never on the login call.
 */
const baseQueryWithSessionExpiry: typeof baseFetchBaseQuery = async (args, api, extraOptions) => {
  const sentToken = localStorage.getItem('id_token') || localStorage.getItem('token');
  const result = await baseFetchBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args?.url;
  if (
    result.error?.status === 401 &&
    sentToken &&
    sentToken === localStorage.getItem('id_token') &&
    !String(url ?? '').includes('/authenticate')
  ) {
    api.dispatch(expireSession() as any);
  }
  return result;
};

// Export BaseQuery
export const BaseQuery = baseQueryWithSessionExpiry;

/** Public endpoints (e.g. patient survey) — no Authorization header */
export const PublicBaseQuery = fetchBaseQuery({
  baseUrl: config.backendBaseURL ? config.backendBaseURL : 'http://localhost:8080'
});

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

  const message =
    err?.error?.data?.message ||
    err?.error?.data?.msg ||
    err?.error?.data?.detail;

  const cleanMessage = message
    ? String(message).replace(/^error\./, '')
    : 'Something went wrong';

  if (status === 422) {
    dispatch(
      notify({
        msg: cleanMessage || 'Unprocessable Entity',
        sev: 'error',
      })
    );
    return;
  }

  if (status && status < 500) {
    return;
  }

  dispatch(
    notify({
      msg: cleanMessage || 'Internal Server Error',
      sev: 'error'
    })
  );
}
};