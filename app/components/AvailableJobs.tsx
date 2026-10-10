"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
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

type LeaveKind = "taken" | "accepted";

const FLASH_MS = 900;
const OUT_MS = 320;

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

export function useAvailableJobs(enabled: boolean, myAgentId?: string) {
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, LeaveKind>>({});
  const [exiting, setExiting] = useState<Record<string, boolean>>({});
  const leavingRef = useRef<Set<string>>(new Set());

  const dropJob = useCallback((jobId: string, kind: LeaveKind) => {
    if (leavingRef.current.has(jobId)) {
      if (kind === "accepted") {
        setNotice((prev) => ({ ...prev, [jobId]: "accepted" }));
      }
      return;
    }
    leavingRef.current.add(jobId);
    setNotice((prev) => ({ ...prev, [jobId]: kind }));

    window.setTimeout(() => {
      setExiting((prev) => ({ ...prev, [jobId]: true }));
    }, FLASH_MS);

    window.setTimeout(() => {
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      setNotice((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      setExiting((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      leavingRef.current.delete(jobId);
    }, FLASH_MS + OUT_MS);
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

    socket.on("job-taken", (payload: { jobId?: string; acceptedBy?: string | null }) => {
      if (!payload?.jobId) return;
      const mine = Boolean(myAgentId && payload.acceptedBy && payload.acceptedBy === myAgentId);
      dropJob(payload.jobId, mine ? "accepted" : "taken");
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, dropJob, myAgentId]);

  const acceptJob = async (jobId: string) => {
    if (acceptingId || leavingRef.current.has(jobId)) return;
    setAcceptingId(jobId);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${jobId}/accept`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        dropJob(jobId, "accepted");
      } else {
        toast.error(res.data?.message || "Could not accept job");
      }
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : null;
      if (status === 409) {
        dropJob(jobId, "taken");
      } else {
        const message =
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : "Could not accept job";
        toast.error(message);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  return { jobs, loading, acceptingId, acceptJob, notice, exiting };
}

export function JobCard({
  job,
  onAccept,
  accepting,
  notice,
  exiting,
}: {
  job: AvailableJob;
  onAccept: (jobId: string) => void;
  accepting: boolean;
  notice?: LeaveKind;
  exiting?: boolean;
}) {
  const route = job.badge || [job.pickupArea, job.dropoffArea].filter(Boolean).join(" → ") || "Delivery";
  const taken = notice === "taken";
  const accepted = notice === "accepted";

  return (
    <article
      className={`${card} flex flex-col p-5 transition-all duration-300 ease-out ${
        exiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      {taken || accepted ? (
        <div
          className={`flex min-h-[7.5rem] flex-col items-center justify-center text-center ${
            accepted
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-800 dark:text-amber-200"
          }`}
        >
          <p className="text-base font-semibold">
            {accepted ? "Job accepted" : "Job already taken"}
          </p>
          <p className="mt-1 text-xs text-shop-muted">
            {accepted ? "It’s in your queue." : "Another rider got this one."}
          </p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </article>
  );
}
