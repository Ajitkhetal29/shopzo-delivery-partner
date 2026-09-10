"use client";

import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { card } from "@/lib/delivery-ui";
import { SAMPLE_JOBS } from "@/lib/sampleJobs";
import { RootState } from "@/store";

export default function JobsPage() {
  const agent = useSelector((s: RootState) => s.auth.agent);
  const onDuty = Boolean(agent?.dutyMode);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="mt-1 text-sm text-shop-muted">Sample nearby deliveries. Live assignment comes next.</p>
      </div>

      {!onDuty ? (
        <div className={`${card} px-4 py-12 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Turn on duty from Home to see jobs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {SAMPLE_JOBS.map((job) => (
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
    </div>
  );
}
