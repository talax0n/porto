import { Color, type ColorRepresentation, Vector2, Vector3 } from "three";
import { INTRO } from "@/data/onboarding";
import { type DayLog, type Streak, extendStreak, freshDay, questRows } from "@/data/quests";
import type { StationId } from "@/data/stations";
import { VILLAGERS } from "./scene/folk";
import { dirAt, flatten } from "./scene/planet";

interface Progress {
  visited: ReadonlySet<StationId>;
  /** villager ids the player has bumped into */
  met: ReadonlySet<number>;
  /** null until hydration reads the visitor's clock, so the server never renders a date */
  daily: DayLog | null;
  streak: Streak;
}

export type GameState =
  /** the player character talks the visitor through INTRO[step], hanging above the planet */
  | ({ mode: "onboarding"; step: number } & Progress)
  /** dropping onto the planet; the scene owns the fall and reports touchdown with `landed` */
  | ({ mode: "landing" } & Progress)
  | ({ mode: "exploring"; near: StationId | null } & Progress)
  | ({ mode: "inspecting"; station: StationId } & Progress)
  /** the full map, a modal over a paused world: walking under it would move the very thing it charts */
  | ({ mode: "map" } & Progress);

export type GameAction =
  | { type: "approach"; id: StationId | null }
  | { type: "open"; id: StationId }
  | { type: "close" }
  | { type: "map" }
  | { type: "greet"; ids: readonly number[] }
  | { type: "next" }
  | { type: "skip" }
  | { type: "landed" }
  | { type: "replay" }
  | { type: "walk"; steps: number }
  /** the local date rolled over while the page was open */
  | { type: "day"; date: string }
  | {
      type: "hydrate";
      visited: readonly StationId[];
      met: readonly number[];
      introSeen: boolean;
      daily: DayLog;
      streak: Streak;
    };

/** Every visit starts mid-drop; hydration turns it into the intro for first-time visitors. */
export const initialState: GameState = {
  mode: "landing",
  visited: new Set(),
  met: new Set(),
  daily: null,
  streak: { count: 0, last: null },
};

const progress = ({ visited, met, daily, streak }: GameState): Progress => ({ visited, met, daily, streak });

const logged = (state: GameState, change: (log: DayLog) => Partial<DayLog>): GameState =>
  state.daily ? { ...state, daily: { ...state.daily, ...change(state.daily) } } : state;

/** Whatever moved today's log, the streak follows from it rather than from each action. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = step(state, action);
  const log = next.daily;
  if (!log || log === state.daily || next.streak.last === log.date) return next;
  if (!questRows(log, VILLAGERS - next.met.size).every((r) => r.done)) return next;
  return { ...next, streak: extendStreak(next.streak, log.date) };
}

function step(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "approach":
      if (state.mode !== "exploring" || state.near === action.id) return state;
      return { ...state, near: action.id };
    case "open": {
      if (state.mode === "onboarding" || state.mode === "landing") return state;
      const opened = logged(state, (l) => (l.opened.includes(action.id) ? {} : { opened: [...l.opened, action.id] }));
      return { ...progress(opened), mode: "inspecting", station: action.id, visited: new Set(state.visited).add(action.id) };
    }
    case "close":
      if (state.mode === "inspecting") return { mode: "exploring", near: state.station, ...progress(state) };
      if (state.mode === "map") return { mode: "exploring", near: null, ...progress(state) };
      return state;
    case "map":
      if (state.mode === "map") return { mode: "exploring", near: null, ...progress(state) };
      if (state.mode !== "exploring" && state.mode !== "inspecting") return state;
      return { mode: "map", ...progress(state) };
    case "greet": {
      const fresh = new Set(action.ids.filter((id) => !state.met.has(id)));
      if (!fresh.size) return state;
      return { ...logged(state, (l) => ({ met: l.met + fresh.size })), met: new Set([...state.met, ...fresh]) };
    }
    case "walk":
      return logged(state, (l) => ({ steps: l.steps + action.steps }));
    case "day":
      if (!state.daily || state.daily.date === action.date) return state;
      return { ...state, daily: freshDay(action.date) };
    case "next":
      if (state.mode !== "onboarding") return state;
      if (state.step + 1 < INTRO.length) return { ...state, step: state.step + 1 };
      return { mode: "landing", ...progress(state) };
    case "skip":
      if (state.mode !== "onboarding") return state;
      return { mode: "landing", ...progress(state) };
    case "landed":
      if (state.mode !== "landing") return state;
      return { mode: "exploring", near: null, ...progress(state) };
    case "replay":
      if (state.mode !== "exploring") return state;
      return { mode: "onboarding", step: 0, ...progress(state) };
    case "hydrate": {
      const restored: Progress = {
        visited: new Set([...state.visited, ...action.visited]),
        met: new Set([...state.met, ...action.met]),
        daily: action.daily,
        streak: action.streak,
      };
      if (!action.introSeen && state.mode === "landing") return { mode: "onboarding", step: 0, ...restored };
      return { ...state, ...restored };
    }
  }
}

/**
 * Mutable per-frame state shared between the DOM layer and the r3f scene. A module singleton
 * (never React state) so frame loops and key handlers touch it without re-rendering.
 */
