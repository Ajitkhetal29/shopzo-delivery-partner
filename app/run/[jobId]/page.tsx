"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";

type RunJob = {
  id: string;
  status: string;
  hubStatus: string | null;
  pickupKind: "warehouse" | "vendor" | null;
  pickupName: string | null;
  pickupArea: string | null;
  dropoffBuilding: string | null;
  dropoffArea: string | null;
  tripKm: number | null;
  payout: number;
};

const STEPS = [
  { key: "initiated", label: "Reach pickup" },
  { key: "at_pickup", label: "Wait for ship" },
  { key: "in_transit", label: "Go to customer" },
] as const;

export default function RunJobPage() {
  const params = useParams<{ jobId: string }>();
  const [job, setJob] = useState<RunJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!params.jobId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_ENDPOINTS.ACCEPT_JOB}/${params.jobId}`, {
        withCredentials: true,
      });
      if (res.data?.success) setJob(res.data.job);
      else toast.error(res.data?.message || "Could not load job");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not load job"
      );
    } finally {
      setLoading(false);
    }
  }, [params.jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const post = async (action: "arrive" | "transit") => {
    if (!job) return;
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${job.id}/${action}`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success(res.data.message || "Updated");
        setJob(res.data.job);
      } else toast.error(res.data?.message || "Could not update job");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not update job"
      );
    } finally {
      setBusy(false);
    }
  };

  const stepIndex =
    job?.status === "in_transit" ? 2 : job?.status === "at_pickup" ? 1 : job?.status === "initiated" ? 0 : -1;

  return (
    <div className="space-y-6">
      <Link href="/accepted" className="text-sm font-semibold text-shop-accent hover:underline">
        ← Accepted
      </Link>

      {loading ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Loading run…</p>
        </div>
      ) : !job ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Job not found.</p>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {job.pickupName || job.pickupArea || "Pickup"}
            </h1>
            <p className="mt-1 text-sm text-shop-muted">
              Then {job.dropoffBuilding || job.dropoffArea || "customer"} · ₹{job.payout}
              {job.tripKm != null ? ` · ${job.tripKm} km` : ""}
            </p>
          </div>

          <ol className="space-y-2">
            {STEPS.map((step, idx) => (
              <li
                key={step.key}
                className={`${card} flex items-center gap-3 px-4 py-3 text-sm ${
                  idx === stepIndex ? "border-emerald-400" : ""
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    idx < stepIndex
                      ? "bg-emerald-600 text-white"
                      : idx === stepIndex
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-slate-200 text-slate-500 dark:bg-zinc-800"
                  }`}
                >
                  {idx + 1}
                </span>
                {step.label}
              </li>
            ))}
          </ol>

          {job.status === "initiated" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => post("arrive")}
              className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "Updating…" : "I’ve reached pickup"}
            </button>
          ) : null}

          {job.status === "at_pickup" ? (
            job.hubStatus === "shipped" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => post("transit")}
                className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Updating…" : "Head to customer"}
              </button>
            ) : (
              <div className={`${card} px-4 py-4 text-sm text-shop-muted`}>
                Waiting for the hub to mark shipped. Pull to refresh after they ship.
                <button
                  type="button"
                  onClick={load}
                  className="mt-3 block text-sm font-semibold text-shop-accent hover:underline"
                >
                  Refresh
                </button>
              </div>
            )
          ) : null}

          {job.status === "in_transit" ? (
            <div className={`${card} px-4 py-4 text-sm text-shop-muted`}>
              On the way to the customer. Complete / fail is next. No map yet.
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
