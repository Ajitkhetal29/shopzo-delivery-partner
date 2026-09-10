"use client";

import { useSelector } from "react-redux";
import { usePartnerLogout } from "@/app/components/AppChrome";
import { card } from "@/lib/delivery-ui";
import { RootState } from "@/store";

export default function ProfilePage() {
  const agent = useSelector((s: RootState) => s.auth.agent);
  const logout = usePartnerLogout();

  if (!agent) return null;

  const initials = agent.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const status = agent.approvalStatus || "pending";
  const addressLine =
    agent.address?.formatted ||
    [agent.address?.area, agent.address?.city, agent.address?.state, agent.address?.pincode]
      .filter(Boolean)
      .join(", ") ||
    "No address on file";

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white">
            {initials || "P"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{agent.name}</h1>
            <p className="text-sm text-shop-muted">{agent.shopzoDeliveryId || "Delivery partner"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge
            tone={status === "approved" ? "green" : status === "rejected" ? "red" : "amber"}
            label={status}
          />
          <Badge tone={agent.dutyMode ? "green" : "slate"} label={agent.dutyMode ? "On duty" : "Off duty"} />
        </div>
      </div>

      <section className={`${card} p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-shop-muted">Account</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <Row label="Mobile" value={agent.contact || "—"} />
          <Row label="Email" value={agent.email || "—"} />
          <Row label="Working radius" value={`${agent.workingRadius || 20} km`} />
        </dl>
      </section>

      <section className={`${card} p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-shop-muted">Address</h2>
        <p className="mt-3 text-sm leading-6">{addressLine}</p>
        {agent.location ? (
          <p className="mt-2 text-xs text-shop-muted">
            {agent.location.lat.toFixed(5)}, {agent.location.lng.toFixed(5)}
          </p>
        ) : null}
      </section>

      <section className={`${card} p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-shop-muted">Vehicle</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <Row label="Type" value={agent.vehicleDetails?.vehicleType || "—"} />
          <Row label="Number" value={agent.vehicleDetails?.vehicleNumber || "—"} />
        </dl>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <DocThumb label="RC" src={agent.vehicleDetails?.vehicleRcPhoto} />
          <DocThumb label="License" src={agent.vehicleDetails?.licensePhoto} />
        </div>
      </section>

      <button
        type="button"
        onClick={() => logout()}
        className="h-12 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
      >
        Sign out
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-shop-muted">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "amber" | "red" | "slate" }) {
  const className = {
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
    red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
  }[tone];

  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${className}`}>{label}</span>;
}

function DocThumb({ label, src }: { label: string; src?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-shop-border">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center text-xs text-shop-muted">No {label}</div>
      )}
      <p className="border-t border-shop-border px-2 py-1.5 text-center text-[11px] font-semibold">{label}</p>
    </div>
  );
}
