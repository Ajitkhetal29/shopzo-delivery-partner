"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";

export type AvailableJob = {
  id: string;
  pickupArea: string | null;
  dropoffArea: string | null;
  badge: string | null;
  pickupKm: number;
  tripKm: number;
  payout: number;
};

const getCurrentPoint = (): Promise<{ lat: number; lng: number } | null> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

export function useAvailableJobs(enabled: boolean) {
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) {
      setJobs([]);
      return;
    }
    setLoading(true);
    try {
      const here = await getCurrentPoint();
      const res = await axios.get(API_ENDPOINTS.AVAILABLE_JOBS, {
        withCredentials: true,
        params: here || undefined,
      });
      if (res.data?.success) setJobs(res.data.jobs || []);
      else toast.error(res.data?.message || "Could not load jobs");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not load jobs";
      toast.error(message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { jobs, loading, reload: load };
}

export function JobCard({ job }: { job: AvailableJob }) {
  const route = job.badge || [job.pickupArea, job.dropoffArea].filter(Boolean).join(" → ") || "Delivery";

  return (
    <article className={`${card} flex flex-col p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            {route}
          </p>
          <p className="mt-2 text-sm text-shop-muted">
            {job.pickupKm} km to pickup · {job.tripKm} km trip
          </p>
        </div>
        <p className="shrink-0 text-lg font-semibold text-emerald-700 dark:text-emerald-300">
          ₹{job.payout}
        </p>
      </div>
      <button
        type="button"
        onClick={() => toast.info("Accept isn't wired yet")}
        className="mt-4 h-10 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Accept job
      </button>
    </article>
  );
}
