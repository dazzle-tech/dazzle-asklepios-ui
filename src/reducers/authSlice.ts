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
  user: any | null; // logged-in user object
  token: string | null; // JWT token
  tenant: any | null;
  langauge: any | null;
  menu: any[] | null;
  menuLoading: boolean; // tenant (organization) info
  sessionExpiredBackdrop: boolean; // flag for showing session expired modal/backdrop
  selectedDepartment: any | null;
}

// Initial state, pulling values from localStorage if available
const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('id_token') || null,
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
  langauge: JSON.parse(localStorage.getItem('langauge') || 'null'),
  menu: JSON.parse(localStorage.getItem('menu') || 'null'),
  menuLoading: false,
  sessionExpiredBackdrop: false,
  selectedDepartment: JSON.parse(localStorage.getItem('selectedDepartment') || 'null')
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

    // Save langauge object to state and localStorage
    setLanguage: (state, action: PayloadAction<any | null>) => {
      state.langauge = action.payload;
      if (action.payload) {
        localStorage.setItem('langauge', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('langauge');
      }
    },


    setMenu: (state, action: PayloadAction<any[] | null>) => {
      state.menu = action.payload;
      if (action.payload) {
        localStorage.setItem('menu', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('menu');
      }
    },

    setMenuLoading: (state, action: PayloadAction<boolean>) => {
      state.menuLoading = action.payload;
    },

    setSelectedDepartment: (state, action: PayloadAction<any | null>) => {
      state.selectedDepartment = action.payload;
      if (action.payload) {
        localStorage.setItem('selectedDepartment', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('selectedDepartment');
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
      state.selectedDepartment = null;
      localStorage.removeItem('id_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.removeItem('langauge');
      localStorage.removeItem('selectedDepartment');
    },

    // Check token validity and clear state if expired
    checkTokenValidity: (state) => {
      const token = state.token;
      if (token && isTokenExpired(token)) {
        state.user = null;
        state.token = null;
        state.tenant = null;
        state.selectedDepartment = null;
        localStorage.removeItem('id_token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        localStorage.removeItem('langauge');
        localStorage.removeItem('selectedDepartment');
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
  setLanguage,
  setSelectedDepartment,
  logout,
  setMenu,
  checkTokenValidity
} = authSlice.actions;

// Export reducer to be added to store
export default authSlice.reducer;
