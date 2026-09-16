"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/api";
import type { AppDispatch, RootState } from "@/store";
import { logout, setAgent } from "@/store/slices/authSlice";
import PartnerShell from "@/app/components/PartnerShell";

const PUBLIC_PATHS = ["/login", "/register"];

const LogoutContext = createContext<() => void | Promise<void>>(() => undefined);

export function usePartnerLogout() {
  return useContext(LogoutContext);
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const isHydrated = useSelector((s: RootState) => s.auth.isHydrated);
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const [isVerifying, setIsVerifying] = useState(!isPublic);

  useEffect(() => {
    if (isPublic) {
      setIsVerifying(false);
      return;
    }
    if (!isHydrated) return;
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
          router.replace("/login");
        }
      } catch {
        if (mounted) router.replace("/login");
      } finally {
        if (mounted) setIsVerifying(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [agent, dispatch, isHydrated, isPublic, router]);

  const handleLogout = useCallback(async () => {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT, {}, { withCredentials: true });
    } catch {
      /* ignore */
    }
    dispatch(logout());
    router.push("/login");
  }, [dispatch, router]);

  if (isPublic) return <>{children}</>;

  if (!isHydrated || isVerifying || !agent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-shop-surface">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-shop-accent border-t-transparent" />
          <p className="text-sm font-medium text-shop-muted">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <LogoutContext.Provider value={handleLogout}>
      <PartnerShell agent={agent}>{children}</PartnerShell>
    </LogoutContext.Provider>
  );
}
