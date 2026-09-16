"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/api";
import type { RootState } from "@/store";
import { logout, setAgent } from "@/store/slices/authSlice";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const isPublic = pathname === "/login" || pathname === "/register";
  const [isVerifying, setIsVerifying] = useState(!isPublic);

  useEffect(() => {
    if (isPublic) {
      setIsVerifying(false);
      return;
    }

    if (agent) {
      setIsVerifying(false);
      return;
    }

    let mounted = true;
    setIsVerifying(true);

    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (!mounted) return;
        if (res.data?.success && res.data.agent) {
          dispatch(setAgent(res.data.agent));
        } else {
          router.push("/login");
        }
      } catch {
        if (mounted) router.push("/login");
      } finally {
        if (mounted) setIsVerifying(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [agent, dispatch, isPublic, router]);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT, {}, { withCredentials: true });
    } catch {
      /* ignore */
    }
    dispatch(logout());
    router.push("/login");
  }, [dispatch, router]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (isVerifying || !agent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-white">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-sm font-semibold">Shopzo Delivery</p>
          <p className="text-xs text-zinc-500">{agent.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
