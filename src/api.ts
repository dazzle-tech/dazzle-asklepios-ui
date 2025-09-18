import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { notify } from '@/utils/uiReducerActions';
import config from '../app-config';

/**
 * base services setup
 */
export const baseQuery = fetchBaseQuery({
  baseUrl: config.backendBaseURL ? config.backendBaseURL : 'http://localhost:8080',
  prepareHeaders: (headers: Headers, { endpoint, type, getState }) => {
  
    headers.set('screenKey', getState().ui.screenKey);
    return headers;
  }
});

export const dummyBaseQuery = fetchBaseQuery({
  baseUrl: config.backendBaseURL ? config.backendBaseURL : 'http://localhost:8080',
  prepareHeaders: (headers: Headers, { endpoint, type, getState }) => {
    
    headers.set('screenKey', getState().ui.screenKey);
    return headers;
  }
});

/**
 * generic the onQueryStarted function that provides api error handling.
 * should be attached to rkt queries and mutations
 * @param body
 * @param dispatch
 * @param queryFulfilled
 */
export const onQueryStarted = async (body, { dispatch, queryFulfilled }) => {
  try {
    const { data } = await queryFulfilled;

    if (data._responseMsg) {
      dispatch(notify(data._responseMsg));
    }
  } catch (err) {
    console.log(err?.error?.status);
    console.log(err);

    if (err?.error?.status == 422) {
      dispatch(
        notify({ msg: err.error?.data?.message || 'Unprocessable Entity', sev: 'error' })
      );
    } else {
      dispatch(
        notify({ msg: err.error?.data?.msg || 'Internal Server Error', sev: 'error' })
      );
    }
  }
};
