"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";
import { canTakeJobs, getKycBanner } from "@/lib/kyc";
import { SAMPLE_JOBS, SAMPLE_STATS } from "@/lib/sampleJobs";
import { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";

export default function HomePage() {
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const [savingDuty, setSavingDuty] = useState(false);

  if (!agent) return null;

  const approved = canTakeJobs(agent);
  const onDuty = Boolean(agent.dutyMode);
  const banner = getKycBanner(agent);

  const toggleDuty = async () => {
    if (!approved || savingDuty) return;
    const next = !onDuty;
    setSavingDuty(true);
    try {
      const res = await axios.patch(API_ENDPOINTS.SET_DUTY, { dutyMode: next }, { withCredentials: true });
      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success(res.data.message || (next ? "On duty" : "Off duty"));
      } else {
        toast.error(res.data?.message || "Could not update duty mode");
      }
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not update duty mode";
      toast.error(message);
    } finally {
      setSavingDuty(false);
    }
  };

  return (
    <div className="space-y-6">
      {banner ? (
        <div
          className={`rounded-2xl border px-5 py-4 ${
            banner.tone === "amber"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
              : banner.tone === "red"
                ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
                : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{banner.title}</p>
              <p className="mt-1 text-sm opacity-90">{banner.body}</p>
            </div>
            {banner.href && banner.cta ? (
              <Link
                href={banner.href}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-white/80 px-4 text-sm font-semibold text-slate-900 dark:bg-black/20 dark:text-white"
              >
                {banner.cta}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div
          className={`${card} flex-1 bg-gradient-to-br from-white to-emerald-50/80 p-6 dark:from-zinc-900 dark:to-emerald-950/20 lg:p-7`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            Delivery partner
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Hey, {agent.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-shop-muted">
            {agent.shopzoDeliveryId || "Partner"} · {agent.workingRadius || 20} km radius
          </p>

          {approved ? (
            <button
              type="button"
              onClick={toggleDuty}
              disabled={savingDuty}
              className={`mt-5 inline-flex h-11 items-center gap-3 rounded-xl px-5 text-sm font-semibold text-white transition ${
                onDuty
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-950"
              }`}
            >
              <span>{savingDuty ? "Updating..." : onDuty ? "You're on duty" : "Go on duty"}</span>
              <span
                className={`relative h-6 w-11 rounded-full ${
                  onDuty ? "bg-white/30" : "bg-white/20 dark:bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                    onDuty ? "left-5" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          ) : (
            <p className="mt-5 text-sm text-shop-muted">
              Duty mode unlocks after KYC approval.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 lg:w-[22rem] lg:grid-cols-1">
          <Stat label="Delivered today" value={String(SAMPLE_STATS.deliveredToday)} />
          <Stat label="Earned today" value={`₹${SAMPLE_STATS.earningsToday}`} />
          <Stat label="Km today" value={String(SAMPLE_STATS.kmToday)} />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Nearby jobs</h2>
            <p className="text-sm text-shop-muted">Sample queue until live assignment is wired.</p>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-shop-accent hover:underline">
            See all
          </Link>
        </div>

        {!approved || !onDuty ? (
          <div className={`${card} px-6 py-14 text-center`}>
            <p className="text-sm font-medium text-shop-muted">
              {!approved
                ? "Complete KYC and get approved to see jobs."
                : "Go on duty to see nearby delivery jobs."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {SAMPLE_JOBS.slice(0, 2).map((job) => (
              <article key={job.id} className={`${card} p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">
                      {job.id}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{job.pickup}</p>
                    <p className="text-sm text-shop-muted">→ {job.drop}</p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                    ₹{job.payout}
                  </p>
                </div>
                <p className="mt-3 text-xs text-shop-muted">
                  {job.distanceKm} km · {job.etaMin} min · {job.items} item{job.items > 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => toast.info("Job assignment isn't wired yet")}
                  className="mt-4 h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Accept job
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${card} flex flex-col justify-center px-4 py-4 lg:px-5`}>
      <p className="text-2xl font-semibold tracking-tight lg:text-[1.75rem]">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-shop-muted">
        {label}
      </p>
    </div>
  );
}
