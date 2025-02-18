import { createSlice } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';

const initialState = {
  user: null,
  token: null,
  tenant: null,
  sessionExpiredBackdrop: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  reducers: {
    setSessionExpiredBackdrop: (state, action) => {
      state.sessionExpiredBackdrop = action.payload;
    },
    setUser:(state,action) =>{
      state.user = action.payload
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
      })
      .addMatcher(authService.endpoints.autoLogin.matchFulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.sessionExpiredBackdrop = false;
        localStorage.setItem('access_token', action.payload.token.accessToken);
      })
      .addMatcher(authService.endpoints.autoLogin.matchRejected, (state, action) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('access_token');
      })
      .addMatcher(authService.endpoints.logout.matchFulfilled, (state, action) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('access_token');
      });
  }
});

export const { setSessionExpiredBackdrop,setUser } = authSlice.actions;
export default authSlice;
