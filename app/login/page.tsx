"use client";

import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";
import { AuthThemeToggle } from "@/app/components/ThemeToggle";
import { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";

const benefits = ["Go on duty when you're ready", "See nearby delivery jobs", "Track your approval status"];

const modules = [
  { name: "Duty", value: "On / off mode", tone: "bg-emerald-500" },
  { name: "Jobs", value: "Nearby orders", tone: "bg-cyan-500" },
  { name: "Route", value: "Pickup to drop", tone: "bg-amber-500" },
];

type LoginMode = "mobile" | "email";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const agent = useSelector((state: RootState) => state.auth.agent);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("mobile");
  const [formData, setFormData] = useState({ email: "", contact: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (agent) router.push("/home");
  }, [agent, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload =
        loginMode === "mobile"
          ? { contact: formData.contact, password: formData.password }
          : { email: formData.email, password: formData.password };

      const res = await axios.post(API_ENDPOINTS.SIGNIN, payload, { withCredentials: true });

      if (!res.data.success || !res.data.agent) {
        setError(res.data.message || "Login failed");
        return;
      }

      dispatch(setAgent(res.data.agent));
      router.push("/home");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10";

  return (
    <main className="min-h-dvh bg-[#f5f7fb] text-slate-950 dark:bg-zinc-950 dark:text-white">
      <AuthThemeToggle />
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)]">
        <section className="relative hidden overflow-hidden bg-slate-950 text-white lg:block">
          <div className="absolute inset-0 delivery-login-backdrop" aria-hidden />
          <div className="relative flex h-full min-h-[720px] flex-col justify-between px-10 py-8 xl:px-14">
            <Link href="/login" className="inline-flex w-fit rounded-lg bg-white px-3 py-2 shadow-sm">
              <Image src="/shopzo_logo.png" alt="Shopzo" width={118} height={44} priority className="h-auto w-auto" />
            </Link>

            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Delivery partner</p>
              <h1 className="mt-4 text-5xl font-semibold leading-[1.03] tracking-normal xl:text-6xl">
                Deliver faster from your partner workspace.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Sign in to manage duty mode, nearby jobs, and your delivery radius — same Shopzo look as vendor and
                warehouse.
              </p>

              <div className="mt-9 grid grid-cols-3 gap-3">
                {modules.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur"
                  >
                    <span className={`block h-2 w-10 rounded-full ${item.tone}`} />
                    <p className="mt-4 text-sm font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <Metric value="Live" label="job feed" />
              <Metric value="On duty" label="when you say" />
              <Metric value="Fast" label="handoffs" />
            </div>
          </div>
        </section>

        <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[460px]">
            <Link
              href="/login"
              className="mb-8 inline-flex rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 lg:hidden"
            >
              <Image src="/shopzo_logo.png" alt="Shopzo" width={112} height={42} priority className="h-auto w-auto" />
            </Link>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-zinc-900 sm:p-7">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  Partner access
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
                  Sign in to Shopzo
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                  Mobile or email with password
                </p>
              </div>

              <div className="mt-6 inline-flex w-full rounded-full border border-shop-border bg-shop-surface p-1">
                {(["mobile", "email"] as LoginMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setLoginMode(mode);
                      setError("");
                    }}
                    className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                      loginMode === mode
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-shop-muted hover:text-foreground"
                    }`}
                  >
                    {mode === "mobile" ? "Mobile" : "Email"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
                {loginMode === "mobile" ? (
                  <div>
                    <label
                      htmlFor="login-mobile"
                      className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-zinc-200"
                    >
                      Contact number
                    </label>
                    <input
                      id="login-mobile"
                      name="contact"
                      type="text"
                      required
                      maxLength={10}
                      value={formData.contact}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, contact: e.target.value }));
                        setError("");
                      }}
                      className={inputClass}
                      placeholder="10 digit mobile number"
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="login-email"
                      className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-zinc-200"
                    >
                      Email address
                    </label>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, email: e.target.value }));
                        setError("");
                      }}
                      placeholder="you@partner.com"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-zinc-200"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, password: e.target.value }));
                        setError("");
                      }}
                      placeholder="Enter your password"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-slate-950 px-4 text-[15px] font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6 grid gap-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 dark:bg-zinc-950 dark:text-zinc-300"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <CheckIcon />
                    </span>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600 dark:text-zinc-400">
              New partner?{" "}
              <Link href="/register" className="font-semibold text-slate-950 dark:text-white">
                Register and wait for approval
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{label}</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="m5 13 4 4L19 7" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M2.5 12C3.7 8 7.5 5 12 5s8.3 3 9.5 7c-1.2 4-5 7-9.5 7s-8.3-3-9.5-7Z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="m3 3 18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M9.9 5.2A10.7 10.7 0 0 1 12 5c4.5 0 8.3 3 9.5 7a11.8 11.8 0 0 1-2.4 4M6.3 6.8A11.5 11.5 0 0 0 2.5 12c1.2 4 5 7 9.5 7 1.1 0 2.1-.2 3.1-.5"
      />
    </svg>
  );
}
