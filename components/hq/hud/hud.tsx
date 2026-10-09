import { motion } from "framer-motion";
import { STATIONS, type StationId } from "@/data/stations";
import { PROFILE } from "@/data/profile";
import { cn } from "@/lib/utils";
import { VILLAGERS } from "../scene/folk";
import type { Celebration } from "../use-hq";

export function Wordmark() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold leading-none tracking-tight text-hq-ink sm:text-3xl">
        {PROFILE.name}
      </h1>
      <p className="mt-1.5 text-[11px] tracking-[0.12em] text-hq-mute uppercase">{PROFILE.role}</p>
    </div>
  );
}

export function Quest({ visited, met }: { visited: ReadonlySet<StationId>; met: ReadonlySet<number> }) {
  const total = STATIONS.length;
  const done = visited.size >= total;
  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-[11px] tracking-[0.12em] text-hq-mute uppercase">
        {done ? "All lit" : `Light up all ${total}`} · {visited.size}/{total}
      </p>
      <ul className="flex gap-1.5" aria-label={`${visited.size} of ${total} stations visited`}>
        {STATIONS.map((s) => (
          <li
            key={s.id}
            title={s.label}
            className={cn(
              "size-2.5 rounded-full border transition-colors duration-500",
              visited.has(s.id) ? "border-hq-accent bg-hq-accent" : "border-hq-ink/25 bg-transparent",
            )}
          />
        ))}
      </ul>
      <p className="mt-1 text-[11px] tracking-[0.12em] text-hq-mute uppercase" aria-live="polite">
        People met · <span className="tabular-nums text-hq-ink">{met.size}/{VILLAGERS}</span>
      </p>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-hq-ink/10">
        <div
          className="h-full rounded-full bg-hq-accent transition-[width] duration-500"
          style={{ width: `${(met.size / VILLAGERS) * 100}%` }}
        />
      </div>
    </div>
  );
}

const TOASTS: Record<Celebration, string> = {
  stations: "All 7 lit. Thanks for looking around!",
  people: `You met all ${VILLAGERS} villagers. Everyone knows you now.`,
};

export function Toast({ kind }: { kind: Celebration }) {
  return (
    <motion.p
      role="status"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-full bg-hq-accent px-4 py-2 text-[12px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(43,60,255,0.6)]"
    >
      {TOASTS[kind]}
    </motion.p>
  );
}

interface DockProps {
  visited: ReadonlySet<StationId>;
  current: StationId | null;
  onTravel: (id: StationId) => void;
}

export function Dock({ visited, current, onTravel }: DockProps) {
  return (
    <nav aria-label="Stations">
      <ul className="flex overflow-hidden rounded-full border border-hq-line bg-white/90 backdrop-blur">
        {STATIONS.map((s, i) => (
          <li key={s.id} className={cn(i > 0 && "border-l border-hq-line")}>
            <button
              type="button"
              onClick={() => onTravel(s.id)}
              aria-label={s.label}
              aria-current={current === s.id}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-2 text-[11px] text-hq-ink transition-colors hover:bg-hq-bg sm:px-3.5",
                current === s.id && "bg-hq-bg font-semibold",
              )}
            >
              <span className={cn("tabular-nums", visited.has(s.id) ? "text-hq-accent" : "text-hq-mute")}>
                0{s.hotkey}
              </span>
              <span className="hidden lg:inline">{s.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const HINTS: [string, string][] = [
  ["WASD", "walk"],
  ["Click", "go"],
  ["Bump", "say hi"],
  ["E", "open"],
  ["1–7", "jump"],
  ["Esc", "close"],
];

export function Hint() {
  return (
    <ul className="flex gap-3 text-[10px] text-hq-mute max-sm:hidden pointer-coarse:hidden">
      {HINTS.map(([k, v]) => (
        <li key={k}>
          <kbd className="mr-1 rounded border border-hq-line bg-white px-1 py-px font-sans text-hq-ink">{k}</kbd>
          {v}
        </li>
      ))}
    </ul>
  );
}
