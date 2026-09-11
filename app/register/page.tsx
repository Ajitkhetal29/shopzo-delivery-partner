"use client";

import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { AuthThemeToggle } from "@/app/components/ThemeToggle";
import AddressLocationPicker from "@/app/components/AddressLocationPicker";
import GoogleMapsLoader from "@/app/components/GoogleMapsLoader";
import { getAddress, getDeviceLocation } from "@/services/address";
import type { Address } from "@/store/types/address";
import { setAgent } from "@/store/slices/authSlice";

const emptyAddress: Address = {
  formatted: "",
  line1: "",
  city: "",
  state: "",
  pincode: "",
  area: "",
  country: "",
  landmark: "",
};

type PickerTarget = "home" | "work" | null;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [formdata, setFormdata] = useState({
    name: "",
    contact: "",
    email: "",
    password: "",
  });
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [homeAddress, setHomeAddress] = useState<Address>(emptyAddress);
  const [workSameAsHome, setWorkSameAsHome] = useState(true);
  const [workLocation, setWorkLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [workAddress, setWorkAddress] = useState<Address>(emptyAddress);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500";

  const applyHome = (lat: number, lng: number, next: Address) => {
    setHomeLocation({ lat, lng });
    setHomeAddress({ ...emptyAddress, ...next });
    if (workSameAsHome) {
      setWorkLocation({ lat, lng });
      setWorkAddress({ ...emptyAddress, ...next });
    }
  };

  const applyWork = (lat: number, lng: number, next: Address) => {
    setWorkLocation({ lat, lng });
    setWorkAddress({ ...emptyAddress, ...next });
  };

  const handleUseCurrent = async (target: "home" | "work") => {
    setIsLoadingAddress(true);
    try {
      await waitForGoogleGeocoder();
      const coords = await getDeviceLocation();
      const addressData = await getAddress(coords);
      const next = addressData || emptyAddress;
      if (target === "home") applyHome(coords.lat, coords.lng, next);
      else applyWork(coords.lat, coords.lng, next);
      if (!addressData) toast.error("Got GPS — fill address fields or use map.");
      else toast.success("Location applied");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch location");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!formdata.name || !formdata.contact || !formdata.email || !formdata.password) {
      toast.error("Fill name, mobile, email and password");
      return;
    }
    if (!homeLocation || !isAddressReady(homeAddress)) {
      toast.error("Set a complete home address");
      return;
    }
    if (!workSameAsHome && (!workLocation || !isAddressReady(workAddress))) {
      toast.error("Set a complete work address, or mark same as home");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        API_ENDPOINTS.SIGNUP,
        {
          name: formdata.name.trim(),
          contact: formdata.contact.trim(),
          email: formdata.email.trim(),
          password: formdata.password,
          homeLocation,
          homeAddress: payloadAddress(homeAddress),
          workSameAsHome,
          ...(workSameAsHome
            ? {}
            : {
                location: workLocation,
                address: payloadAddress(workAddress),
              }),
          workingRadius: 20,
        },
        { withCredentials: true }
      );

      if (res.data.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success("Account created — complete KYC on Profile to take jobs.");
        router.push("/home");
      } else {
        toast.error(res.data.message || "Registration failed");
      }
    } catch (error: unknown) {
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#f5f7fb] text-slate-950 dark:bg-zinc-950 dark:text-white">
      <GoogleMapsLoader />
      <AuthThemeToggle />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-12 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/login" className="inline-flex rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
            <Image src="/shopzo_logo.png" alt="Shopzo" width={112} height={42} priority className="h-auto w-auto" />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Sign in
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            Quick start
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create partner account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Minimum details only. Aadhaar + vehicle docs come after login on Profile.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" value={formdata.name} onChange={(v) => setFormdata((s) => ({ ...s, name: v }))} className={inputClass} />
            <Field label="Mobile" name="contact" value={formdata.contact} onChange={(v) => setFormdata((s) => ({ ...s, contact: v }))} className={inputClass} />
            <Field label="Email" name="email" type="email" value={formdata.email} onChange={(v) => setFormdata((s) => ({ ...s, email: v }))} className={inputClass} />
            <Field label="Password" name="password" type="password" value={formdata.password} onChange={(v) => setFormdata((s) => ({ ...s, password: v }))} className={inputClass} />
          </div>

          <section className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Home address</h2>
              <div className="flex gap-2">
                <button type="button" disabled={isLoadingAddress} onClick={() => handleUseCurrent("home")} className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Use GPS
                </button>
                <button type="button" onClick={() => setPickerTarget("home")} className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Map
                </button>
              </div>
            </div>
            <AddressSummary address={homeAddress} location={homeLocation} />
          </section>

          <section className="mt-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Work area</h2>
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={workSameAsHome}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setWorkSameAsHome(checked);
                    if (checked && homeLocation) {
                      setWorkLocation(homeLocation);
                      setWorkAddress(homeAddress);
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                Same as home
              </label>
            </div>

            {workSameAsHome ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                Work hub will use your home pin. You can change this later on Profile.
              </p>
            ) : (
              <>
                <div className="flex justify-end gap-2">
                  <button type="button" disabled={isLoadingAddress} onClick={() => handleUseCurrent("work")} className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Use GPS
                  </button>
                  <button type="button" onClick={() => setPickerTarget("work")} className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Map
                  </button>
                </div>
                <AddressSummary address={workAddress} location={workLocation} />
              </>
            )}
          </section>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-zinc-800">
            <Link href="/login" className="inline-flex h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium dark:border-zinc-700">
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex h-11 min-w-40 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create account"}
            </button>
          </div>
        </div>
      </div>

      {pickerTarget ? (
        <AddressLocationPicker
          defaultPosition={pickerTarget === "home" ? homeLocation : workLocation}
          onClose={() => setPickerTarget(null)}
          onConfirm={({ lat, lng, address }) => {
            if (pickerTarget === "home") applyHome(lat, lng, address);
            else applyWork(lat, lng, address);
            setPickerTarget(null);
          }}
        />
      ) : null}
    </main>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-600 dark:text-zinc-400">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    </label>
  );
}

function AddressSummary({
  address,
  location,
}: {
  address: Address;
  location: { lat: number; lng: number } | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
      {location ? (
        <>
          <p className="leading-6 text-slate-800 dark:text-zinc-200">
            {address.formatted || [address.area, address.city, address.state, address.pincode].filter(Boolean).join(", ") || "Pinned"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        </>
      ) : (
        <p className="text-slate-500">No location yet — use GPS or map.</p>
      )}
    </div>
  );
}

function isAddressReady(address: Address) {
  return Boolean(address.formatted && address.city && address.state && address.pincode);
}

function payloadAddress(address: Address) {
  return {
    formatted: address.formatted,
    line1: address.line1 || address.formatted,
    state: address.state,
    city: address.city,
    pincode: address.pincode,
    area: address.area,
    landmark: address.landmark || undefined,
  };
}

async function waitForGoogleGeocoder(timeoutMs = 10000) {
  const started = Date.now();
  while (!window.google?.maps?.Geocoder) {
    if (Date.now() - started > timeoutMs) {
      throw new Error("Google Maps failed to load. Open the map picker instead.");
    }
    await new Promise((r) => setTimeout(r, 100));
  }
}
