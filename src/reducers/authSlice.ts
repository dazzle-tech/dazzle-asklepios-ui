import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ==================
// Helper functions for JWT
// ==================

// Decode base64Url string (used to decode JWT payload)
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = str.padEnd(str.length + (4 - (str.length % 4)) % 4, '=');
  return atob(padded);
}

// Check if a JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;

    const decodedPayload = JSON.parse(base64UrlDecode(payloadBase64));
    const exp = decodedPayload.exp;

    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000); // current time in seconds
    return exp < now; // return true if token expired
  } catch (error) {
    console.error('Invalid token:', error);
    return true; // treat invalid token as expired
  }
}

// ==================
// State definition
// ==================
interface AuthState {
  user: any | null;                 // logged-in user object
  token: string | null;             // JWT token
  tenant: any | null;               // tenant (organization) info
  sessionExpiredBackdrop: boolean;  // flag for showing session expired modal/backdrop
}

// Initial state, pulling values from localStorage if available
const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('id_token') || null,
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
  sessionExpiredBackdrop: false
};

// ==================
// Auth slice definition
// ==================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set or clear session expired backdrop flag
    setSessionExpiredBackdrop: (state, action: PayloadAction<boolean>) => {
      state.sessionExpiredBackdrop = action.payload;
    },

    // Save user object to state and localStorage
    setUser: (state, action: PayloadAction<any | null>) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('user');
      }
    },

    // Save token to state and localStorage
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('id_token', action.payload);
      } else {
        localStorage.removeItem('id_token');
      }
    },

    // Save tenant info to state and localStorage
    setTenant: (state, action: PayloadAction<any | null>) => {
      state.tenant = action.payload;
      if (action.payload) {
        localStorage.setItem('tenant', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('tenant');
      }
    },

    // Clear all authentication data (logout)
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.tenant = null;
      localStorage.removeItem('id_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
    },

    // Check token validity and clear state if expired
    checkTokenValidity: (state) => {
      const token = state.token;
      if (token && isTokenExpired(token)) {
        state.user = null;
        state.token = null;
        state.tenant = null;
        localStorage.removeItem('id_token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
      }
    }
  }
});

// Export actions for use in components
export const {
  setSessionExpiredBackdrop,
  setUser,
  setToken,
  setTenant,
  logout,
  checkTokenValidity
} = authSlice.actions;

// Export reducer to be added to store
export default authSlice.reducer;
