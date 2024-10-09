import { uiService } from '@/services/uiService';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  sev: 'info',
  msg: null,
  msgLife: 2000,
  lang: 'en',
  translations: {},
  screenKey: '',
  loading: false
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setScreenKey: (state, action) => {
      state.screenKey = action.payload
    },
    notify: (state, action) => {
      state.sev = action.payload.sev ? action.payload.sev : 'info';
      state.msg = action.payload.msg ? action.payload.msg : action.payload;
      state.msgLife = action.payload.life ? action.payload.life : 2000;
    },
    clearNotification: state => {
      state.sev = 'info';
      state.msg = null;
      state.msgLife = 2000;
    },
    showLoading: state => {
      state.loading = true
    },
    hideLoading: state => {
      state.loading = false
    }
  },
  extraReducers: builder => {
    /* changeLang */
    builder.addMatcher(
      uiService.endpoints.changeLang.matchFulfilled,
      (state, action) => {
        state.lang = action.payload.lang;
        state.translations = action.payload.translations;
      }
    );
  }
});

export default uiSlice;
