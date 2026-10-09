import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHANGELOG } from "@/data/changelog";
import { cn } from "@/lib/utils";

const SEEN_KEY = "porto:changelog-seen";
const [latest] = CHANGELOG;
const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return latest.version;
  }
}

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};

/** A "what's new" pill under the wordmark that opens the release notes; a dot marks an unseen version. */
export function Changelog() {
  const [open, setOpen] = useState(false);
  // the server snapshot counts as seen, so the dot only appears after hydration
  const unread = useSyncExternalStore(subscribe, readSeen, () => latest.version) !== latest.version;
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => root.current?.contains(e.target as Node) || setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const toggle = () => {
    setOpen((o) => !o);
    try {
      localStorage.setItem(SEEN_KEY, latest.version);
    } catch {}
  };

  return (
    <section ref={root} aria-label="Changelog" className="pointer-events-auto relative mt-3 w-fit">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="changelog-card"
        className="flex items-center gap-1.5 rounded-full border border-hq-line bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-hq-ink backdrop-blur pointer-coarse:min-h-11"
      >
        <span className="tabular-nums">v{latest.version}</span>
        <span className="max-sm:hidden">What&apos;s new</span>
        {unread && <span className="size-1.5 rounded-full bg-hq-accent" aria-label="New" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="changelog-card"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 max-h-[60dvh] w-[280px] overflow-y-auto overscroll-contain rounded-2xl border border-hq-line bg-white/90 px-3.5 py-3 backdrop-blur"
          >
            <ol className="flex flex-col gap-4">
              {CHANGELOG.map((r, i) => (
                <li key={r.version}>
                  <div className="flex items-baseline justify-between text-[11px] text-hq-mute">
                    <span className={cn("font-semibold tabular-nums", i === 0 && "text-hq-accent")}>
                      v{r.version}
                      {i === 0 && <span className="ml-1.5 font-normal">Latest</span>}
                    </span>
                    <time dateTime={r.date}>{DATE.format(new Date(r.date))}</time>
                  </div>
                  <h2 className="mt-1 text-[13px] font-semibold text-hq-ink">{r.title}</h2>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-snug text-hq-mute marker:text-hq-line">
                    {r.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
