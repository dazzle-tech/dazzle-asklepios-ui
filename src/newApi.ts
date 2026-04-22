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

    const jwt = localStorage.getItem('id_token') || localStorage.getItem('token');

    console.log('🚀 [prepareHeaders] baseUrl =>', config.backendBaseURL ? config.backendBaseURL : 'http://localhost:8080');
    console.log('🚀 [prepareHeaders] jwt exists =>', !!jwt);
    console.log('🚀 [prepareHeaders] jwt =>', jwt);

    if (jwt) {
      headers.set('Authorization', `Bearer ${jwt}`);
    }

    console.log('🚀 [prepareHeaders] headers prepared');

    return headers;
  }
});

// Wrap BaseQuery for logging
export const BaseQuery = async (args: any, api: any, extraOptions: any) => {
  console.log('📤 [BaseQuery START] args =>', args);

  const result = await baseFetchBaseQuery(args, api, extraOptions);

  console.log('📥 [BaseQuery RESULT] =>', result);

  if ('data' in result) {
    console.log('✅ [BaseQuery DATA] =>', result.data);
    console.log('✅ [BaseQuery DATA isArray] =>', Array.isArray(result.data));
  }

  if ('error' in result) {
    console.log('❌ [BaseQuery ERROR] =>', result.error);
  }

  return result;
};

/**
 * Generic `onQueryStarted` handler for error handling & notifications
 */
export const onQueryStarted = async (body: any, { dispatch, queryFulfilled }: any) => {
  console.log('⏳ [onQueryStarted] body =>', body);

  try {
    const { data } = await queryFulfilled;

    console.log('✅ [onQueryStarted fulfilled] data =>', data);
    console.log('✅ [onQueryStarted fulfilled isArray] =>', Array.isArray(data));

    if (data && data._responseMsg) {
      dispatch(notify(data._responseMsg));
    }
  } catch (err: any) {
    console.error('❌ [onQueryStarted catch] API Error =>', err);

    if (err?.error?.status == 422) {
      dispatch(
        notify({
          msg: err.error?.data?.message || 'Unprocessable Entity',
          sev: 'error',
        })
      );
    } else {
      dispatch(
        notify({
          msg: err.error?.data?.msg || 'Internal Server Error',
          sev: 'error',
        })
      );
    }
  }
};