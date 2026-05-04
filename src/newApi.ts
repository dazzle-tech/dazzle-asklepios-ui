// src/newApi.ts
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { notify } from '@/utils/uiReducerActions';
import config from '../app-config';

const baseFetchBaseQuery = fetchBaseQuery({
  baseUrl: config.backendBaseURL
    ? config.backendBaseURL
    : 'http://localhost:8080',

  prepareHeaders: (headers: Headers) => {
    const jwt =
      localStorage.getItem('id_token') ||
      localStorage.getItem('token');

    if (jwt) {
      headers.set('Authorization', `Bearer ${jwt}`);
    }

    return headers;
  },
});

export const BaseQuery = baseFetchBaseQuery;

const normalizeApiErrorMessage = (err: any) => {
  const rawMessage =
    err?.error?.data?.properties?.message || 
    err?.error?.data?.message ||
    err?.error?.data?.detail ||
    err?.error?.data?.msg ||
    err?.error?.message;

  if (typeof rawMessage === 'string' && rawMessage.trim()) {
    const cleaned = rawMessage
      .replace(/^error\./i, '')
      .replace(/_/g, ' ')
      .trim();

    if (
      cleaned &&
      cleaned.toLowerCase() !== 'internal server error' &&
      cleaned.toLowerCase() !== 'bad request'
    ) {
      return cleaned;
    }
  }

  if (err?.error?.status === 422) return 'Unprocessable Entity';
  if (err?.error?.status === 400) return 'Bad Request';

  return 'Internal Server Error';
};

export const onQueryStarted = async (
  body: any,
  { dispatch, queryFulfilled }: any,
) => {
  try {
    const { data } = await queryFulfilled;

    if (data && data._responseMsg) {
      dispatch(notify(data._responseMsg));
    }
  } catch (err: any) {
    const msg = normalizeApiErrorMessage(err);

    dispatch(
      notify({
        msg,
        sev: msg === 'Internal Server Error' ? 'error' : 'warning',
      }),
    );
  }
};