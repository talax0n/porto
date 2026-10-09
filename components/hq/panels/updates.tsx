import { CHANGELOG } from "@/data/changelog";
import { cn } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function UpdatesPanel() {
  return (
    <ol className="space-y-5">
      {CHANGELOG.map((r, i) => (
        <li key={r.version}>
          <div className="flex items-baseline justify-between text-[11px] text-hq-mute">
            <span className={cn("font-semibold tabular-nums", i === 0 && "text-hq-accent")}>
              v{r.version}
              {i === 0 && <span className="ml-1.5 font-normal">Latest</span>}
            </span>
            <time dateTime={r.date}>{DATE.format(new Date(r.date))}</time>
          </div>
          <h3 className="mt-1 text-[15px] font-semibold text-hq-ink">{r.title}</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] leading-snug text-hq-mute marker:text-hq-line">
            {r.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
