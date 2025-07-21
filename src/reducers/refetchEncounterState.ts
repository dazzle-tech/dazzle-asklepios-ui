
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  refetchEncounter: false,
};

const refetchSlice = createSlice({
  name: 'refetch',
  initialState,
  reducers: {
    setRefetchEncounter(state, action) {
      state.refetchEncounter = action.payload;
    },
    resetRefetchEncounter(state) {
      state.refetchEncounter = false;
    },
  },
});

export const { setRefetchEncounter, resetRefetchEncounter } = refetchSlice.actions;
export default refetchSlice.reducer;
