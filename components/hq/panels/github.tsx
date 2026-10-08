import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

interface Day {
  date: string;
  count: number;
  level: number;
}

interface Calendar {
  username: string;
  total: number;
  weeks: Day[][];
}

const RAMP = ["rgba(243,230,208,0.07)", "rgba(242,169,59,0.3)", "rgba(242,169,59,0.55)", "rgba(242,169,59,0.78)", "#f2a93b"];

const fmt = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

type Load = { status: "loading" } | { status: "error" } | { status: "ok"; data: Calendar };

export function GithubPanel() {
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    let live = true;
    fetch("/api/github")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Calendar) => live && setLoad({ status: "ok", data }))
      .catch(() => live && setLoad({ status: "error" }));
    return () => {
      live = false;
    };
  }, []);

  if (load.status !== "ok") {
    return (
      <div className="space-y-3 text-[13px] text-hq-cream/70">
        <p>{load.status === "loading" ? "Fetching contributions…" : "Contribution graph is unavailable right now."}</p>
        <a href="https://github.com/talax0n" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-hq-amber">
          @talax0n on GitHub <ArrowUpRight className="size-3" />
        </a>
      </div>
    );
  }

  const { data } = load;
  return (
    <div className="space-y-3">
      <p className="text-sm font-light text-hq-cream/75">
        <strong className="font-semibold text-hq-cream">{data.total.toLocaleString("en-US")} contributions</strong> in the last year.
      </p>
      <div
        className="grid gap-[2px] rounded border border-hq-line bg-black/20 p-2"
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
      <div className="flex items-center gap-1 font-mono text-[9px] uppercase text-hq-cream/60">
        Less
        {RAMP.map((c) => (
          <span key={c} className="size-2.5 rounded-[1px]" style={{ background: c }} />
        ))}
        More
        <a href={`https://github.com/${data.username}`} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 text-hq-amber">
          @{data.username} <ArrowUpRight className="size-3" />
        </a>
      </div>
    </div>
  );
}
