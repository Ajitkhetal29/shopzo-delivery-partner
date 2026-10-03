"use client";

import { useSelector } from "react-redux";
import Link from "next/link";
import { card } from "@/lib/delivery-ui";
import { canTakeJobs } from "@/lib/kyc";
import { JobCard, useAvailableJobs } from "@/app/components/AvailableJobs";
import { RootState } from "@/store";

export default function OffersPage() {
  const agent = useSelector((s: RootState) => s.auth.agent);
  const approved = agent ? canTakeJobs(agent) : false;
  const onDuty = Boolean(agent?.dutyMode);
  const { jobs, loading, acceptingId, acceptJob } = useAvailableJobs(Boolean(approved && onDuty));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Offers</h1>
        <p className="mt-1 text-sm text-shop-muted">
          Packed jobs in your work radius. ₹ is from ops rates × road trip km.
        </p>
      </div>

      {!approved ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">
            Complete KYC and get ops approval before offers unlock.
          </p>
          <Link
            href={
              agent?.approvalStatus === "incomplete" ||
              agent?.approvalStatus === "rejected" ||
              !agent?.approvalStatus
                ? "/kyc"
                : "/profile"
            }
            className="mt-4 inline-flex text-sm font-semibold text-shop-accent hover:underline"
          >
            {agent?.approvalStatus === "pending" ? "View status" : "Complete KYC"}
          </Link>
        </div>
      ) : !onDuty ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Turn on duty from Home to see offers.</p>
          <Link href="/home" className="mt-4 inline-flex text-sm font-semibold text-shop-accent hover:underline">
            Go to Home
          </Link>
        </div>
      ) : loading ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">Loading offers…</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className={`${card} px-6 py-16 text-center`}>
          <p className="text-sm font-medium text-shop-muted">No packed jobs in your radius right now.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={acceptJob}
              accepting={acceptingId === job.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
