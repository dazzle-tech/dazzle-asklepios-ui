import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { notify } from '@/utils/uiReducerActions';
import config from '../app-config';

/**
 * base services setup
 */
export const baseQuery = fetchBaseQuery({
  baseUrl: config.backendBaseURL ? config.backendBaseURL : 'http://localhost:8080', // TODO change from config file to env variable
  prepareHeaders: (headers: Headers, { endpoint, type, getState }) => {
    if (endpoint === 'loadTenant' && type === 'query') {
      headers.set('access_token', `${config.tenantSecurityToken ? config.tenantSecurityToken : '4994'}`); // TODO change from config file to secure secrets storing/loading
    } else {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('access_token', `${token}`);
      } else {
        headers.set('access_token', `wrong_token`);
      }
    }

    headers.set('screenKey', getState().ui.screenKey);
    return headers;
  }
});

export const dummyBaseQuery = fetchBaseQuery({
  baseUrl: config.backendBaseURL ? config.backendBaseURL : 'http://localhost:8080', // TODO change from config file to env variable
  prepareHeaders: (headers: Headers, { endpoint, type }) => {
    if (endpoint === 'loadTenant' && type === 'query') {
      headers.set('access_token', `${config.tenantSecurityToken}`); // TODO change from config file to secure secrets storing/loading
    } else {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('access_token', `${token}`);
      } else {
        headers.set('access_token', `wrong_token`);
      }
    }
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
    console.log(data);
    
    if(data._responseMsg){
      dispatch(notify(data._responseMsg));
    }
  } catch (err) {
    dispatch(notify({ msg: err.error?.data?.msg || 'Internal Server Error', sev: 'error' }));
  }
};
