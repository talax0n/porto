import { Vector3 } from "three";
import type { Agent, Pulse } from "@/data/pulse";
import { PLACES, PLINTH_HEIGHT, type Place, type Spot } from "./dioramas";
import { RADIUS, VILLAGERS, type Post, type Villager } from "./folk";
import { LANDMARKS, R, type Landmark, arc, flatten, footprintAt, resolve, toward, walk } from "./planet";
import { scatter } from "./props";

type Job = Exclude<Place, "bed">;
interface Seat {
  place: Job;
  i: number;
}

/** What each villager is up to. Agents only ever enter through `reconcile`; the frame loop only advances arrivals and wake-ups. */
export type Activity =
  /** no agent: the slot is empty and nothing is drawn */
  | { s: "wander" }
  /** every spot is taken, so it waits at the door of the place it was picked for */
  | { s: "loiter"; agent: Agent; job: Job }
  | { s: "commute"; agent: Agent; seat: Seat }
  | { s: "work"; agent: Agent; seat: Seat }
  | { s: "bedtime"; agent: Agent; bed: number }
  | { s: "asleep"; agent: Agent; bed: number; since: number };

/** seconds a finished agent's villager sleeps before its slot empties */
const NAP = 180;
/** how close counts as there; the villager then settles the rest of the way in */
const ARRIVED = 0.45;
/** how high a new agent's villager starts its fall, and how much higher each one after it in the same pulse */
const SKY = 12;
const STAGGER = 2.5;

const WANDER: Activity = { s: "wander" };
const OTHER: Record<Job, Job> = { desk: "gym", gym: "desk" };
const HOME = Object.fromEntries(Object.entries(PLACES).map(([p, { station }]) => [p, LANDMARKS[station]])) as Record<
  Place,
  Landmark
>;

function post(l: Landmark, s: Spot): Post {
  const p = new Vector3(s.at[0], PLINTH_HEIGHT + s.at[1] + s.up, s.at[2]).applyMatrix4(l.frame);
  const lift = p.length() - R;
  const n = p.normalize();
  const heading = flatten(new Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw)).transformDirection(l.frame), n);
  return { n, heading, lift, move: s.move, pace: s.pace };
}

/** Every spot in world space, indexed like `PLACES`. */
export const POSTS = Object.fromEntries(
  Object.entries(PLACES).map(([p, { spots }]) => [p, spots.map((s: Spot) => post(HOME[p as Place], s))]),
) as Record<Place, Post[]>;

/** `acts` is indexed like `ctl.villagers`; `rev` bumps on every change so the bubbles know to re-render. */
export const town = { acts: Array.from({ length: VILLAGERS }, (): Activity => WANDER), rev: 0 };

function set(v: number, a: Activity) {
  town.acts[v] = a;
  town.rev++;
}

/** Stable per agent across polls: about two sessions in three get a desk, the rest the gym. */
const jobOf = (id: string): Job => (parseInt(id, 16) % 3 < 2 ? "desk" : "gym");

const held = (a: Activity): a is Extract<Activity, { agent: Agent }> =>
  a.s === "loiter" || a.s === "commute" || a.s === "work";
const inBed = (a: Activity): a is Extract<Activity, { bed: number }> => a.s === "bedtime" || a.s === "asleep";

/** The spot an activity is headed for or holds. */
const spotOf = (a: Activity): { place: Place; i: number } | null =>
  a.s === "commute" || a.s === "work" ? a.seat : inBed(a) ? { place: "bed", i: a.bed } : null;

function free(place: Place): number {
  const taken = (i: number) => town.acts.some((a) => spotOf(a)?.place === place && spotOf(a)?.i === i);
  return POSTS[place].findIndex((_, i) => !taken(i));
}

/** The place it was picked for, else the other one, else the door to wait at. */
function seatFor(agent: Agent, job: Job): Activity {
  for (const place of [job, OTHER[job]]) {
    const i = free(place);
    if (i >= 0) return { s: "commute", agent, seat: { place, i } };
  }
  return { s: "loiter", agent, job };
}

function toBed(v: number, agent: Agent) {
  let bed = free("bed");
  if (bed < 0) {
    // every bed is taken: the longest sleeper gets up for the newcomer, else one still on its way there
    const since = (u: number) => { const a = town.acts[u]; return a.s === "asleep" ? a.since : a.s === "bedtime" ? Number.MAX_VALUE : Infinity; };
    const oldest = town.acts.reduce((best, _, u) => (since(u) < since(best) ? u : best), 0);
    const o = town.acts[oldest];
    if ((o.s === "asleep" || o.s === "bedtime") && oldest !== v) {
      bed = o.bed;
      set(oldest, WANDER);
    }
  }
  set(v, bed < 0 ? WANDER : { s: "bedtime", agent, bed });
}

