import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  refetchPatientSide: false,
};

const refetchPatientSideSlice = createSlice({
  name: 'refetchPatientSide',
  initialState,
  reducers: {
    setRefetchPatientSide(state, action) {
      state.refetchPatientSide = action.payload;
    },
    resetRefetchPatientSide(state) {
      state.refetchPatientSide = false;
    },
  },
});

export const { setRefetchPatientSide, resetRefetchPatientSide } = refetchPatientSideSlice.actions;
export default refetchPatientSideSlice.reducer;
