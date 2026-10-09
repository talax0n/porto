import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ctl } from "../game";
import { ago, say } from "@/data/pulse";

/** Easter egg: the blinking caret after the role (or the ` key) opens a tiny `ps` of the owner's live agents. */
export function Ps() {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState({ pulse: ctl.pulse, at: 0 });
  const toggle = () => {
    setNow({ pulse: ctl.pulse, at: Date.now() });
    setOpen((o) => !o);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Backquote") toggle();
      else if (e.code === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow({ pulse: ctl.pulse, at: Date.now() }), 2_000);
    return () => clearInterval(id);
  }, [open]);

  const { agents, lastSeen, runsToday } = now.pulse;
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="ps"
        aria-expanded={open}
        className="pointer-events-auto ml-0.5 animate-pulse text-hq-mute/60 hover:text-hq-accent"
      >
        ▍
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="pointer-events-auto absolute top-full left-0 mt-3 w-72 rounded-xl border border-hq-line bg-white/90 px-3 py-2.5 font-mono text-[10px] leading-relaxed tracking-normal normal-case text-hq-ink shadow-sm backdrop-blur"
          >
            <p className="text-hq-mute">$ ps agents</p>
            {agents.length ? (
              <ul>
                {agents.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-hq-accent">●</span>
                    <span className="min-w-0 flex-1 truncate">{a.title ?? "untitled"}</span>
                    <span className="text-hq-mute">
                      {a.provider} · {say(a)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>no agents running</p>
            )}
            <p className="text-hq-mute">
              {runsToday} runs today{lastSeen > 0 && ` · seen ${ago(Math.max(0, now.at - lastSeen))}`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
