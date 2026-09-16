"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import type { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";

export default function DeliveryProfilePage() {
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const [isLoading, setIsLoading] = useState(!agent);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (!mounted || !res.data?.success || !res.data.agent) return;
        dispatch(setAgent(res.data.agent));
      } catch {
        toast.error("Could not load profile");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  if (isLoading && !agent) {
    return <p className="py-16 text-center text-sm text-zinc-500">Loading profile...</p>;
  }

  if (!agent) {
    return <p className="text-sm text-zinc-500">Profile could not be loaded.</p>;
  }

  const address = agent.address;
  const location = agent.location || address?.location;
  const fullAddress = address?.formatted || address?.line1 || "No address on file";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Partner profile</h1>
          <p className="mt-1 text-sm text-zinc-500">Contact, email, and base location for deliveries.</p>
        </div>
        <Link href="/profile/edit" className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
          Edit profile
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-lg font-semibold">{agent.name}</p>
          <p className="text-sm text-zinc-500">{agent.shopzoDeliveryId || "Delivery partner"}</p>
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label="Email" value={agent.email || "—"} />
            <Info label="Contact" value={agent.contact || "—"} />
            <Info label="Working radius" value={agent.workingRadius ? `${agent.workingRadius} km` : "—"} />
            <Info label="Duty" value={agent.dutyMode ? "On duty" : "Off duty"} />
          </dl>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold">Base location</h2>
          <p className="mt-3 text-sm leading-6">{fullAddress}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <Info label="City" value={address?.city || "—"} />
            <Info label="State" value={address?.state || "—"} />
            <Info label="Pincode" value={address?.pincode || "—"} />
            <Info label="Landmark" value={address?.landmark || "—"} />
          </dl>
          {location?.lat !== undefined && location?.lng !== undefined ? (
            <p className="mt-5 rounded-xl bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500 dark:bg-zinc-900">
              Lat {Number(location.lat).toFixed(6)}, Lng {Number(location.lng).toFixed(6)}
            </p>
          ) : (
            <p className="mt-5 text-xs text-zinc-500">Map coordinates are not set yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
