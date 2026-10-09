import { useEffect, useState } from "react";
import { type Pulse, parsePulse } from "@/data/pulse";
import { ctl } from "./game";

const POLL = 15_000;

/** Polls the owner's agent activity while the tab is visible; the frame loop reads it from `ctl.pulse`. `at` is when it arrived. */
export function usePulse(): { pulse: Pulse; at: number } {
  const [got, setGot] = useState({ pulse: ctl.pulse, at: 0 });
  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = parsePulse(await (await fetch("/api/pulse")).json());
        if (next) setGot({ pulse: (ctl.pulse = next), at: Date.now() });
      } catch {}
    };
    load();
    const id = setInterval(load, POLL);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", load);
    };
  }, []);
  return got;
}
