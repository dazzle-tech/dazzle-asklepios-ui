import { createSlice } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),  
  token: localStorage.getItem('access_token') 
    ? { accessToken: localStorage.getItem('access_token') } 
    : null,
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
  sessionExpiredBackdrop: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  reducers: {
    setSessionExpiredBackdrop: (state, action) => {
      state.sessionExpiredBackdrop = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('user');
      }
    }
  },
  extraReducers: builder => {
    builder
      .addMatcher(authService.endpoints.loadTenant.matchFulfilled, (state, action) => {
        state.tenant = action.payload;
        localStorage.setItem('tenant', JSON.stringify(action.payload));
      })
      .addMatcher(authService.endpoints.login.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.sessionExpiredBackdrop = false;
        localStorage.setItem('access_token', action.payload.token.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));  
      })
      .addMatcher(authService.endpoints.autoLogin.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.sessionExpiredBackdrop = false;
        localStorage.setItem('access_token', action.payload.token.accessToken);
        localStorage.setItem('user', JSON.stringify(action.payload.user));  
      })
      .addMatcher(authService.endpoints.autoLogin.matchRejected, (state, action) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');  
      })
      .addMatcher(authService.endpoints.logout.matchFulfilled, (state, action) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');  
      });
  }
});

export const { setSessionExpiredBackdrop, setUser } = authSlice.actions;
export default authSlice;
