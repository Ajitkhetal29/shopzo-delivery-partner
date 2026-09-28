"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";
import { uploadDeliveryDoc } from "@/lib/s3Upload";
import { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";

type VehicleType = "bike" | "car" | "truck" | "other";

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "bike", label: "Bike" },
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
];

const DOC_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_MAX_BYTES = 5 * 1024 * 1024;

export default function KycPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const [saving, setSaving] = useState(false);
  const [kycForm, setKycForm] = useState({
    aadhaarNumber: "",
    vehicleType: "bike" as VehicleType,
    vehicleNumber: "",
    workingRadius: "20",
  });
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [rcFile, setRcFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState({
    front: "",
    back: "",
    rc: "",
    license: "",
  });

  const status = agent?.approvalStatus || "incomplete";
  const canSubmit = status === "incomplete" || status === "rejected";

  useEffect(() => {
    if (!agent) return;
    if (!canSubmit) {
      router.replace("/profile");
      return;
    }
    setKycForm({
      aadhaarNumber: agent.aadhaar?.number || "",
      vehicleType: (agent.vehicleDetails?.vehicleType as VehicleType) || "bike",
      vehicleNumber: agent.vehicleDetails?.vehicleNumber || "",
      workingRadius: String(agent.workingRadius || 20),
    });
    setPreviews({
      front: agent.aadhaar?.frontPhoto || "",
      back: agent.aadhaar?.backPhoto || "",
      rc: agent.vehicleDetails?.vehicleRcPhoto || "",
      license: agent.vehicleDetails?.licensePhoto || "",
    });
  }, [agent, canSubmit, router]);

  if (!agent || !canSubmit) return null;

  const setFile = (kind: "front" | "back" | "rc" | "license", file: File | null) => {
    if (!file) return;
    if (!DOC_TYPES.includes(file.type)) {
      toast.error("Use a JPG, PNG, or WebP image");
      return;
    }
    if (file.size > DOC_MAX_BYTES) {
      toast.error("Each document must be under 5 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviews((s) => ({ ...s, [kind]: url }));
    if (kind === "front") setAadhaarFront(file);
    if (kind === "back") setAadhaarBack(file);
    if (kind === "rc") setRcFile(file);
    if (kind === "license") setLicenseFile(file);
  };

  const submitKyc = async () => {
    const aadhaarNumber = kycForm.aadhaarNumber.replace(/\s+/g, "");
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      toast.error("Enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!aadhaarFront && !previews.front) {
      toast.error("Upload Aadhaar front");
      return;
    }
    if (!aadhaarBack && !previews.back) {
      toast.error("Upload Aadhaar back");
      return;
    }
    if (!kycForm.vehicleNumber.trim()) {
      toast.error("Vehicle number is required");
      return;
    }
    if (!rcFile && !previews.rc) {
      toast.error("Upload RC photo");
      return;
    }
    if (!licenseFile && !previews.license) {
      toast.error("Upload license photo");
      return;
    }

    setSaving(true);
    try {
      const [frontPhoto, backPhoto, vehicleRcPhoto, licensePhoto] = await Promise.all([
        aadhaarFront ? uploadDeliveryDoc(aadhaarFront) : Promise.resolve(previews.front),
        aadhaarBack ? uploadDeliveryDoc(aadhaarBack) : Promise.resolve(previews.back),
        rcFile ? uploadDeliveryDoc(rcFile) : Promise.resolve(previews.rc),
        licenseFile ? uploadDeliveryDoc(licenseFile) : Promise.resolve(previews.license),
      ]);

      const res = await axios.post(
        API_ENDPOINTS.SUBMIT_KYC,
        {
          aadhaar: { number: aadhaarNumber, frontPhoto, backPhoto },
          vehicleDetails: {
            vehicleType: kycForm.vehicleType,
            vehicleNumber: kycForm.vehicleNumber.trim(),
            vehicleRcPhoto,
            licensePhoto,
          },
          workingRadius: Number(kycForm.workingRadius) || 20,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success(res.data.message || "KYC submitted");
        router.push("/profile");
      } else toast.error(res.data?.message || "KYC submit failed");
    } catch (error) {
      toast.error(axiosMsg(error, "KYC submit failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
            {status === "rejected" ? "Resubmit" : "Step 2 of 3"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {status === "rejected" ? "Fix your KYC" : "Complete KYC"}
          </h1>
          <p className="mt-1 text-sm text-shop-muted">
            Aadhaar and vehicle documents. Home and work address stay on your profile.
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex h-10 shrink-0 items-center rounded-xl border border-shop-border px-4 text-sm font-semibold"
        >
          Back
        </Link>
      </div>

      {status === "rejected" && agent.rejectionReason ? (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40">
          <p className="text-sm font-semibold text-red-900 dark:text-red-100">Ops rejected the last submission</p>
          <p className="mt-1 text-sm text-red-800 dark:text-red-50/90">{agent.rejectionReason}</p>
        </div>
      ) : null}

      <form
        className={`${card} space-y-8 p-6 lg:p-7`}
        onSubmit={(event) => {
          event.preventDefault();
          void submitKyc();
        }}
      >
        <section>
          <h2 className="text-sm font-semibold">Aadhaar</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Aadhaar number"
              value={kycForm.aadhaarNumber}
              onChange={(v) => setKycForm((s) => ({ ...s, aadhaarNumber: v }))}
              placeholder="12 digits"
            />
            <Field
              label="Working radius (km)"
              type="number"
              value={kycForm.workingRadius}
              onChange={(v) => setKycForm((s) => ({ ...s, workingRadius: v }))}
            />
            <PhotoField label="Aadhaar front" preview={previews.front} onChange={(f) => setFile("front", f)} />
            <PhotoField label="Aadhaar back" preview={previews.back} onChange={(f) => setFile("back", f)} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Vehicle</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-shop-muted">Type</span>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setKycForm((s) => ({ ...s, vehicleType: v.value }))}
                    className={`h-10 rounded-xl px-4 text-sm font-semibold ${
                      kycForm.vehicleType === v.value ? "bg-emerald-600 text-white" : "border border-shop-border"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </label>
            <Field
              label="Vehicle number"
              value={kycForm.vehicleNumber}
              onChange={(v) => setKycForm((s) => ({ ...s, vehicleNumber: v }))}
            />
            <PhotoField label="RC photo" preview={previews.rc} onChange={(f) => setFile("rc", f)} />
            <PhotoField label="License photo" preview={previews.license} onChange={(f) => setFile("license", f)} />
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-2 border-t border-shop-border pt-5">
          <Link
            href="/profile"
            className="inline-flex h-11 items-center rounded-xl border border-shop-border px-4 text-sm font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Submitting..." : "Submit for ops approval"}
          </button>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-shop-muted">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-shop-border bg-shop-surface px-3 text-sm outline-none focus:border-emerald-500"
      />
    </label>
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
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-shop-muted">{label}</span>
      <div className="overflow-hidden rounded-xl border border-dashed border-shop-border">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-36 w-full object-cover" />
        ) : (
          <div className="flex h-36 items-center justify-center text-xs text-shop-muted">Upload {label}</div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="w-full border-t border-shop-border px-3 py-2 text-xs"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            onChange(file);
            if (
              file &&
              (!DOC_TYPES.includes(file.type) || file.size > DOC_MAX_BYTES)
            ) {
              e.target.value = "";
            }
          }}
        />
      </div>
    </label>
  );
}

function axiosMsg(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && error.response?.data?.message) return error.response.data.message as string;
  return fallback;
}
