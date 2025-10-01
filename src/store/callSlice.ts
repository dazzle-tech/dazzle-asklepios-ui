import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type CallState = {
  inCall: boolean;
  roomName?: string;
  displayName?: string;
  email?: string;
};

const initialState: CallState = { inCall: false };

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startCall: (state, action: PayloadAction<{ roomName: string; displayName: string; email?: string }>) => {
      state.inCall = true;
      state.roomName = action.payload.roomName;
      state.displayName = action.payload.displayName;
      state.email = action.payload.email;
    },
    endCall: state => {
      state.inCall = false;
      state.roomName = undefined;
      state.displayName = undefined;
      state.email = undefined;
    },
  },
});

export const { startCall, endCall } = callSlice.actions;
export default callSlice.reducer;
