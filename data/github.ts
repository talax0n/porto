export interface Span {
  days: number;
  start: string;
  end: string;
}

/** Days are ISO dates in ascending order. A quiet today does not break the current streak. */
export function streaks(days: { date: string; count: number }[], today: string): { current: Span | null; longest: Span | null } {
  let longest = null as Span | null;
  let run = null as Span | null;
  for (const d of days) {
    if (d.date > today) break;
    if (d.count > 0) {
      run = { days: (run?.days ?? 0) + 1, start: run?.start ?? d.date, end: d.date };
      if (!longest || run.days > longest.days) longest = run;
    } else if (d.date !== today) {
      run = null;
    }
  }
  return { current: run, longest };
}
