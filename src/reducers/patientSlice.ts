import { createSlice } from '@reduxjs/toolkit';
import { patientService } from '@/services/patientService';

const initialState = {
  patient: null,
  patients: null,
  encounter: null
};

const patientSlice = createSlice({
  name: 'patient',
  initialState: initialState,
  reducers: {
    setPatient: (state, action) => {
      state.patient = action.payload;
    },
    setEncounter: (state, action) => {
      state.encounter = action.payload;
    }
  },
  extraReducers: builder => {
    builder.addMatcher(patientService.endpoints.getPatients.matchFulfilled, (state, action) => {
      // update state if needed.
    });
  }
});

export const { setPatient, setEncounter } = patientSlice.actions;

export default patientSlice;
