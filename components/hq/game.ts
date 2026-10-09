import { Vector3 } from "three";
import type { StationId } from "@/data/stations";
import { dirAt, flatten } from "./scene/planet";

interface Progress {
  visited: ReadonlySet<StationId>;
  /** villager ids the player has bumped into */
  met: ReadonlySet<number>;
}

export type GameState =
  | ({ mode: "exploring"; near: StationId | null } & Progress)
  | ({ mode: "inspecting"; station: StationId } & Progress);

export type GameAction =
  | { type: "approach"; id: StationId | null }
  | { type: "open"; id: StationId }
  | { type: "close" }
  | { type: "greet"; ids: readonly number[] }
  | { type: "hydrate"; visited: readonly StationId[]; met: readonly number[] };

export const initialState: GameState = {
  mode: "exploring",
  visited: new Set(),
  met: new Set(),
  near: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "approach":
      if (state.mode !== "exploring" || state.near === action.id) return state;
      return { ...state, near: action.id };
    case "open":
      return {
        mode: "inspecting",
        station: action.id,
        visited: new Set(state.visited).add(action.id),
        met: state.met,
      };
    case "close":
      if (state.mode !== "inspecting") return state;
      return { mode: "exploring", visited: state.visited, met: state.met, near: state.station };
    case "greet":
      if (action.ids.every((id) => state.met.has(id))) return state;
      return { ...state, met: new Set([...state.met, ...action.ids]) };
    case "hydrate":
      return {
        ...state,
        visited: new Set([...state.visited, ...action.visited]),
        met: new Set([...state.met, ...action.met]),
      };
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
}

const spawn = dirAt(8, 90);

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
};

export function setTarget(n: Vector3, station: StationId | null) {
  ctl.target = { n: n.clone().normalize(), station };
}
