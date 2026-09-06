import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DeliveryAgent = {
  _id: string;
  name: string;
  email?: string;
  contact?: string;
  shopzoDeliveryId?: string;
  location?: { lat: number; lng: number };
  workingRadius?: number;
  dutyMode?: boolean;
  isActive?: boolean;
  approvalStatus?: string;
};

type AuthState = {
  agent: DeliveryAgent | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  agent: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAgent(state, action: PayloadAction<DeliveryAgent>) {
      state.agent = action.payload;
      state.isAuthenticated = true;
    },
    logout(state) {
      state.agent = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setAgent, logout } = authSlice.actions;
export default authSlice.reducer;
