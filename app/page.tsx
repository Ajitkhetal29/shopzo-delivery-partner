"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function Home() {
  const router = useRouter();
  const agent = useSelector((s: RootState) => s.auth.agent);

  useEffect(() => {
    router.replace(agent ? "/profile" : "/login");
  }, [agent, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}
