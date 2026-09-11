"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import AddressLocationPicker from "@/app/components/AddressLocationPicker";
import { usePartnerLogout } from "@/app/components/AppChrome";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";
import { formatAddressLine } from "@/lib/kyc";
import { uploadDeliveryDoc } from "@/lib/s3Upload";
import { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";
import type { Address } from "@/store/types/address";

type EditPanel = "radius" | "area" | "home" | "details" | "kyc" | null;
type VehicleType = "bike" | "car" | "truck" | "other";

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "bike", label: "Bike" },
  { value: "car", label: "Car" },
  { value: "truck", label: "Truck" },
  { value: "other", label: "Other" },
];

export default function ProfilePage() {
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const logout = usePartnerLogout();
  const [editPanel, setEditPanel] = useState<EditPanel>(null);
  const [showMapPicker, setShowMapPicker] = useState<"home" | "work" | null>(null);
  const [saving, setSaving] = useState(false);

  const [radiusValue, setRadiusValue] = useState("20");
  const [detailsForm, setDetailsForm] = useState({ name: "", email: "", contact: "" });
  const [pendingArea, setPendingArea] = useState<{
    lat: number;
    lng: number;
    address: Address;
  } | null>(null);
  const [pendingHome, setPendingHome] = useState<{
    lat: number;
    lng: number;
    address: Address;
  } | null>(null);

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

  useEffect(() => {
    if (!agent) return;
    setRadiusValue(String(agent.workingRadius || 20));
    setDetailsForm({
      name: agent.name || "",
      email: agent.email || "",
      contact: agent.contact || "",
    });
    setKycForm((s) => ({
      ...s,
      aadhaarNumber: agent.aadhaar?.number || "",
      vehicleType: (agent.vehicleDetails?.vehicleType as VehicleType) || "bike",
      vehicleNumber: agent.vehicleDetails?.vehicleNumber || "",
      workingRadius: String(agent.workingRadius || 20),
    }));
    setPreviews({
      front: agent.aadhaar?.frontPhoto || "",
      back: agent.aadhaar?.backPhoto || "",
      rc: agent.vehicleDetails?.vehicleRcPhoto || "",
      license: agent.vehicleDetails?.licensePhoto || "",
    });
  }, [agent]);

  if (!agent) return null;

  const status = agent.approvalStatus || "incomplete";
  const needsKyc = status === "incomplete" || status === "rejected";
  const initials = agent.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const openPanel = (panel: EditPanel) => {
    setPendingArea(null);
    setPendingHome(null);
    setShowMapPicker(null);
    setEditPanel(panel);
  };

  const closePanel = () => {
    setEditPanel(null);
    setPendingArea(null);
    setPendingHome(null);
    setShowMapPicker(null);
  };

  const setFile = (kind: "front" | "back" | "rc" | "license", file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviews((s) => ({ ...s, [kind]: url }));
    if (kind === "front") setAadhaarFront(file);
    if (kind === "back") setAadhaarBack(file);
    if (kind === "rc") setRcFile(file);
    if (kind === "license") setLicenseFile(file);
  };

  const saveRadius = async () => {
    const radius = Number(radiusValue);
    if (!Number.isFinite(radius) || radius < 1 || radius > 100) {
      toast.error("Radius must be between 1 and 100 km");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.patch(
        API_ENDPOINTS.UPDATE_WORKING_RADIUS,
        { workingRadius: radius },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success(res.data.message || "Working radius updated");
        closePanel();
      } else toast.error(res.data?.message || "Could not update radius");
    } catch (error) {
      toast.error(axiosMsg(error, "Could not update radius"));
    } finally {
      setSaving(false);
    }
  };

  const saveWorkArea = async () => {
    if (!pendingArea) {
      toast.error("Pick a work location first");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.patch(
        API_ENDPOINTS.UPDATE_WORK_AREA,
        {
          location: { lat: pendingArea.lat, lng: pendingArea.lng },
          address: pendingArea.address,
        },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success(res.data.message || "Work area updated");
        closePanel();
      } else toast.error(res.data?.message || "Could not update work area");
    } catch (error) {
      toast.error(axiosMsg(error, "Could not update work area"));
    } finally {
      setSaving(false);
    }
  };

  const saveWorkSameAsHome = async () => {
    setSaving(true);
    try {
      const res = await axios.patch(
        API_ENDPOINTS.UPDATE_WORK_AREA,
        { workSameAsHome: true },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success(res.data.message || "Work area set to home");
        closePanel();
      } else toast.error(res.data?.message || "Could not update work area");
    } catch (error) {
      toast.error(axiosMsg(error, "Could not update work area"));
    } finally {
      setSaving(false);
    }
  };

  const saveHome = async () => {
    if (!pendingHome) {
      toast.error("Pick a home location first");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.patch(
        API_ENDPOINTS.UPDATE_HOME_ADDRESS,
        {
          location: { lat: pendingHome.lat, lng: pendingHome.lng },
          address: pendingHome.address,
        },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success(res.data.message || "Home address updated");
        closePanel();
      } else toast.error(res.data?.message || "Could not update home address");
    } catch (error) {
      toast.error(axiosMsg(error, "Could not update home address"));
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async () => {
    if (!detailsForm.name.trim() || !detailsForm.email.trim() || !detailsForm.contact.trim()) {
      toast.error("Name, email and mobile are required");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.patch(
        API_ENDPOINTS.UPDATE_PROFILE,
        {
          name: detailsForm.name.trim(),
          email: detailsForm.email.trim(),
          contact: detailsForm.contact.trim(),
        },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.agent) {
        dispatch(setAgent(res.data.agent));
        toast.success(res.data.message || "Profile updated");
        closePanel();
      } else toast.error(res.data?.message || "Could not update profile");
    } catch (error) {
      toast.error(axiosMsg(error, "Could not update profile"));
    } finally {
      setSaving(false);
    }
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
        closePanel();
      } else toast.error(res.data?.message || "KYC submit failed");
    } catch (error) {
      toast.error(axiosMsg(error, "KYC submit failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${card} p-6 lg:p-7`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-semibold text-white">
              {initials || "P"}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{agent.name}</h1>
              <p className="text-sm text-shop-muted">{agent.shopzoDeliveryId || "Delivery partner"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  tone={
                    status === "approved"
                      ? "green"
                      : status === "rejected"
                        ? "red"
                        : status === "pending"
                          ? "amber"
                          : "slate"
                  }
                  label={status === "incomplete" ? "KYC incomplete" : status}
                />
                <Badge
                  tone={agent.dutyMode ? "green" : "slate"}
                  label={agent.dutyMode ? "On duty" : "Off duty"}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {needsKyc ? (
              <button
                type="button"
                onClick={() => openPanel(editPanel === "kyc" ? null : "kyc")}
                className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {editPanel === "kyc" ? "Close KYC form" : "Complete KYC"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openPanel("details")}
              className="h-11 rounded-xl border border-shop-border bg-shop-surface px-4 text-sm font-semibold"
            >
              Edit details
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="h-11 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
            >
              Sign out
            </button>
          </div>
        </div>
        {status === "rejected" && agent.rejectionReason ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {agent.rejectionReason}
          </p>
        ) : null}
        {status === "pending" ? (
          <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
            KYC submitted — waiting for ops review. You can’t take jobs until approved.
          </p>
        ) : null}
      </div>

      {editPanel === "kyc" && needsKyc ? (
        <EditSheet
          title="Complete KYC"
          subtitle="Aadhaar + vehicle only. Home/work are already on file."
          onClose={closePanel}
          onSave={submitKyc}
          saving={saving}
          saveLabel="Submit for ops approval"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold">Aadhaar</h3>
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
            </div>
            <div>
              <h3 className="text-sm font-semibold">Vehicle</h3>
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
                          kycForm.vehicleType === v.value
                            ? "bg-emerald-600 text-white"
                            : "border border-shop-border"
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
            </div>
          </div>
        </EditSheet>
      ) : null}

      {editPanel === "details" ? (
        <EditSheet title="Edit account details" subtitle="Name, email, mobile only." onClose={closePanel} onSave={saveDetails} saving={saving}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={detailsForm.name} onChange={(v) => setDetailsForm((s) => ({ ...s, name: v }))} />
            <Field label="Mobile" value={detailsForm.contact} onChange={(v) => setDetailsForm((s) => ({ ...s, contact: v }))} />
            <Field label="Email" type="email" value={detailsForm.email} onChange={(v) => setDetailsForm((s) => ({ ...s, email: v }))} className="sm:col-span-2" />
          </div>
        </EditSheet>
      ) : null}

      {editPanel === "radius" ? (
        <EditSheet title="Edit working radius" subtitle="How far from your work hub you’ll take jobs." onClose={closePanel} onSave={saveRadius} saving={saving}>
          <label className="block max-w-xs text-sm">
            <span className="mb-1.5 block font-medium text-shop-muted">Radius (km)</span>
            <input
              type="number"
              min={1}
              max={100}
              value={radiusValue}
              onChange={(e) => setRadiusValue(e.target.value)}
              className="h-11 w-full rounded-xl border border-shop-border bg-shop-surface px-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        </EditSheet>
      ) : null}

      {editPanel === "home" ? (
        <EditSheet
          title="Edit home address"
          subtitle="Residential address only."
          onClose={closePanel}
          onSave={saveHome}
          saving={saving}
          saveDisabled={!pendingHome}
        >
          <div className="space-y-4">
            <ReadOnlyBox label="Current home" value={formatAddressLine(agent.homeAddress)} />
            {pendingHome ? (
              <ReadOnlyBox
                label="New home selected"
                value={formatAddressLine(pendingHome.address)}
                tone="green"
                actionLabel="Change pin"
                onAction={() => setShowMapPicker("home")}
              />
            ) : (
              <button type="button" onClick={() => setShowMapPicker("home")} className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white">
                Open map picker
              </button>
            )}
          </div>
        </EditSheet>
      ) : null}

      {editPanel === "area" ? (
        <EditSheet
          title="Edit work area"
          subtitle="Hub pin used for job matching."
          onClose={closePanel}
          onSave={saveWorkArea}
          saving={saving}
          saveDisabled={!pendingArea}
          extraAction={
            <button
              type="button"
              disabled={saving}
              onClick={saveWorkSameAsHome}
              className="h-10 rounded-xl border border-shop-border px-4 text-sm font-semibold"
            >
              Same as home
            </button>
          }
        >
          <div className="space-y-4">
            <ReadOnlyBox label="Current work area" value={formatAddressLine(agent.address)} />
            {pendingArea ? (
              <ReadOnlyBox
                label="New work area selected"
                value={formatAddressLine(pendingArea.address)}
                tone="green"
                actionLabel="Change pin"
                onAction={() => setShowMapPicker("work")}
              />
            ) : (
              <button type="button" onClick={() => setShowMapPicker("work")} className="h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white">
                Open map picker
              </button>
            )}
          </div>
        </EditSheet>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${card} p-6`}>
          <SectionHead title="Account" onEdit={() => openPanel("details")} hideEdit={editPanel === "details"} />
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Mobile" value={agent.contact || "—"} />
            <Row label="Email" value={agent.email || "—"} />
          </dl>
        </section>

        <section className={`${card} p-6`}>
          <SectionHead title="Working radius" onEdit={() => openPanel("radius")} hideEdit={editPanel === "radius"} />
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            {agent.workingRadius || 20}
            <span className="ml-1 text-base font-medium text-shop-muted">km</span>
          </p>
        </section>

        <section className={`${card} p-6`}>
          <SectionHead title="Home address" onEdit={() => openPanel("home")} hideEdit={editPanel === "home"} />
          <p className="mt-4 text-sm leading-6">{formatAddressLine(agent.homeAddress)}</p>
        </section>

        <section className={`${card} p-6`}>
          <SectionHead title="Work area" onEdit={() => openPanel("area")} hideEdit={editPanel === "area"} />
          <p className="mt-4 text-sm leading-6">{formatAddressLine(agent.address)}</p>
          {agent.workSameAsHome ? (
            <p className="mt-2 text-xs font-medium text-shop-muted">Same as home</p>
          ) : null}
        </section>

        {(agent.aadhaar || agent.vehicleDetails) && (
          <section className={`${card} p-6 lg:col-span-2`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-shop-muted">KYC documents</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <dl className="space-y-3 text-sm">
                <Row label="Aadhaar" value={agent.aadhaar?.number ? maskAadhaar(agent.aadhaar.number) : "—"} />
                <Row label="Vehicle" value={agent.vehicleDetails?.vehicleType || "—"} />
                <Row label="Number" value={agent.vehicleDetails?.vehicleNumber || "—"} />
              </dl>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <DocThumb label="Aadhaar front" src={agent.aadhaar?.frontPhoto} />
                <DocThumb label="Aadhaar back" src={agent.aadhaar?.backPhoto} />
                <DocThumb label="RC" src={agent.vehicleDetails?.vehicleRcPhoto} />
                <DocThumb label="License" src={agent.vehicleDetails?.licensePhoto} />
              </div>
            </div>
          </section>
        )}
      </div>

      {showMapPicker ? (
        <AddressLocationPicker
          defaultPosition={
            showMapPicker === "home"
              ? pendingHome || agent.homeLocation || null
              : pendingArea || agent.location || null
          }
          onClose={() => setShowMapPicker(null)}
          onConfirm={({ lat, lng, address }) => {
            if (showMapPicker === "home") setPendingHome({ lat, lng, address });
            else setPendingArea({ lat, lng, address });
            setShowMapPicker(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SectionHead({
  title,
  onEdit,
  hideEdit,
}: {
  title: string;
  onEdit: () => void;
  hideEdit?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-shop-muted">{title}</h2>
      {!hideEdit ? (
        <button type="button" onClick={onEdit} className="text-sm font-semibold text-shop-accent hover:underline">
          Edit
        </button>
      ) : null}
    </div>
  );
}

function EditSheet({
  title,
  subtitle,
  children,
  onClose,
  onSave,
  saving,
  saveLabel = "Save",
  saveDisabled = false,
  extraAction,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel?: string;
  saveDisabled?: boolean;
  extraAction?: React.ReactNode;
}) {
  return (
    <section className={`${card} border-emerald-200/80 p-5 ring-1 ring-emerald-500/20 dark:border-emerald-900/40 lg:p-6`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-shop-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {extraAction}
          <button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-xl border border-shop-border px-4 text-sm font-semibold disabled:opacity-60">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || saveDisabled}
            className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : saveLabel}
          </button>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
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
          accept="image/*"
          className="w-full border-t border-shop-border px-3 py-2 text-xs"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />
      </div>
    </label>
  );
}

function ReadOnlyBox({
  label,
  value,
  tone,
  actionLabel,
  onAction,
}: {
  label: string;
  value: string;
  tone?: "green";
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        tone === "green"
          ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30"
          : "border-shop-border bg-shop-surface"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">{label}</p>
      <p className="mt-1 leading-6">{value}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="mt-3 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-shop-border/70 pb-3 last:border-0 last:pb-0">
      <dt className="text-shop-muted">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "amber" | "red" | "slate" }) {
  const className = {
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
    red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
  }[tone];
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${className}`}>{label}</span>;
}

function DocThumb({ label, src }: { label: string; src?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-shop-border">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center text-xs text-shop-muted">No {label}</div>
      )}
      <p className="border-t border-shop-border px-2 py-1.5 text-center text-[11px] font-semibold">{label}</p>
    </div>
  );
}

function maskAadhaar(number: string) {
  const digits = number.replace(/\s+/g, "");
  if (digits.length < 4) return digits;
  return `XXXX XXXX ${digits.slice(-4)}`;
}

function axiosMsg(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && error.response?.data?.message) return error.response.data.message as string;
  return fallback;
}
