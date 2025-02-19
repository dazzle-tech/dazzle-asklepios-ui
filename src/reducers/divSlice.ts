import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  divElement: localStorage.getItem('divElement') || '',
  pageCode: localStorage.getItem('pageCode') || '',
};
const divSlice = createSlice({
  name: 'div',
  initialState,
  reducers: {
    setDivContent: (state, action: PayloadAction<string>) => {
      const newDivElement = action.payload;
      state.divElement = newDivElement;
      localStorage.setItem('divElement', newDivElement);
    },
    setPageCode: (state, action: PayloadAction<string>) => {
      const newPageCode = action.payload;
      state.pageCode = newPageCode;
      localStorage.setItem('pageCode', newPageCode);
    },
  },
});

export const { setDivContent, setPageCode } = divSlice.actions;
export default divSlice;
