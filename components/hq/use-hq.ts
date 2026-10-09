import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { STATIONS, STATION_BY_ID, type StationId } from "@/data/stations";
import { HOVER, ctl, gameReducer, setTarget, initialState } from "./game";
import { VILLAGERS } from "./scene/folk";
import { LANDMARKS, arc, toward } from "./scene/planet";

const VISITED_KEY = "hq:visited";
const MET_KEY = "hq:met";
const INTRO_KEY = "hq:intro";
/** a step stays up this long before Next works, so a double click can't skip two lines */
const STEP_DWELL = 600;
const NEAR_RADIUS = 1.9;
const ARRIVE_RADIUS = 0.35;
const MOVE_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);
const NEXT_KEYS = new Set(["Enter", "NumpadEnter", "Space"]);

export type Celebration = "stations" | "people";

function load<T>(key: string, keep: (v: unknown) => v is T): T[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(saved) ? saved.filter(keep) : [];
  } catch {
    return [];
  }
}

const isStation = (v: unknown): v is StationId => typeof v === "string" && v in STATION_BY_ID;
const isVillager = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < VILLAGERS;

export function useHQ() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [toast, setToast] = useState<Celebration | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    ctl.frozen = state.mode !== "exploring";
    ctl.focus = state.mode === "inspecting" ? state.station : null;
    if (state.mode === "onboarding") ctl.intro = "hover";
    else if (state.mode === "landing" && ctl.intro === "hover") ctl.intro = "fall";
  }, [state]);

  useEffect(() => {
    const introSeen = localStorage.getItem(INTRO_KEY) === "1";
    // a first visit opens already hanging in the air rather than floating up from the drop-in
    if (!introSeen) {
      ctl.alt = HOVER;
      ctl.player.heading.copy(ctl.north).negate();
    }
    dispatch({ type: "hydrate", visited: load(VISITED_KEY, isStation), met: load(MET_KEY, isVillager), introSeen });
  }, []);

  useEffect(() => {
    if (state.mode === "exploring") localStorage.setItem(INTRO_KEY, "1");
  }, [state.mode]);

  const step = state.mode === "onboarding" ? state.step : -1;
  const stepAt = useRef(0);
  useEffect(() => {
    stepAt.current = performance.now();
  }, [step]);
  const next = useCallback(() => {
    if (performance.now() - stepAt.current >= STEP_DWELL) dispatch({ type: "next" });
  }, []);
  const skip = useCallback(() => dispatch({ type: "skip" }), []);
  const replay = useCallback(() => {
    ctl.target = null;
    ctl.keys.clear();
    dispatch({ type: "replay" });
  }, []);

  const toggleMap = useCallback(() => {
    ctl.keys.clear();
    dispatch({ type: "map" });
  }, []);

  useEffect(() => {
    if (state.visited.size) localStorage.setItem(VISITED_KEY, JSON.stringify([...state.visited]));
  }, [state.visited]);
  useEffect(() => {
    if (state.met.size) localStorage.setItem(MET_KEY, JSON.stringify([...state.met]));
  }, [state.met]);

  const celebrate = useCallback((kind: Celebration) => {
    ctl.celebrate.t = 0;
    ctl.celebrate.active = true;
    setToast(kind);
  }, []);

  // owed only when the last station is lit live, never when a finished run is restored
  const partyOwedRef = useRef(false);
  const open = useCallback((id: StationId) => {
    const { visited } = stateRef.current;
    if (!visited.has(id) && visited.size === STATIONS.length - 1) partyOwedRef.current = true;
    ctl.target = null;
    // face the landmark so the camera frames it from its door, whichever side the player came from
    toward(ctl.player.n, LANDMARKS[id].n, ctl.north);
    dispatch({ type: "open", id });
  }, []);

  // the stations party waits for the last panel to close so it plays out in view
  const close = useCallback(() => {
    const { mode } = stateRef.current;
    if (mode !== "inspecting" && mode !== "map") return;
    dispatch({ type: "close" });
    if (partyOwedRef.current) {
      partyOwedRef.current = false;
      celebrate("stations");
    }
  }, [celebrate]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  const travel = useCallback(
    (id: StationId) => {
      const { mode } = stateRef.current;
      if (mode === "onboarding" || mode === "landing") return;
      close();
      setTarget(LANDMARKS[id].door, id);
    },
    [close],
  );

  // Poll at 10Hz so proximity and greetings never touch React from the render loop.
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      if (ctl.greeted.length) {
        const fresh = ctl.greeted.filter((v) => !s.met.has(v)).length;
        if (s.met.size < VILLAGERS && s.met.size + fresh >= VILLAGERS) celebrate("people");
        dispatch({ type: "greet", ids: ctl.greeted });
        ctl.greeted = [];
      }
      if (s.mode === "landing" && ctl.intro === "ground") dispatch({ type: "landed" });
      if (s.mode !== "exploring") return;
      const p = ctl.player.n;
      let near: StationId | null = null;
      let best = NEAR_RADIUS;
      for (const st of STATIONS) {
        const d = arc(p, LANDMARKS[st.id].door);
        if (d < best) [best, near] = [d, st.id];
      }
      if (near !== s.near) dispatch({ type: "approach", id: near });
      const t = ctl.target;
      if (t?.station && arc(t.n, p) < ARRIVE_RADIUS) open(t.station);
    }, 100);
    return () => clearInterval(id);
  }, [open, celebrate]);

  const interact = useCallback(() => {
    const s = stateRef.current;
    if (s.mode === "exploring" && s.near) open(s.near);
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { mode } = stateRef.current;
      if (mode === "onboarding") {
        if (e.code === "Escape") skip();
        // a focused button already turns Enter and Space into its own click
        else if (e.code === "ArrowRight" || (NEXT_KEYS.has(e.code) && !(e.target instanceof HTMLButtonElement))) {
          e.preventDefault();
          next();
        }
        return;
      }
      if (mode === "landing") return;
      if (e.code === "KeyM") {
        e.preventDefault();
        toggleMap();
      } else if (MOVE_KEYS.has(e.code)) {
        if (stateRef.current.mode === "exploring") {
          e.preventDefault();
          ctl.keys.add(e.code);
        }
      } else if (e.code === "KeyE" || e.code === "Enter") {
        if (!(e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)) interact();
      } else if (e.code === "Escape") {
        close();
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
  }, [interact, travel, close, next, skip, toggleMap]);

  return { state, toast, travel, open, close, next, skip, replay, toggleMap };
}
