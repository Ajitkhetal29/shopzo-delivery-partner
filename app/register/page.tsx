"use client";

import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { uploadDeliveryDoc } from "@/lib/s3Upload";
import { AuthThemeToggle } from "@/app/components/ThemeToggle";
import AddressLocationPicker from "@/app/components/AddressLocationPicker";
import GoogleMapsLoader from "@/app/components/GoogleMapsLoader";
import { getAddress, getDeviceLocation } from "@/services/address";
import type { Address } from "@/store/types/address";

const VEHICLE_TYPES = [
  { value: "bike", label: "Bike" },
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
] as const;

type VehicleType = (typeof VEHICLE_TYPES)[number]["value"];

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

export default function RegisterPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [formdata, setFormdata] = useState({
    name: "",
    contact: "",
    email: "",
    password: "",
    vehicleType: "bike" as VehicleType,
    vehicleNumber: "",
    workingRadius: "20",
  });
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [rcPreview, setRcPreview] = useState("");
  const [licensePreview, setLicensePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500";
  const disabledInputClass =
    "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500";

  const applyPickedLocation = (lat: number, lng: number, nextAddress: Address) => {
    setLocation({ lat, lng });
    setAddress({
      ...emptyAddress,
      ...nextAddress,
      landmark: address.landmark,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingAddress(true);
    try {
      await waitForGoogleGeocoder();
      const coords = await getDeviceLocation();
      const addressData = await getAddress(coords);
      if (!addressData) {
        applyPickedLocation(coords.lat, coords.lng, emptyAddress);
        toast.error("Got GPS, but reverse geocode failed. Fill address fields or pick on the map.");
        return;
      }
      applyPickedLocation(coords.lat, coords.lng, addressData);
      toast.success("Current location applied");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch current location");
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleFile = (kind: "rc" | "license", file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (kind === "rc") {
      setRcFile(file);
      setRcPreview(url);
    } else {
      setLicenseFile(file);
      setLicensePreview(url);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formdata.name || !formdata.contact || !formdata.email || !formdata.password) {
      toast.error("Fill name, contact, email, and password");
      return;
    }
    if (!location) {
      toast.error("Set your location with current location or the map");
      return;
    }
    if (!address.formatted || !address.state || !address.city || !address.pincode) {
      toast.error("Address needs full address, city, state, and pincode");
      return;
    }
    if (!formdata.vehicleNumber) {
      toast.error("Vehicle number is required");
      return;
    }
    if (!rcFile || !licenseFile) {
      toast.error("Upload RC photo and license photo");
      return;
    }

    setIsSubmitting(true);
    try {
      const [vehicleRcPhoto, licensePhoto] = await Promise.all([
        uploadDeliveryDoc(rcFile),
        uploadDeliveryDoc(licenseFile),
      ]);

      const response = await axios.post(
        API_ENDPOINTS.SIGNUP,
        {
          name: formdata.name.trim(),
          contact: formdata.contact.trim(),
          email: formdata.email.trim(),
          password: formdata.password,
          location: { lat: location.lat, lng: location.lng },
          address: {
            formatted: address.formatted,
            line1: address.line1 || address.formatted,
            state: address.state,
            city: address.city,
            pincode: address.pincode,
            area: address.area,
            landmark: address.landmark || undefined,
          },
          vehicleDetails: {
            vehicleType: formdata.vehicleType,
            vehicleNumber: formdata.vehicleNumber.trim(),
            vehicleRcPhoto,
            licensePhoto,
          },
          workingRadius: Number(formdata.workingRadius) || 20,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        setSubmitted(true);
        toast.success("Registration submitted. Waiting for Super Admin approval.");
      } else {
        toast.error(response.data.message || "Registration failed");
      }
    } catch (error: unknown) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Error submitting registration. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#f5f7fb] text-slate-950 dark:bg-zinc-950 dark:text-white">
      <GoogleMapsLoader />
      <AuthThemeToggle />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-12 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/login" className="inline-flex rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
            <Image src="/shopzo_logo.png" alt="Shopzo" width={112} height={42} priority className="h-auto w-auto" />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Sign in
          </Link>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              Request sent
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Waiting for approval</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-400">
              Super Admin will review your delivery partner account. You can sign in after approval.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white to-emerald-50/70 px-6 py-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900/70 dark:to-zinc-900/30">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Register as delivery partner</h1>
              <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-zinc-400">
                Use current location or pick another pin on the map. Address fills from reverse geocoding. Login stays
                locked until Super Admin approves.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.12)] dark:border-zinc-800 dark:bg-zinc-900">
              {isLoadingAddress ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-sm dark:bg-zinc-900/95">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                    <p className="text-sm font-semibold">Fetching address details...</p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-6 p-6 md:p-7">
                <section className="space-y-5">
                  <h2 className="text-base font-semibold">Partner details</h2>
                  <Field label="Full name" required name="name" value={formdata.name} onChange={handleChange} className={inputClass} />
                  <Field
                    label="Contact number"
                    required
                    name="contact"
                    value={formdata.contact}
                    onChange={handleChange}
                    className={inputClass}
                    maxLength={10}
                    placeholder="10 digit mobile number"
                  />
                  <Field
                    label="Email"
                    required
                    name="email"
                    type="email"
                    value={formdata.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@partner.com"
                  />
                  <Field
                    label="Password"
                    required
                    name="password"
                    type="password"
                    value={formdata.password}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Set login password"
                  />
                </section>

                <section className="space-y-4 border-t border-slate-200/80 pt-6 dark:border-zinc-800">
                  <div>
                    <h2 className="text-base font-semibold">Service location</h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                      Current location fills the form. Choose another location to search or drop a pin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLoadingAddress}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Use current location
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 dark:border-zinc-700 dark:text-zinc-200"
                    >
                      Choose another location
                    </button>
                  </div>

                  {location ? (
                    <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                      Pin: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  ) : (
                    <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                      Location is required.
                    </p>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Full address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="formatted"
                      value={address.formatted}
                      onChange={handleAddressChange}
                      rows={3}
                      disabled={isLoadingAddress}
                      className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm shadow-sm ${
                        isLoadingAddress
                          ? disabledInputClass
                          : "border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                      }`}
                      placeholder="Address will be auto-filled"
                    />
                  </div>

                  <Field
                    label="Landmark"
                    name="landmark"
                    value={address.landmark || ""}
                    onChange={handleAddressChange}
                    className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                    disabled={isLoadingAddress}
                    placeholder="e.g., Near Metro Station"
                    required={false}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Area/Neighbourhood"
                      name="area"
                      value={address.area || ""}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                      required={false}
                    />
                    <Field
                      label="City"
                      required
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="State"
                      required
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                    />
                    <Field
                      label="Pincode"
                      required
                      name="pincode"
                      value={address.pincode}
                      onChange={handleAddressChange}
                      className={`${inputClass} ${isLoadingAddress ? disabledInputClass : ""}`}
                      disabled={isLoadingAddress}
                    />
                  </div>
                </section>

                <section className="space-y-5 border-t border-slate-200/80 pt-6 dark:border-zinc-800">
                  <h2 className="text-base font-semibold">Vehicle</h2>
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Vehicle type <span className="text-red-500">*</span>
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {VEHICLE_TYPES.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFormdata((prev) => ({ ...prev, vehicleType: item.value }))}
                          className={`h-10 rounded-xl text-sm font-semibold transition ${
                            formdata.vehicleType === item.value
                              ? "bg-slate-950 text-white dark:bg-white dark:text-zinc-950"
                              : "border border-slate-300 text-slate-700 dark:border-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field
                    label="Vehicle number"
                    required
                    name="vehicleNumber"
                    value={formdata.vehicleNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="DL01AB1234"
                  />
                  <Field
                    label="Working radius (km)"
                    required
                    name="workingRadius"
                    type="number"
                    value={formdata.workingRadius}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <PhotoField
                      label="RC photo"
                      preview={rcPreview}
                      onChange={(file) => handleFile("rc", file)}
                    />
                    <PhotoField
                      label="License photo"
                      preview={licensePreview}
                      onChange={(file) => handleFile("license", file)}
                    />
                  </div>
                </section>

                <div className="flex justify-end gap-3 border-t border-slate-200/80 pt-6 dark:border-zinc-800">
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </Link>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`inline-flex h-10 min-w-36 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white ${
                      isSubmitting ? "cursor-not-allowed bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit for approval"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showMapPicker ? (
        <AddressLocationPicker
          defaultPosition={location}
          onClose={() => setShowMapPicker(false)}
          onConfirm={({ lat, lng, address: nextAddress }) => {
            applyPickedLocation(lat, lng, nextAddress);
            setShowMapPicker(false);
          }}
        />
      ) : null}
    </main>
  );
}

async function waitForGoogleGeocoder(timeoutMs = 10000) {
  const started = Date.now();
  while (!window.google?.maps?.Geocoder) {
    if (Date.now() - started > timeoutMs) {
      throw new Error("Google Maps failed to load. Open the map picker instead.");
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

function Field({
  label,
  name,
  value,
  onChange,
  className,
  type = "text",
  required = true,
  disabled,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}

function PhotoField({
  label,
  preview,
  onChange,
}: {
  label: string;
  preview: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </span>
      <span className="flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-36 w-full object-cover" />
        ) : (
          <span>Tap to upload</span>
        )}
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}
