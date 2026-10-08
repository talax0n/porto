import type { StationId } from "@/data/stations";
import { findPath } from "./scene/path";

export type GameState =
  | { mode: "exploring"; visited: ReadonlySet<StationId>; near: StationId | null }
  | { mode: "inspecting"; station: StationId; visited: ReadonlySet<StationId> };

export type GameAction =
  | { type: "approach"; id: StationId | null }
  | { type: "open"; id: StationId }
  | { type: "close" }
  | { type: "hydrate"; visited: readonly StationId[] };

export const initialState: GameState = {
  mode: "exploring",
  visited: new Set(),
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
      };
    case "close":
      if (state.mode !== "inspecting") return state;
      return { mode: "exploring", visited: state.visited, near: state.station };
    case "hydrate":
      return { ...state, visited: new Set([...state.visited, ...action.visited]) };
  }
}

/**
 * Mutable per-frame state shared between the DOM layer and the r3f scene. A module singleton
 * (never React state) so frame loops and key handlers touch it without re-rendering.
 */
export interface Controls {
  player: { x: number; z: number; heading: number };
  target: { x: number; z: number; station: StationId | null } | null;
  /** waypoints toward `target`, consumed front first */
  path: [number, number][];
  keys: Set<string>;
  zoomMul: number;
  frozen: boolean;
  focus: StationId | null;
}

export const ctl: Controls = {
  player: { x: 0, z: 0, heading: Math.PI / 4 },
  target: null,
  path: [],
  keys: new Set(),
  zoomMul: 1,
  frozen: false,
  focus: null,
};

export function setTarget(x: number, z: number, station: StationId | null) {
  ctl.target = { x, z, station };
  ctl.path = findPath(ctl.player.x, ctl.player.z, x, z);
}
