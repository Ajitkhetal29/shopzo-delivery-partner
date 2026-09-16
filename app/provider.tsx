"use client";

import { useEffect } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@/app/components/theme-provider";
import { RootState, store } from "@/store";
import { setAgent, setHydrated } from "@/store/slices/authSlice";

const AGENT_STORAGE_KEY = "shopzo-delivery-agent";

function AuthPersist({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const agent = useSelector((state: RootState) => state.auth.agent);
  const isHydrated = useSelector((state: RootState) => state.auth.isHydrated);

  useEffect(() => {
    const raw = window.localStorage.getItem(AGENT_STORAGE_KEY);
    if (raw) {
      try {
        dispatch(setAgent(JSON.parse(raw)));
      } catch {
        window.localStorage.removeItem(AGENT_STORAGE_KEY);
      }
    }
    dispatch(setHydrated());
  }, [dispatch]);

  useEffect(() => {
    if (!isHydrated) return;
    if (agent) {
      window.localStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(agent));
    } else {
      window.localStorage.removeItem(AGENT_STORAGE_KEY);
    }
  }, [agent, isHydrated]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <AuthPersist>
          {children}
          <ToastContainer position="top-right" autoClose={2500} />
        </AuthPersist>
      </Provider>
    </ThemeProvider>
  );
}
