import { useEffect, useState } from "react";

export interface Day {
  date: string;
  count: number;
  level: number;
}

export interface Calendar {
  username: string;
  total: number;
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