export interface Controls {
  /** unit position on the planet and the unit tangent the character faces */
  player: { n: Vector3; heading: Vector3 };
  /** screen-up as a tangent at the player, carried along as they walk so the view never spins */
  north: Vector3;
  /** a great-circle walk toward a surface point, optionally ending at a station door */
  target: { n: Vector3; station: StationId | null } | null;
  keys: Set<string>;
  /** the touch joystick: screen-right and screen-up in [-1, 1], length ≤ 1, dead zone already applied */
  stick: { x: number; y: number };
  zoomMul: number;
  frozen: boolean;
  focus: StationId | null;
  /** greetings since the last 10Hz poll, drained into the reducer */
  greeted: number[];
  /** celebration clock, advanced by the scene */
  celebrate: { active: boolean; t: number };
  /** the player's drop: hover while the intro talks, fall when the state machine says land */
  intro: "hover" | "fall" | "ground";
  /** player's height above the ground, in world units */
  alt: number;
  /** distance walked since the last 10Hz poll, drained into today's steps */
  walked: number;
  /** filled by the crowd once it spawns, so the map can chart villagers without importing the scene */
  villagers: readonly { n: Vector3; id: number }[];
  /** screen-edge arrows by STATIONS index; the HUD renders them and the scene moves them each frame */
  edges: (HTMLElement | null)[];
  /** the one move-command marker; a new click rewrites it in place */
  ping: { n: Vector3; t: number; kind: "move" | "deny"; color: Color };
  /**
   * The map's orbit view. `dir` points from the planet centre to the camera, `up` is screen-up,
   * `spin` is drag inertia in rad/s about screen-up and screen-right, `t` how far the camera has flown out.
   */
  globe: { open: boolean; t: number; dir: Vector3; up: Vector3; spin: Vector2 };
  /** the minimap button; while it's mounted the scene paints the live planet under it */
  minimap: HTMLElement | null;
}

const spawn = dirAt(8, 90);
/** returning visitors drop from just above, which also hides the spawn */
export const DROP_IN = 1.6;
export const HOVER = 4.6;

export const ctl: Controls = {
  player: { n: spawn, heading: flatten(new Vector3(0, 0, -1), spawn) },
  north: flatten(new Vector3(0, 0, -1), spawn),
  target: null,
  keys: new Set(),
  stick: { x: 0, y: 0 },
  zoomMul: 1,
  frozen: false,
  focus: null,
  greeted: [],
  celebrate: { active: false, t: 0 },
  intro: "fall",
  alt: DROP_IN,
  walked: 0,
  villagers: [],
  edges: [],
  ping: { n: new Vector3(), t: -Infinity, kind: "move", color: new Color() },
  globe: { open: false, t: 0, dir: new Vector3(), up: new Vector3(), spin: new Vector2() },
  minimap: null,
};

/** `t` is performance.now() in seconds, the clock the marker's frame loop reads too. */
export function setPing(n: Vector3, kind: "move" | "deny", color: ColorRepresentation) {
  const p = ctl.ping;
  p.n.copy(n).normalize();
  p.kind = kind;
  p.color.set(color);
  p.t = performance.now() / 1000;
}

export function setTarget(n: Vector3, station: StationId | null) {
  ctl.target = { n: n.clone().normalize(), station };
}
