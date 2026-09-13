"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/section-heading";

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

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmt = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function Contributions() {
  const [data, setData] = useState<Calendar | null>(null);

  useEffect(() => {
    fetch("/api/github")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  /* Month label per week column, printed only when the month changes — and only
     if the previous label is far enough back that the two won't collide. */
  const monthLabels = useMemo(() => {
    if (!data) return [];
    let lastMonth = -1;
    let lastLabelAt = -3;
    return data.weeks.map((week, i) => {
      const first = week[0];
      if (!first) return "";
      const m = new Date(first.date + "T00:00:00").getMonth();
      if (m === lastMonth) return "";
      lastMonth = m;
      if (i - lastLabelAt < 3) return "";
      lastLabelAt = i;
      return MONTHS[m];
    });
  }, [data]);

  // No token, GitHub down, or a bad response — say nothing rather than show a broken grid
  if (!data) return null;

  return (
    <section
      id="contributions"
      style={{ padding: "var(--section-y) var(--pad)" }}
      className="[--cell:11px] [--cell-gap:3px] min-[901px]:[--cell:15px] min-[901px]:[--cell-gap:4px]"
    >
      <SectionHeading
        eyebrow="How I spend my week"
        title="Commits"
        aside={
          <a
            href={`https://github.com/${data.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 shrink-0 text-[10px] tracking-[0.12em] whitespace-nowrap text-[var(--muted)] uppercase transition-colors hover:text-[var(--fg)]"
          >
            @{data.username} &rarr;
          </a>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <p className="mb-6 text-[clamp(15px,1.6vw,18px)] font-light text-[var(--muted)]">
          <strong className="font-semibold text-[var(--fg)]">
            {data.total.toLocaleString("en-US")} contributions
          </strong>{" "}
          in the last year.
        </p>

        {/* Own surface, so the heatmap ramp reads consistently over the shader
            background. The grid is wider than a phone — let it scroll inside. */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] p-5 backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-block min-w-full">
            <div className="flex gap-[var(--cell-gap)] pl-[30px]">
              {monthLabels.map((label, i) => (
                <span
                  key={i}
                  className="w-[var(--cell)] shrink-0 text-[9px] tracking-[0.06em] whitespace-nowrap text-[var(--muted)] uppercase"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-1.5 flex gap-[var(--cell-gap)]">
              {/* Mon / Wed / Fri rails, matching GitHub's own labelling */}
              <div className="mr-1 flex w-[26px] shrink-0 flex-col gap-[var(--cell-gap)]">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                  <span
                    key={i}
                    className="h-[var(--cell)] text-[8px] leading-[var(--cell)] text-[var(--muted)]"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {data.weeks.map((week, wi) => (
                <div key={wi} className="flex shrink-0 flex-col gap-[var(--cell-gap)]">
                  {week.map((day) => (
                    <span
                      key={day.date}
                      title={`${day.count} contribution${day.count === 1 ? "" : "s"} on ${fmt(day.date)}`}
                      className="h-[var(--cell)] w-[var(--cell)] rounded-[2px] border border-[var(--border)]"
                      style={{ background: `var(--contrib-${day.level})` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 pl-1 text-[9px] tracking-[0.12em] text-[var(--muted)] uppercase">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="h-[var(--cell)] w-[var(--cell)] rounded-[2px] border border-[var(--border)]"
              style={{ background: `var(--contrib-${l})` }}
            />
          ))}
          More
        </div>
      </motion.div>
    </section>
  );
}
