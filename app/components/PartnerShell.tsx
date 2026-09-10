"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DeliveryAgent } from "@/store/slices/authSlice";
import ThemeToggle from "@/app/components/ThemeToggle";

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
  const onDuty = Boolean(agent.dutyMode);

  return (
    <div className="flex min-h-dvh flex-col bg-shop-surface text-foreground">
      <header className="sticky top-0 z-30 border-b border-shop-border bg-shop-surface-raised/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/home" className="inline-flex items-center">
            <Image
              src="/shopzo_logo.png"
              alt="Shopzo"
              width={108}
              height={36}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                onDuty
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {onDuty ? "On duty" : "Off duty"}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-shop-border bg-shop-surface-raised/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${
                  active ? "text-shop-accent" : "text-shop-muted"
                }`}
              >
                <Icon active={active} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
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
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
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
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 2.2 : 1.8}
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0"
      />
    </svg>
  );
}
