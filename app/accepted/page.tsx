"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";
import { canTakeJobs } from "@/lib/kyc";
import { RootState } from "@/store";

type MineJob = {
  id: string;
  status: string;
  pickupKind: "warehouse" | "vendor" | null;
  pickupName: string | null;
  pickupArea: string | null;
  dropoffBuilding: string | null;
  dropoffArea: string | null;
  tripKm: number | null;
  payout: number;
};

function Stop({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-shop-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{title}</p>
      {subtitle ? <p className="text-xs text-shop-muted">{subtitle}</p> : null}
    </div>
  );
}

const statusLabel = (status: string) => {
  if (status === "initiated") return "En route to pickup";
  if (status === "at_pickup") return "At pickup";
  if (status === "in_transit") return "To customer";
  return "In queue";
};

export default function AcceptedPage() {
  const router = useRouter();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const approved = agent ? canTakeJobs(agent) : false;
  const [jobs, setJobs] = useState<MineJob[]>([]);
  const [heldCount, setHeldCount] = useState(0);
  const [maxActiveJobs, setMaxActiveJobs] = useState(agent?.maxActiveJobs || 7);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!approved) {
      setJobs([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.MY_JOBS, { withCredentials: true });
      if (res.data?.success) {
        setJobs(res.data.jobs || []);
        setHeldCount(res.data.heldCount ?? 0);
        setMaxActiveJobs(res.data.maxActiveJobs ?? 7);
      } else toast.error(res.data?.message || "Could not load accepted jobs");
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not load accepted jobs";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [approved]);

  useEffect(() => {
    load();
  }, [load]);

  const startJob = async (jobId: string) => {
    setStartingId(jobId);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.ACCEPT_JOB}/${jobId}/start`,
        {},
        { withCredentials: true }
      );
      if (res.data?.success) {
        toast.success("Job started");
        router.push(`/run/${jobId}`);
      } else toast.error(res.data?.message || "Could not start job");
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Could not start job"
      );
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Accepted</h1>
        <p className="mt-1 text-sm text-shop-muted">
          Your bag. {heldCount}/{maxActiveJobs} slots used. One run at a time.
        </p>
      </div>

      {!approved ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Complete KYC to hold accepted jobs.</p>
        </div>
      ) : loading ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Loading accepted jobs…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Nothing in your queue yet.</p>
          <Link href="/offers" className="mt-4 inline-flex text-sm font-semibold text-shop-accent hover:underline">
            See offers
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const live = job.status !== "in_queue";
            return (
              <article key={job.id} className={`${card} flex flex-col p-5`}>
                <div className="space-y-3">
                  <Stop
                    label={job.pickupKind === "vendor" ? "Pickup · vendor" : "Pickup · warehouse"}
                    title={job.pickupName || job.pickupArea || "Pickup"}
                    subtitle={job.pickupName ? job.pickupArea : null}
                  />
                  <Stop
                    label="Drop"
                    title={job.dropoffBuilding || job.dropoffArea || "Customer"}
                    subtitle={job.dropoffBuilding ? job.dropoffArea : null}
                  />
                </div>
                <p className="mt-3 text-sm text-shop-muted">
                  {job.tripKm != null ? `${job.tripKm} km trip` : "Trip km pending"} · ₹{job.payout}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-shop-muted">
                  {statusLabel(job.status)}
                </p>
                {live ? (
                  <Link
                    href={`/run/${job.id}`}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Open run
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={startingId === job.id}
                    onClick={() => startJob(job.id)}
                    className="mt-4 h-10 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {startingId === job.id ? "Starting…" : "Start job"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
