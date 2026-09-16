"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";
import type { RootState } from "@/store";
import { setAgent } from "@/store/slices/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const agent = useSelector((s: RootState) => s.auth.agent);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (agent) router.push("/profile");
  }, [agent, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        API_ENDPOINTS.SIGNIN,
        { email, password },
        { withCredentials: true },
      );
      if (!res.data?.success || !res.data?.agent) {
        setError(res.data?.message || "Login failed");
        return;
      }
      dispatch(setAgent(res.data.agent));
      router.push("/profile");
    } catch (submitError: unknown) {
      setError(axios.isAxiosError(submitError) ? submitError.response?.data?.message || "Login failed" : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Delivery partner</p>
          <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        </div>
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p> : null}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-emerald-400"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
