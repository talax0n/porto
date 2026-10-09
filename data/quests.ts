import { rng } from "@/components/hq/scene/props";
import { STATIONS, type StationId } from "./stations";

export type Quest =
  | { kind: "visit"; station: StationId }
  | { kind: "walk"; steps: number };

/** What the visitor did toward today's quests, kept per local calendar day. */
export interface DayLog {
  /** local date, YYYY-MM-DD */
  date: string;
  opened: readonly StationId[];
  steps: number;
}

/** Consecutive days with every quest done; `last` is the most recent such day. */
export interface Streak {
  count: number;
  last: string | null;
}

/** World units per step: about the character's stride, so a 300-step stroll is about 40 seconds of walking. */
export const STEP = 0.4;

const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => key(new Date());

export function dayBefore(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return key(new Date(y, m - 1, d - 1));
}

export const freshDay = (date: string): DayLog => ({ date, opened: [], steps: 0 });

/** Two different stations and a walk, seeded by the date, so everyone visiting on the same day gets the same three. */
export function questsFor(date: string): readonly Quest[] {
  let seed = 2166136261;
  for (const ch of date) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  const rand = rng(seed);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const first = pick(STATIONS).id;
  return [
    { kind: "visit", station: first },
    { kind: "visit", station: pick(STATIONS.filter((s) => s.id !== first)).id },
    { kind: "walk", steps: pick([200, 300, 400]) },
  ];
}

const VISIT: Record<StationId, string> = {
  about: "Drop by Theo's house",
  projects: "Peek at the Projects desk",
  experience: "Climb the Experience steps",
  skills: "Poke the Skills blocks",
  awards: "Visit the Awards podium",
  github: "Count the GitHub cubes",
  contact: "Stop by the Contact postbox",
};

export function questLabel(q: Quest): string {
  switch (q.kind) {
    case "visit":
      return VISIT[q.station];
    case "walk":
      return `Take a ${q.steps}-step stroll`;
  }
}

export interface QuestRow {
  quest: Quest;
  label: string;
  value: number;
  goal: number;
  done: boolean;
}

export function questRows(log: DayLog): QuestRow[] {
  return questsFor(log.date).map((quest) => {
    const [value, goal] =
      quest.kind === "visit" ? [+log.opened.includes(quest.station), 1] : [Math.min(log.steps, quest.steps), quest.steps];
    return { quest, label: questLabel(quest), value, goal, done: value >= goal };
  });
}

/** The streak after finishing every quest on `date`; finishing the same day twice changes nothing. */
export function extendStreak(streak: Streak, date: string): Streak {
  if (streak.last === date) return streak;
  return { count: streak.last === dayBefore(date) ? streak.count + 1 : 1, last: date };
}

/** A streak survives until the end of the day after its last finished day. */
export const liveStreak = (streak: Streak, date: string) =>
  streak.last === date || streak.last === dayBefore(date) ? streak.count : 0;
