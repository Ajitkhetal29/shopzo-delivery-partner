"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

type ThemeToggleProps = {
  className?: string;
  iconClassName?: string;
};

export default function ThemeToggle({
  className = "flex h-9 w-9 items-center justify-center rounded-full text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800",
  iconClassName = "h-4 w-4",
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return <span className={className} aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <SunIcon className={iconClassName} /> : <MoonIcon className={iconClassName} />}
    </button>
  );
}

export function AuthThemeToggle() {
  return (
    <ThemeToggle
      className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-shop-border bg-shop-surface-raised text-foreground shadow-md transition hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:right-6 sm:top-6"
      iconClassName="h-4 w-4"
    />
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707m12.728 0-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
      />
    </svg>
  );
}
