import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type BufferGeometry, CanvasTexture, Matrix4, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Agent } from "@/data/pulse";
import { PLACES, PLINTH_HEIGHT, SCREEN } from "./dioramas";
import { LANDMARKS } from "./planet";
import { freeze } from "./world";
import { deskAgent } from "./work";

const DESKS = PLACES.desk.spots;
/** every desk's screen is one cell of a shared canvas, so all of them cost one texture and one draw call */
const COLS = 2;
const ROWS = Math.ceil(DESKS.length / COLS);
const W = 256;
const H = Math.round((W * SCREEN.h) / SCREEN.w);
const LINE = 13;
/** redraws a second: scrolling code reads fine at this rate and the upload stays cheap */
const FPS = 8;
const EDITOR = ["#7fb8e6", "#f6b26b", "#b49be0", "#8fcf9a", "#f08a7e", "#d9dde8"];
const reduced = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

/** Cheap integer hash to [0, 1), so line j of a desk always looks the same as it scrolls past. */
function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function screens() {
  const frame = LANDMARKS[PLACES.desk.station].frame;
  const m = new Matrix4();
  const step = new Matrix4();
  return mergeGeometries(
    DESKS.map((s, i) => {
      const g = new PlaneGeometry(SCREEN.w, SCREEN.h);
      const uv = g.getAttribute("uv");
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (col + uv.getX(k)) / COLS, 1 - (row + 1 - uv.getY(k)) / ROWS);
      m.copy(frame)
        .multiply(step.makeTranslation(s.at[0], PLINTH_HEIGHT + s.at[1], s.at[2]))
        .multiply(step.makeRotationY(s.yaw))
        .multiply(step.makeTranslation(...SCREEN.at))
        .multiply(step.makeRotationX(SCREEN.tilt))
        // just proud of the monitor's seat-facing side, turned to face the seat
        .multiply(step.makeTranslation(0, 0, -SCREEN.depth / 2 - 0.004))
        .multiply(step.makeRotationY(Math.PI));
      return g.applyMatrix4(m);
    }),
    false,
  );
}

/** Scrolling code for an editor, a prompt and output for a shell; `tick` is the scroll position. */
function paint(g: CanvasRenderingContext2D, i: number, agent: Agent | null, tick: number) {
  const x0 = (i % COLS) * W;
  const y0 = Math.floor(i / COLS) * H;
  g.save();
  g.beginPath();
  g.rect(x0, y0, W, H);
  g.clip();
  if (!agent) {
    g.fillStyle = "#2c323e";
    g.fillRect(x0, y0, W, H);
    g.restore();
    return;
  }
  const shell = agent.kind === "run";
  g.fillStyle = shell ? "#14171d" : "#1e2330";
  g.fillRect(x0, y0, W, H);
  const px = tick * 4;
  const first = Math.floor(px / LINE);
  const rows = Math.ceil(H / LINE) + 1;
  for (let r = 0; r < rows; r++) {
    const j = first + r;
    const y = y0 + 8 + r * LINE - (px % LINE);
    const seed = i * 7919 + j * 31;
    let x = x0 + (shell ? 10 : 30);
    if (!shell) {
      g.fillStyle = "#3a4152";
      g.fillRect(x0 + 8, y, 12, 6);
      x += Math.floor(hash(seed) * 4) * 12;
    } else if (hash(seed) < 0.3) {
      g.fillStyle = "#8fcf9a";
      g.fillRect(x, y, 8, 6);
      x += 14;
    }
    // the bottom line is still being typed
    const typed = r === rows - 1 ? (px % LINE) / LINE : 1;
    const tokens = 1 + Math.floor(hash(seed + 1) * 4);
    for (let t = 0; t < tokens && x < x0 + W - 10; t++) {
      const w = Math.min((14 + hash(seed + 2 + t) * 46) * typed, x0 + W - 10 - x);
      g.fillStyle = shell ? (t ? "#6d7a94" : "#e8e6e1") : EDITOR[Math.floor(hash(seed + 9 + t) * EDITOR.length)];
      g.fillRect(x, y, w, 6);
      x += w + 6;
    }
  }
  g.restore();
}

let made: { geo: BufferGeometry; mat: MeshBasicMaterial; tex: CanvasTexture; g: CanvasRenderingContext2D } | null = null;
/** Built on first use, in the browser, and kept for the page's life like the crowd's materials. */
function kit() {
  if (made) return made;
  const c = document.createElement("canvas");
  c.width = W * COLS;
  c.height = H * ROWS;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return (made = { geo: screens(), mat: new MeshBasicMaterial({ map: tex, toneMapped: false }), tex, g: c.getContext("2d")! });
}

/** The projects desks' monitors: live code while someone works there, dark otherwise. */
export function Screens() {
  const { geo, mat } = useMemo(() => kit(), []);
  const clock = useRef({ acc: 1, tick: 0, shown: "" });

  useFrame((_, dt) => {
    const c = clock.current;
    c.acc += dt;
    if (c.acc < 1 / FPS) return;
    c.acc = 0;
    const agents = DESKS.map((_, i) => deskAgent(i));
    const key = agents.map((a) => a?.kind ?? "-").join();
    // nobody typing and nothing changed: the dark screens are already drawn
    if (key === c.shown && (reduced?.matches || agents.every((a) => !a))) return;
    c.shown = key;
    if (!reduced?.matches) c.tick++;
    const { g, tex } = kit();
    agents.forEach((a, i) => paint(g, i, a, c.tick + i * 5));
    tex.needsUpdate = true;
  });

  return <mesh ref={freeze} geometry={geo} material={mat} />;
}
