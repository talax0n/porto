import { Vector3 } from "three";
import { INTRO } from "@/data/onboarding";
import type { StationId } from "@/data/stations";
import { dirAt, flatten } from "./scene/planet";

interface Progress {
  visited: ReadonlySet<StationId>;
  /** villager ids the player has bumped into */
  met: ReadonlySet<number>;
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
  | { type: "hydrate"; visited: readonly StationId[]; met: readonly number[]; introSeen: boolean };

/** Every visit starts mid-drop; hydration turns it into the intro for first-time visitors. */
export const initialState: GameState = { mode: "landing", visited: new Set(), met: new Set() };

const progress = ({ visited, met }: GameState): Progress => ({ visited, met });

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "approach":
      if (state.mode !== "exploring" || state.near === action.id) return state;
      return { ...state, near: action.id };
    case "open":
      if (state.mode === "onboarding" || state.mode === "landing") return state;
      return { ...progress(state), mode: "inspecting", station: action.id, visited: new Set(state.visited).add(action.id) };
    case "close":
      if (state.mode === "inspecting") return { mode: "exploring", near: state.station, ...progress(state) };
      if (state.mode === "map") return { mode: "exploring", near: null, ...progress(state) };
      return state;
    case "map":
      if (state.mode === "map") return { mode: "exploring", near: null, ...progress(state) };
      if (state.mode !== "exploring" && state.mode !== "inspecting") return state;
      return { mode: "map", ...progress(state) };
    case "greet":
      if (action.ids.every((id) => state.met.has(id))) return state;
      return { ...state, met: new Set([...state.met, ...action.ids]) };
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
  /** filled by the crowd once it spawns, so the map can chart villagers without importing the scene */
  villagers: readonly { n: Vector3; id: number }[];
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
  zoomMul: 1,
  frozen: false,
  focus: null,
  greeted: [],
  celebrate: { active: false, t: 0 },
  intro: "fall",
  alt: DROP_IN,
  villagers: [],
};

export function setTarget(n: Vector3, station: StationId | null) {
  ctl.target = { n: n.clone().normalize(), station };
}
