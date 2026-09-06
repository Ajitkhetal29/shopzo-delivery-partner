"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      themes={["light", "dark"]}
      enableSystem={false}
      storageKey="shopzo-delivery-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
