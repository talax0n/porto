import { useState } from "react";
import { Check, ChevronDown, Flame, Footprints, Hand, MapPin, type LucideIcon } from "lucide-react";
import type { Quest, QuestRow } from "@/data/quests";
import type { StationId } from "@/data/stations";
import { cn } from "@/lib/utils";

const ICON: Record<Quest["kind"], LucideIcon> = { meet: Hand, visit: MapPin, walk: Footprints };

interface TodayProps {
  quests: readonly QuestRow[];
  streak: number;
  onTravel: (id: StationId) => void;
}

/** Today's three quests: a card on wide screens, a pill that opens into the card on phones. */
export function Today({ quests, streak, onTravel }: TodayProps) {
  const [open, setOpen] = useState(false);
  const done = quests.filter((q) => q.done).length;
  return (
    <section aria-label="Today's quests" className="pointer-events-auto relative flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="today-quests"
        className="flex min-h-11 items-center gap-1.5 rounded-full border border-hq-line bg-white/90 px-3 text-[11px] font-semibold text-hq-ink backdrop-blur sm:hidden"
      >
        Today <span className="tabular-nums text-hq-accent">{done}/3</span>
        {streak > 0 && <Streak count={streak} />}
        <ChevronDown className={cn("size-3.5 text-hq-mute transition-transform", open && "rotate-180")} />
      </button>
      <div
        id="today-quests"
        className={cn(
          "w-[236px] rounded-2xl border border-hq-line bg-white/90 px-3.5 py-3 backdrop-blur max-sm:absolute max-sm:top-full max-sm:right-0 max-sm:mt-2 max-sm:w-[248px]",
          !open && "max-sm:hidden",
        )}
      >
        <header className="mb-2 flex items-center justify-between text-[11px] tracking-[0.12em] text-hq-mute uppercase">
          <span>
            Today · <span className="tabular-nums text-hq-ink">{done}/3</span>
          </span>
          {streak > 0 && <Streak count={streak} />}
        </header>
        <ul className="flex flex-col gap-2.5">
          {quests.map((q) => (
            <li key={q.quest.kind}>
              <Row row={q} onTravel={onTravel} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Streak({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5 normal-case tracking-normal text-hq-ink" title={`${count}-day streak`}>
      <Flame className="size-3.5 text-[#f08a4b]" aria-hidden />
      <span className="tabular-nums">{count}</span>
      <span className="sr-only">-day streak</span>
    </span>
  );
}

function Row({ row, onTravel }: { row: QuestRow; onTravel: (id: StationId) => void }) {
  const Icon = row.done ? Check : ICON[row.quest.kind];
  const body = (
    <>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full",
          row.done ? "bg-hq-accent text-white" : "bg-hq-bg text-hq-ink",
        )}
      >
        <Icon className="size-3.5" strokeWidth={row.done ? 3 : 2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[12px] leading-tight", row.done ? "text-hq-mute" : "text-hq-ink")}>
          {row.label}
        </span>
        {row.goal > 1 && (
          <span className="mt-1 flex items-center gap-2">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-hq-ink/10">
              <span
                className="block h-full rounded-full bg-hq-accent transition-[width] duration-500"
                style={{ width: `${(row.value / row.goal) * 100}%` }}
              />
            </span>
            <span className="text-[10px] tabular-nums text-hq-mute">
              {row.value}/{row.goal}
            </span>
          </span>
        )}
      </span>
    </>
  );
  const label = `${row.label}, ${row.done ? "done" : `${row.value} of ${row.goal}`}`;
  if (row.quest.kind === "visit" && !row.done) {
    const { station } = row.quest;
    return (
      <button
        type="button"
        onClick={() => onTravel(station)}
        aria-label={`${label}. Go there`}
        className="-mx-1.5 flex w-[calc(100%+12px)] items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-hq-bg pointer-coarse:min-h-11"
      >
        {body}
      </button>
    );
  }
  return (
    <div aria-label={label} role="group" className="flex items-center gap-2.5 py-1">
      {body}
    </div>
  );
}