/** Picks the slot for a new agent: its own sleeper if it is back, else an empty slot, else the longest sleeper. */
function pick(folk: readonly Villager[], id: string, door: Vector3): number {
  const RANK = { wander: 1, asleep: 2, bedtime: 3 } as const;
  let best = -1;
  let bestKey = Infinity;
  folk.forEach((f, v) => {
    const a = town.acts[v];
    if (a.s !== "wander" && a.s !== "asleep" && a.s !== "bedtime") return;
    const key = (a.s !== "wander" && a.agent.id === id ? 0 : RANK[a.s]) * 100 + arc(f.n, door);
    if (key < bestKey) [best, bestKey] = [v, key];
  });
  return best;
}

/** Brings the town in line with a fresh pulse. Idempotent: the same pulse twice changes nothing. */
export function reconcile(pulse: Pulse, folk: readonly Villager[]) {
  let spawned = 0;
  const live = new Map(pulse.agents.filter((a) => a.phase !== "done").map((a) => [a.id, a]));
  town.acts.forEach((a, v) => {
    if (!held(a)) return;
    const next = live.get(a.agent.id);
    if (!next) return toBed(v, a.agent);
    if (JSON.stringify(next) !== JSON.stringify(a.agent)) set(v, { ...a, agent: next });
  });
  town.acts.forEach((a, v) => {
    if (a.s !== "loiter") return;
    const next = seatFor(a.agent, a.job);
    if (next.s !== "loiter") set(v, next);
  });
  for (const agent of live.values()) {
    if (town.acts.some((a) => held(a) && a.agent.id === agent.id)) continue;
    const job = jobOf(agent.id);
    const v = pick(folk, agent.id, HOME[job].door);
    if (v < 0) continue;
    if (town.acts[v].s === "wander") drop(folk[v], HOME[job].door, SKY + STAGGER * spawned++);
    set(v, seatFor(agent, job));
  }
}

const off = new Vector3();
/** An empty slot comes into being in the sky a step from the door it's headed for, then falls. */
function drop(f: Villager, door: Vector3, alt: number) {
  f.n.copy(door);
  walk(f.n, flatten(scatter(Math.random, off), f.n), 0.6 + Math.random() * 0.8);
  resolve(f.n, RADIUS, null);
  toward(f.n, door, f.heading);
  f.goal = f.skip = f.pin = null;
  f.lift = f.speed = f.vy = 0;
  f.alt = alt;
  f.shown = true;
}

/** Per frame: arrivals, wake-ups, and where each villager should be heading right now. */
export function tend(folk: readonly Villager[], now: number) {
  folk.forEach((f, v) => {
    const a = town.acts[v];
    if (a.s === "commute" && arc(f.n, POSTS[a.seat.place][a.seat.i].n) < ARRIVED) set(v, { ...a, s: "work" });
    if (a.s === "bedtime" && arc(f.n, POSTS.bed[a.bed].n) < ARRIVED) set(v, { ...a, s: "asleep", since: now });
    if (a.s === "asleep" && now - a.since > NAP) set(v, WANDER);
    f.shown = town.acts[v].s !== "wander";
    route(f, town.acts[v]);
  });
}

function route(f: Villager, a: Activity) {
  const spot = spotOf(a);
  const target = spot && POSTS[spot.place][spot.i];
  f.pin = a.s === "work" || a.s === "asleep" ? target : null;
  const home = spot ? HOME[spot.place] : a.s === "loiter" ? HOME[a.job] : null;
  // just inside the edge, so a wanderer resting against a footprint doesn't count as on it
  const on = footprintAt(f.n, RADIUS - 0.02);
  if (on && on !== home) {
    // off a plinth by its own door before going anywhere else
    f.goal = on.door;
    f.skip = on.n;
  } else if (!target || !home) {
    f.goal = home?.door ?? null;
    f.skip = null;
  } else {
    const inside = on === home || arc(f.n, home.door) < 0.8;
    f.goal = inside ? target.n : home.door;
    f.skip = inside ? home.n : null;
  }
}

/** Whether someone is at desk i typing, for its screen. */
export const deskAgent = (i: number): Agent | null => {
  const a = town.acts.find((a) => a.s === "work" && a.seat.place === "desk" && a.seat.i === i);
  return a && a.s === "work" ? a.agent : null;
};
