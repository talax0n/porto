import { ArrowUpRight } from "lucide-react";
import { useContributions } from "../contributions";

const RAMP = ["#ececea", "#d3d1cb", "#a7a49c", "#6b6962", "#111111"];

const fmt = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function GithubPanel() {
  const load = useContributions();

  if (load.status !== "ok") {
    return (
      <div className="space-y-3 text-[13px] text-hq-mute">
        <p>{load.status === "loading" ? "Fetching contributions…" : "Contribution graph is unavailable right now."}</p>
        <a href="https://github.com/talax0n" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-hq-accent">
          @talax0n on GitHub <ArrowUpRight className="size-3" />
        </a>
      </div>
    );
  }

  const { data } = load;
  return (
    <div className="space-y-3">
      <p className="text-sm font-light text-hq-mute">
        <strong className="font-semibold text-hq-ink">{data.total.toLocaleString("en-US")} contributions</strong> in the last year.
      </p>
      <div
        className="grid gap-[2px] rounded-2xl border border-hq-line p-2.5"
        style={{ gridTemplateColumns: `repeat(${data.weeks.length}, minmax(0, 1fr))` }}
      >
        {data.weeks.map((week, wi) => (
          <div key={wi} className="grid gap-[2px]">
            {week.map((d) => (
              <span
                key={d.date}
                title={`${d.count} contribution${d.count === 1 ? "" : "s"} on ${fmt(d.date)}`}
                className="aspect-square rounded-[1px]"
                style={{ background: RAMP[d.level] }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[9px] uppercase text-hq-mute">
        Less
        {RAMP.map((c) => (
          <span key={c} className="size-2.5 rounded-[1px]" style={{ background: c }} />
        ))}
        More
        <a href={`https://github.com/${data.username}`} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-hq-accent">
          @{data.username} <ArrowUpRight className="size-3" />
        </a>
      </div>
    </div>
  );
}
