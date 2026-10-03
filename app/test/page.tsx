"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

export default function TestPage() {
  const [jobs, setJobs] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const next = io("http://localhost:8000");

    next.on("connect", () => {
      console.log("Connected:", next.id);
    });

    next.on("jobs", (list: string[]) => {
      setJobs(list);
    });

    setSocket(next);

    return () => {
      next.disconnect();
    };
  }, []);

  return (
    <div className="min-h-dvh bg-zinc-950 p-8 text-white">
      <h1 className="text-xl font-semibold">Socket jobs playground</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Open this page in 2–3 tabs. Server adds a job every 4s. Accept broadcasts to everyone.
      </p>
      <ul className="mt-6 space-y-2">
        {jobs.map((job) => (
          <li
            key={job}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <span>{job}</span>
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold"
              onClick={() => socket?.emit("accept-job", job)}
            >
              Accept
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
