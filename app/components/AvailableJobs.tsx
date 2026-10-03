"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { API_ENDPOINTS, SOCKET_URL } from "@/lib/api";
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
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const dropJob = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  }, []);

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
      else toast.error(res.data?.message || "Could not load offers");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not load offers";
      toast.error(message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on("job-taken", (payload: { jobId?: string }) => {
      if (payload?.jobId) dropJob(payload.jobId);
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, dropJob]);

  const acceptJob = async (jobId: string) => {
    if (acceptingId) return;
    setAcceptingId(jobId);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${jobId}/accept`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        dropJob(jobId);
        toast.success("Job accepted");
      } else {
        toast.error(res.data?.message || "Could not accept job");
      }
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not accept job";
      if (status === 409) dropJob(jobId);
      toast.error(message);
    } finally {
      setAcceptingId(null);
    }
  };

  return { jobs, loading, acceptingId, acceptJob };
}

export function JobCard({
  job,
  onAccept,
  accepting,
}: {
  job: AvailableJob;
  onAccept: (jobId: string) => void;
  accepting: boolean;
}) {
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
        disabled={accepting}
        onClick={() => onAccept(job.id)}
        className="mt-4 h-10 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {accepting ? "Accepting…" : "Accept job"}
      </button>
    </article>
  );
}
