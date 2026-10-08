import { useCallback, useEffect, useReducer, useRef } from "react";
import { STATIONS, STATION_BY_ID, type StationId } from "@/data/stations";
import { ctl, gameReducer, setTarget, initialState } from "./game";

const STORAGE_KEY = "hq:visited";
const NEAR_RADIUS = 1.2;
const ARRIVE_RADIUS = 0.3;
const MOVE_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);

export function useHQ() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    ctl.frozen = state.mode === "inspecting";
    ctl.focus = state.mode === "inspecting" ? state.station : null;
  }, [state]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as StationId[];
      dispatch({ type: "hydrate", visited: saved.filter((id) => id in STATION_BY_ID) });
    } catch {
      /* corrupt storage just means a fresh run */
    }
  }, []);

  useEffect(() => {
    if (state.visited.size) localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.visited]));
  }, [state.visited]);

  const travel = useCallback(
    (id: StationId) => {
      if (stateRef.current.mode === "inspecting") dispatch({ type: "close" });
      const [x, z] = STATION_BY_ID[id].position;
      setTarget(x, z, id);
    },
    [],
  );

  // Poll at 10Hz so proximity never touches React from the render loop.
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      if (s.mode !== "exploring") return;
      const { x, z } = ctl.player;
      let near: StationId | null = null;
      let best = NEAR_RADIUS;
      for (const st of STATIONS) {
        const d = Math.hypot(st.position[0] - x, st.position[1] - z);
        if (d < best) [best, near] = [d, st.id];
      }
      if (near !== s.near) dispatch({ type: "approach", id: near });
      const t = ctl.target;
      if (t?.station && Math.hypot(t.x - x, t.z - z) < ARRIVE_RADIUS) {
        ctl.target = null;
        dispatch({ type: "open", id: t.station });
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  const interact = useCallback(() => {
    const s = stateRef.current;
    if (s.mode === "exploring" && s.near) dispatch({ type: "open", id: s.near });
  }, []);

  const activate = useCallback(
    (id: StationId) => {
      const s = stateRef.current;
      if (s.mode === "exploring" && s.near === id) dispatch({ type: "open", id });
      else travel(id);
    },
    [travel],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (MOVE_KEYS.has(e.code)) {
        if (stateRef.current.mode === "exploring") {
          e.preventDefault();
          ctl.keys.add(e.code);
        }
      } else if (e.code === "KeyE" || e.code === "Enter") {
        if (!(e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)) interact();
      } else if (e.code === "Escape") {
        dispatch({ type: "close" });
      } else {
        const st = STATIONS.find((s) => s.hotkey === e.key);
        if (st) travel(st.id);
      }
    };
    const up = (e: KeyboardEvent) => ctl.keys.delete(e.code);
    const clear = () => ctl.keys.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [interact, travel]);

  const close = useCallback(() => dispatch({ type: "close" }), []);

  return { state, travel, activate, close };
}
