"use client";

import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@/app/components/theme-provider";
import { store } from "@/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        {children}
        <ToastContainer position="top-right" autoClose={2500} />
      </Provider>
    </ThemeProvider>
  );
}
