import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Address } from "@/store/types/address";

export type VehicleDetails = {
  vehicleType?: "bike" | "car" | "truck" | "other";
  vehicleNumber?: string;
  vehicleRcPhoto?: string;
  licensePhoto?: string;
};

export type DeliveryAgent = {
  _id: string;
  name: string;
  email?: string;
  contact?: string;
  shopzoDeliveryId?: string;
  location?: { lat: number; lng: number };
  address?: Address;
  vehicleDetails?: VehicleDetails;
  workingRadius?: number;
  dutyMode?: boolean;
  isActive?: boolean;
  approvalStatus?: string;
};

type AuthState = {
  agent: DeliveryAgent | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
};

const initialState: AuthState = {
  agent: null,
  isAuthenticated: false,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAgent(state, action: PayloadAction<DeliveryAgent>) {
      state.agent = action.payload;
      state.isAuthenticated = true;
    },
    patchAgent(state, action: PayloadAction<Partial<DeliveryAgent>>) {
      if (!state.agent) return;
      state.agent = { ...state.agent, ...action.payload };
    },
    logout(state) {
      state.agent = null;
      state.isAuthenticated = false;
    },
    setHydrated(state) {
      state.isHydrated = true;
    },
  },
});

export const { setAgent, patchAgent, logout, setHydrated } = authSlice.actions;
export default authSlice.reducer;
