import assert from "node:assert/strict";
import { streaks } from "../data/github.ts";

const cal = (counts: number[]) => counts.map((count, i) => ({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, count }));

assert.deepEqual(streaks(cal([1, 1, 0, 1, 1, 1]), "2026-01-06"), {
  current: { days: 3, start: "2026-01-04", end: "2026-01-06" },
  longest: { days: 3, start: "2026-01-04", end: "2026-01-06" },
});
assert.deepEqual(
  streaks(cal([1, 1, 0, 1, 1, 0]), "2026-01-06").current,
  { days: 2, start: "2026-01-04", end: "2026-01-05" },
  "a quiet today keeps yesterday's streak alive",
);
assert.equal(streaks(cal([1, 1, 0, 1, 0, 0]), "2026-01-06").current, null, "a quiet yesterday ends it");
assert.deepEqual(streaks(cal([1, 1, 1, 0, 1, 0]), "2026-01-06").longest, { days: 3, start: "2026-01-01", end: "2026-01-03" });
assert.deepEqual(streaks(cal([0, 0, 0]), "2026-01-03"), { current: null, longest: null });
assert.equal(streaks(cal([1, 1, 1]), "2026-01-01").current?.days, 1, "future days are ignored");

console.log("github ok");
