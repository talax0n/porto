import { useEffect, useState } from "react";
import { type Agent, KINDS, MAX_AGENTS, PROVIDERS, type Pulse, parsePulse } from "@/data/pulse";
import { ctl } from "./game";

const POLL = 15_000;

/**
 * dev only: `?agents=6&done=2` swaps the poll for a made-up pulse of 6 working agents plus 2 that
 * finish a few seconds in, so the HQ can be seen full without real sessions.
 */
const FAKE = (() => {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  if (!q.has("agents")) return null;
  const done = Math.min(MAX_AGENTS, Number(q.get("done")) || 0);
  const live = Math.min(MAX_AGENTS - done, Number(q.get("agents")) || 0);
  const agents = Array.from({ length: live + done }, (_, i): Agent => ({
    id: ((i * 0x9e3779b1) >>> 0).toString(16).padStart(8, "0").slice(-8),
    provider: PROVIDERS[i % PROVIDERS.length],
    phase: i % 3 ? "tool" : "thinking",
    kind: KINDS[i % KINDS.length],
    title: `Fake session ${i + 1}`,
  }));
  const pulse = (finished: number): Pulse => ({
    agents: agents.map((a, i) => (i >= live && i < live + finished ? { ...a, phase: "done" } : a)),
    lastSeen: Date.now(),
    runsToday: agents.length,
  });
  const start = Date.now();
  return () => pulse(Date.now() - start > 4_000 ? done : 0);
})();

/** Polls the owner's agent activity while the tab is visible; the frame loop reads it from `ctl.pulse`. `at` is when it arrived. */
export function usePulse(): { pulse: Pulse; at: number } {
  const [got, setGot] = useState({ pulse: ctl.pulse, at: 0 });
  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = FAKE ? FAKE() : parsePulse(await (await fetch("/api/pulse")).json());
        if (next) setGot({ pulse: (ctl.pulse = next), at: Date.now() });
      } catch {}
    };
    load();
    const id = setInterval(load, FAKE ? 2_000 : POLL);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);
  return got;
}
