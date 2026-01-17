import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type EncounterState = {
  current: any | null;
};

const initialState: EncounterState = {
  current: null,
};

const encounterSlice = createSlice({
  name: 'encounter',
  initialState,
  reducers: {
    setCurrentEncounter(state, action: PayloadAction<any>) {
      state.current = action.payload;
    },
    patchCurrentEncounter(state, action: PayloadAction<Partial<any>>) {
      if (!state.current) return;
      state.current = { ...state.current, ...action.payload };
    },
    clearCurrentEncounter(state) {
      state.current = null;
    },
  },
});

export const { setCurrentEncounter, patchCurrentEncounter, clearCurrentEncounter } =
  encounterSlice.actions;

export default encounterSlice.reducer;
