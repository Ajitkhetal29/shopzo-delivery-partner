"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";
import { SAMPLE_JOBS, SAMPLE_STATS } from "@/lib/sampleJobs";
import { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";

export default function HomePage() {
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const [savingDuty, setSavingDuty] = useState(false);

  if (!agent) return null;

  const approved = agent.approvalStatus === "approved";
  const onDuty = Boolean(agent.dutyMode);

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
    <div className="space-y-5">
      <div className={`${card} bg-gradient-to-r from-white to-emerald-50/80 p-5 dark:from-zinc-900 dark:to-emerald-950/20`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
          Delivery partner
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Hey, {agent.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-shop-muted">
          {agent.shopzoDeliveryId || "Partner"} · {agent.workingRadius || 20} km radius
        </p>

        {!approved ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Waiting for Super Admin approval before you can go on duty.
          </p>
        ) : (
          <button
            type="button"
            onClick={toggleDuty}
            disabled={savingDuty}
            className={`mt-4 flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-semibold text-white ${
              onDuty ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-950"
            }`}
          >
            <span>{savingDuty ? "Updating..." : onDuty ? "You're on duty" : "Go on duty"}</span>
            <span
              className={`relative h-6 w-11 rounded-full ${onDuty ? "bg-white/30" : "bg-white/20 dark:bg-zinc-300"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  onDuty ? "left-5" : "left-0.5"
                }`}
              />
            </span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Delivered" value={String(SAMPLE_STATS.deliveredToday)} />
        <Stat label="Earned" value={`₹${SAMPLE_STATS.earningsToday}`} />
        <Stat label="Km today" value={String(SAMPLE_STATS.kmToday)} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Nearby jobs</h2>
          <Link href="/jobs" className="text-sm font-semibold text-shop-accent">
            See all
          </Link>
        </div>

        {!onDuty ? (
          <div className={`${card} px-4 py-10 text-center`}>
            <p className="text-sm font-medium text-shop-muted">Go on duty to see nearby delivery jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {SAMPLE_JOBS.slice(0, 2).map((job) => (
              <article key={job.id} className={`${card} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">{job.id}</p>
                    <p className="mt-1 text-sm font-semibold">{job.pickup}</p>
                    <p className="text-sm text-shop-muted">→ {job.drop}</p>
                  </div>
                  <p className="text-base font-semibold text-emerald-700 dark:text-emerald-300">₹{job.payout}</p>
                </div>
                <p className="mt-3 text-xs text-shop-muted">
                  {job.distanceKm} km · {job.etaMin} min · {job.items} item{job.items > 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={() => toast.info("Job assignment isn't wired yet")}
                  className="mt-3 h-10 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white"
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
    <div className={`${card} px-3 py-4 text-center`}>
      <p className="text-[2rem] font-semibold leading-none tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-shop-muted">{label}</p>
    </div>
  );
}
