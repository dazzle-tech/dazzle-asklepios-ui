import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ==================
// دالة لفحص صلاحية التوكن (JWT)
// ==================
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = str.padEnd(str.length + (4 - (str.length % 4)) % 4, '=');
  return atob(padded);
}

function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;

    const decodedPayload = JSON.parse(base64UrlDecode(payloadBase64));
    const exp = decodedPayload.exp;

    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000); // الوقت الحالي بالثواني
    return exp < now;
  } catch (error) {
    console.error('Invalid token:', error);
    return true; // لو التوكن فاسد نعتبره منتهي
  }
}

// ==================
// تعريف الـ Slice
// ==================
interface AuthState {
  user: any | null;
  token: string | null;
  tenant: any | null;
  sessionExpiredBackdrop: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('id_token') || null,
  tenant: JSON.parse(localStorage.getItem('tenant') || 'null'),
  sessionExpiredBackdrop: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSessionExpiredBackdrop: (state, action: PayloadAction<boolean>) => {
      state.sessionExpiredBackdrop = action.payload;
    },
    setUser: (state, action: PayloadAction<any | null>) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem('user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('user');
      }
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem('id_token', action.payload);
      } else {
        localStorage.removeItem('id_token');
      }
    },
    setTenant: (state, action: PayloadAction<any | null>) => {
      state.tenant = action.payload;
      if (action.payload) {
        localStorage.setItem('tenant', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('tenant');
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.tenant = null;
      localStorage.removeItem('id_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
    },
    // 👇 يفحص صلاحية التوكن ويفرغ كل شيء إذا انتهى
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

export const {
  setSessionExpiredBackdrop,
  setUser,
  setToken,
  setTenant,
  logout,
  checkTokenValidity
} = authSlice.actions;

export default authSlice.reducer;
