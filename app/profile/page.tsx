"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import AddressLocationPicker from "@/app/components/AddressLocationPicker";
import { usePartnerLogout } from "@/app/components/AppChrome";
import { API_ENDPOINTS } from "@/lib/api";
import { card } from "@/lib/delivery-ui";
import { formatAddressLine } from "@/lib/kyc";
import { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";
import type { Address } from "@/store/types/address";

type EditPanel = "radius" | "area" | "home" | "details" | null;

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

  useEffect(() => {
    if (!agent) return;
    setRadiusValue(String(agent.workingRadius || 20));
    setDetailsForm({
      name: agent.name || "",
      email: agent.email || "",
      contact: agent.contact || "",
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
                    status === "approved" ? "green" : status === "rejected" ? "red" : "amber"
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
              <Link
                href="/kyc"
                className="inline-flex h-11 items-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {status === "rejected" ? "Fix KYC" : "Complete KYC"}
              </Link>
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

        <OnboardingTrack status={status} />

        {status === "incomplete" ? (
          <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 dark:border-amber-500/70 dark:bg-amber-950/40">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">KYC not completed</p>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-50/90">
              Upload Aadhaar and vehicle documents. Jobs stay locked until ops approves you.
            </p>
          </div>
        ) : null}
        {status === "rejected" ? (
          <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/40">
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">KYC needs a fix</p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-50/90">
              {agent.rejectionReason || "Update your documents and resubmit for ops review."}
            </p>
          </div>
        ) : null}
        {status === "pending" ? (
          <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
            KYC submitted — waiting for ops review. You can’t take jobs until approved.
          </p>
        ) : null}
      </div>

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

type StepState = "done" | "current" | "upcoming" | "failed";

function onboardingSteps(status: string): { label: string; hint: string; state: StepState }[] {
  const kyc: StepState =
    status === "incomplete" ? "current" : status === "rejected" ? "current" : "done";
  const approval: StepState =
    status === "approved"
      ? "done"
      : status === "pending"
        ? "current"
        : status === "rejected"
          ? "failed"
          : "upcoming";

  return [
    { label: "Signup", hint: "Account created", state: "done" },
    {
      label: "KYC",
      hint:
        status === "incomplete"
          ? "Upload documents"
          : status === "rejected"
            ? "Resubmit documents"
            : "Documents in",
      state: kyc,
    },
    {
      label: "Approval",
      hint:
        status === "approved"
          ? "You can take jobs"
          : status === "pending"
            ? "Ops review"
            : status === "rejected"
              ? "Needs a fix"
              : "After KYC",
      state: approval,
    },
  ];
}

function OnboardingTrack({ status }: { status: string }) {
  const steps = onboardingSteps(status);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-3">
        {steps.map((step, index) => {
          const prev = index > 0 ? steps[index - 1].state : null;
          return (
            <div key={step.label} className="relative flex flex-col items-center px-1 text-center">
              {index > 0 ? (
                <span
                  className={`absolute top-3 right-1/2 left-0 h-0.5 -translate-y-1/2 ${
                    prev === "done" ? "bg-emerald-500" : prev === "failed" ? "bg-red-400" : "bg-slate-200 dark:bg-zinc-700"
                  }`}
                />
              ) : null}
              {index < steps.length - 1 ? (
                <span
                  className={`absolute top-3 right-0 left-1/2 h-0.5 -translate-y-1/2 ${
                    step.state === "done"
                      ? "bg-emerald-500"
                      : step.state === "failed"
                        ? "bg-red-400"
                        : "bg-slate-200 dark:bg-zinc-700"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  step.state === "done"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : step.state === "current"
                      ? "border-amber-500 bg-white ring-4 ring-amber-400/30 dark:bg-zinc-950"
                      : step.state === "failed"
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-slate-300 bg-white dark:border-zinc-600 dark:bg-zinc-950"
                }`}
              >
                {step.state === "done" ? (
                  <span className="text-[11px] font-bold leading-none">✓</span>
                ) : step.state === "failed" ? (
                  <span className="text-[11px] font-bold leading-none">!</span>
                ) : (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      step.state === "current" ? "bg-amber-500" : "bg-slate-300 dark:bg-zinc-600"
                    }`}
                  />
                )}
              </span>
              <p className="mt-2 text-xs font-semibold">{step.label}</p>
              <p className="mt-0.5 text-[11px] text-shop-muted">{step.hint}</p>
            </div>
          );
        })}
      </div>
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
