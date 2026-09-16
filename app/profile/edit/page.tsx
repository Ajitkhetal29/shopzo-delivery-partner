"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { getAddress } from "@/services/address";
import type { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";
import { Address } from "@/store/types/address";

const MapBase = dynamic(() => import("@/app/components/MapBase"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-zinc-50 text-sm text-zinc-500">Loading map...</div>
  ),
});

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900";

export default function EditDeliveryProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [workingRadius, setWorkingRadius] = useState("20");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (!mounted || !res.data?.success || !res.data.agent) return;
        const next = res.data.agent;
        dispatch(setAgent(next));
        setName(next.name || "");
        setEmail(next.email || "");
        setContact(next.contact || "");
        setWorkingRadius(String(next.workingRadius || 20));
        if (next.location?.lat !== undefined && next.location?.lng !== undefined) {
          setLocation({ lat: next.location.lat, lng: next.location.lng });
        }
        if (next.address) {
          setAddress({
            formatted: next.address.formatted || next.address.line1 || "",
            city: next.address.city || "",
            state: next.address.state || "",
            pincode: next.address.pincode || "",
            area: next.address.area || "",
            country: next.address.country || "",
            landmark: next.address.landmark || "",
          });
        }
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

  const handleGetAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const addressData = await getAddress({ lat, lng });
      if (addressData) {
        setAddress({
          ...addressData,
          landmark: address?.landmark || addressData.landmark || "",
        });
      } else {
        toast.error("Failed to fetch address. Try selecting the location again.");
      }
    } catch {
      toast.error("Failed to fetch address. Try selecting the location again.");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim() || !email.trim() || !contact.trim()) {
      toast.error("Please fill in name, email, and contact number");
      return;
    }
    if (!location) {
      toast.error("Please select a location on the map");
      return;
    }
    if (!address || !address.formatted || !address.state || !address.city || !address.pincode) {
      toast.error("Please ensure address is loaded from the map");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        {
          name: name.trim(),
          email: email.trim(),
          contact: contact.trim(),
          workingRadius: Number(workingRadius) || 20,
          location,
          address: {
            formatted: address.formatted,
            line1: address.formatted,
            state: address.state,
            city: address.city,
            pincode: address.pincode,
            area: address.area,
            landmark: address.landmark || undefined,
          },
        },
        { withCredentials: true },
      );
      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success("Profile updated");
        router.push("/profile");
      } else {
        toast.error(res.data?.message || "Failed to update profile");
      }
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !agent) {
    return <p className="py-16 text-center text-sm text-zinc-500">Loading profile...</p>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold">Edit profile</h1>
        <p className="mt-1 text-sm text-zinc-500">Update contact details and pin your base location.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-base font-semibold">Select location</h2>
          </div>
          <div className="relative h-[500px] w-full">
            <MapBase
              defaultPosition={location ? [location.lat, location.lng] : undefined}
              onLocationSelect={(lat, lng) => {
                setLocation({ lat, lng });
                void handleGetAddress(lat, lng);
              }}
            />
          </div>
          {location ? (
            <p className="border-t border-zinc-200 px-6 py-3 text-xs font-semibold text-emerald-800 dark:border-zinc-800">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Contact" value={contact} onChange={setContact} maxLength={10} />
          <Field label="Working radius (km)" value={workingRadius} onChange={setWorkingRadius} />
          <Field
            label="Landmark"
            required={false}
            value={address?.landmark || ""}
            onChange={(value) => setAddress((prev) => (prev ? { ...prev, landmark: value } : prev))}
          />
          <div>
            <label className="mb-2 block text-sm font-medium">Full address</label>
            <textarea
              value={address?.formatted || ""}
              onChange={(e) => setAddress((prev) => (prev ? { ...prev, formatted: e.target.value } : prev))}
              rows={3}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" value={address?.city || ""} onChange={(value) => setAddress((prev) => (prev ? { ...prev, city: value } : prev))} />
            <Field label="State" value={address?.state || ""} onChange={(value) => setAddress((prev) => (prev ? { ...prev, state: value } : prev))} />
          </div>
          <Field label="Pincode" value={address?.pincode || ""} onChange={(value) => setAddress((prev) => (prev ? { ...prev, pincode: value } : prev))} />

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/profile" className="inline-flex h-10 items-center rounded-xl border border-zinc-300 px-4 text-sm font-medium">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingAddress}
              className="inline-flex h-10 min-w-32 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white disabled:bg-zinc-400 dark:bg-white dark:text-zinc-900"
            >
              {isSubmitting ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} maxLength={maxLength} className={inputClass} />
    </div>
  );
}
