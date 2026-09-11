"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { DeliveryAgent } from "@/store/slices/authSlice";
import ThemeToggle from "@/app/components/ThemeToggle";
import { usePartnerLogout } from "@/app/components/AppChrome";

const SIDEBAR_KEY = "shopzo-delivery-sidebar-collapsed";

const NAV = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/jobs", label: "Jobs", icon: JobsIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon },
];

type Props = {
  children: React.ReactNode;
  agent: DeliveryAgent;
};

export default function PartnerShell({ children, agent }: Props) {
  const pathname = usePathname();
  const logout = usePartnerLogout();
  const onDuty = Boolean(agent.dutyMode);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const initials = agent.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const pageTitle =
    NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ||
    "Delivery";

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-shop-surface text-foreground">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-shop-border bg-neutral-950 text-neutral-300 transition-[transform,width] duration-200 ease-out lg:z-30 lg:translate-x-0 dark:bg-neutral-950",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-[4.75rem] lg:w-[4.75rem]" : "w-[17.5rem] lg:w-72",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
          <Link
            href="/home"
            className={`flex min-w-0 flex-1 items-center gap-3 ${collapsed ? "justify-center" : ""}`}
            onClick={() => setMobileNavOpen(false)}
          >
            {collapsed ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
                S
              </span>
            ) : (
              <Image
                src="/shopzo_logo.png"
                alt="Shopzo"
                width={110}
                height={36}
                className="h-7 w-auto object-contain"
                priority
              />
            )}
          </Link>
        </div>

        {!collapsed ? (
          <p className="px-5 pt-4 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Delivery partner
          </p>
        ) : null}

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-4">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={[
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-400 hover:bg-white/[0.07] hover:text-white",
                      collapsed ? "justify-center px-2.5" : "",
                    ].join(" ")}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && !collapsed ? (
                      <span
                        className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-emerald-500"
                        aria-hidden
                      />
                    ) : null}
                    <Icon active={active} />
                    <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/10 px-3 py-4">
          {!collapsed ? (
            <div className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
                  {initials || "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-100">{agent.name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {agent.shopzoDeliveryId || "Partner"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    onDuty
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-white/10 text-neutral-400"
                  }`}
                >
                  {onDuty ? "On duty" : "Off duty"}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs font-semibold text-neutral-400 transition hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logout()}
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/[0.07] hover:text-white"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogoutIcon />
            </button>
          )}
        </div>
      </aside>

      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${
          collapsed ? "lg:ml-[4.75rem]" : "lg:ml-72"
        }`}
      >
        <header className="z-20 mx-3 mt-3 flex min-h-16 shrink-0 items-center gap-2 rounded-2xl border border-shop-border bg-shop-surface-raised/90 px-3 py-2 shadow-sm backdrop-blur sm:mx-5 sm:mt-4 sm:gap-3 sm:px-4">
          <button
            type="button"
            className="rounded-full p-2 text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>

          <div className="min-w-0 flex-1 pl-0.5">
            <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {pageTitle}
            </p>
            <p className="truncate text-xs text-shop-muted sm:text-sm">
              Delivery partner workspace
            </p>
          </div>

          <span
            className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
              onDuty
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {onDuty ? "On duty" : "Off duty"}
          </span>
          <ThemeToggle />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.8}
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"
      />
    </svg>
  );
}

function JobsIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.8}
        d="M7 7h10M7 12h10M7 17h6M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Z"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.8}
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d={collapsed ? "M9 6l6 6-6 6M4 12h11" : "M15 6l-6 6 6 6M20 12H9"}
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 12H4m11 0-3-3m3 3-3 3m5-9h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2"
      />
    </svg>
  );
}
