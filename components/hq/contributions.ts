import { useEffect, useState } from "react";
import type { Span } from "@/data/github";

export interface Day {
  date: string;
  count: number;
  level: number;
}

export interface Calendar {
  username: string;
  since: string;
  total: number;
  allTime: number;
  streak: { current: Span | null; longest: Span | null };
  activity: { commits: number; pullRequests: number; issues: number; reviews: number };
  repos: { count: number; top: string[] };
  weeks: Day[][];
}

export type Load = { status: "loading" } | { status: "error" } | { status: "ok"; data: Calendar };

let request: Promise<Calendar> | null = null;

/** The scene diorama and the panel read the same fetch. */
export function useContributions(): Load {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  useEffect(() => {
    let live = true;
    request ??= fetch("/api/github").then((r) => (r.ok ? (r.json() as Promise<Calendar>) : Promise.reject(new Error(String(r.status)))));
    request.then(
      (data) => live && setLoad({ status: "ok", data }),
      () => {
        request = null;
        if (live) setLoad({ status: "error" });
      },
    );
    return () => {
      live = false;
    };
  }, []);
  return load;
}
