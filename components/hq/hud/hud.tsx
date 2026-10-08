import { Check, Keyboard } from "lucide-react";
import { useState } from "react";
import { STATIONS, type StationId } from "@/data/stations";
import { cn } from "@/lib/utils";

interface ChipsProps {
  visited: ReadonlySet<StationId>;
  current: StationId | null;
  onTravel: (id: StationId) => void;
}

export function Title() {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <span className="h-px w-8 bg-hq-amber sm:w-24" />
      <h1 className="font-mono text-[11px] tracking-[0.35em] text-hq-amber sm:text-sm">
        THEO HEADQUARTERS
      </h1>
      <span className="h-px w-8 bg-hq-amber sm:w-24" />
    </div>
  );
}

export function Chips({ visited, current, onTravel }: ChipsProps) {
  return (
    <ul className="flex max-w-[min(94vw,760px)] flex-wrap justify-center gap-1.5">
      {STATIONS.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onTravel(s.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border bg-[#24170f]/90 px-2.5 py-1 font-mono text-[10px] text-hq-cream backdrop-blur transition-colors hover:bg-[#33200f] sm:text-[11px]",
              current === s.id ? "border-hq-amber" : "border-hq-line",
            )}
          >
            <span className="size-2 rounded-full" style={{ background: s.accent }} />
            <span className="hidden text-hq-amber/70 sm:inline">{s.hotkey}</span>
            {s.label}
            {visited.has(s.id) && <Check className="size-3 text-[#7bd88f]" aria-label="visited" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Quest({ visited }: { visited: ReadonlySet<StationId> }) {
  const total = STATIONS.length;
  const done = visited.size >= total;
  return (
    <div
      className={cn(
        "w-44 rounded-md border bg-[#24170f]/90 p-3 font-mono backdrop-blur max-sm:w-36 max-sm:p-2",
        done ? "border-[#7bd88f]" : "border-hq-line",
      )}
    >
      <p className="text-[9px] tracking-[0.25em] text-hq-amber/70">QUEST</p>
      <p className="mt-0.5 text-xs text-hq-cream">{done ? "Quest complete ★" : "Explore HQ"}</p>
      <p className="mt-1 text-[10px] text-hq-cream/70">
        {visited.size}/{total} visited
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hq-line">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", done ? "bg-[#7bd88f]" : "bg-hq-amber")}
          style={{ width: `${(visited.size / total) * 100}%` }}
        />
      </div>
      {done && <p className="mt-2 text-[10px] text-[#7bd88f]">You met the whole HQ. Say hi!</p>}
    </div>
  );
}

const HINTS: [string, string][] = [
  ["WASD / ←↑↓→", "move"],
  ["Click / tap", "walk"],
  ["E / Enter", "open"],
  ["Esc", "close"],
  ["1-7", "go to station"],
  ["Wheel", "zoom"],
];

export function Controls() {
  const [open, setOpen] = useState(false);
  return (
    <div className="font-mono text-[10px] text-hq-cream/80">
      <button
        type="button"
        aria-label="Toggle controls"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-hq-line bg-[#24170f]/90 p-2 text-hq-amber backdrop-blur sm:hidden"
      >
        <Keyboard className="size-4" />
      </button>
      <ul
        className={cn(
          "space-y-1 rounded-md border border-hq-line bg-[#24170f]/90 p-3 backdrop-blur max-sm:mt-2",
          open ? "block" : "max-sm:hidden",
        )}
      >
        {HINTS.map(([k, v]) => (
          <li key={k} className="flex gap-3">
            <kbd className="min-w-24 text-hq-amber">{k}</kbd>
            <span>{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
