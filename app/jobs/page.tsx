"use client";

import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import Link from "next/link";
import { card } from "@/lib/delivery-ui";
import { canTakeJobs } from "@/lib/kyc";
import { SAMPLE_JOBS } from "@/lib/sampleJobs";
import { RootState } from "@/store";

export default function JobsPage() {
  const agent = useSelector((s: RootState) => s.auth.agent);
  const approved = agent ? canTakeJobs(agent) : false;
  const onDuty = Boolean(agent?.dutyMode);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Jobs</h1>
        <p className="mt-1 text-sm text-shop-muted">
          Sample nearby deliveries. Live assignment comes next.
        </p>
      </div>

      {!approved ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">
            Complete KYC and get ops approval before jobs unlock.
          </p>
          <Link
            href="/profile"
            className="mt-4 inline-flex text-sm font-semibold text-shop-accent hover:underline"
          >
            Go to Profile
          </Link>
        </div>
      ) : !onDuty ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Turn on duty from Home to see jobs.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SAMPLE_JOBS.map((job) => (
            <article key={job.id} className={`${card} flex flex-col p-5`}>
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
                className="mt-4 h-10 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Accept job
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
