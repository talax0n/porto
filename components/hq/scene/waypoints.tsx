import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  Color,
  DoubleSide,
  type InstancedMesh,
  Matrix4,
  type Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
} from "three";
import { STATIONS, type Station, type StationId } from "@/data/stations";
import { ctl } from "../game";
import { ACCENT, CLAY, box, cone, cyl, merge, part } from "./clay";
import { IDENTITY } from "./dioramas";
import { LANDMARKS, R, arc, frameAt, mapXY, toward, walk } from "./planet";

const N = STATIONS.length;
const TAG_Y = 1.55;
const ARROW_Y = 2.05;
const CHECK_Y = 2;
/** edge arrows: at most today's target plus this many of the nearest unvisited places */
const NEAREST = 3;
const GUIDE_AHEAD = 1.1;
/** a point at height h clears the planet's limb when its angle from the camera is under both horizon angles combined */
const horizon = (d: number) => Math.acos(R / d);
const HORIZON_ARROW = horizon(R + ARROW_Y);
const reduced = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

const arrowGeo = merge([
  part(cone(0.3, 0.42), [0, 0.21, 0], { rot: [Math.PI, 0, 0] }),
  part(cyl(0.13, 0.13, 0.36), [0, 0.58, 0]),
]);
const checkGeo = merge([
  part(box(0.12, 0.3, 0.12, 0.05), [-0.09, 0.14, 0], { rot: [0, 0, 0.75] }),
  part(box(0.12, 0.56, 0.12, 0.05), [0.12, 0.25, 0], { rot: [0, 0, -0.6] }),
]);
const guideShape = new Shape()
  .moveTo(0, 0.42)
  .lineTo(0.3, 0.05)
  .lineTo(0.11, 0.05)
  .lineTo(0.11, -0.32)
  .lineTo(-0.11, -0.32)
  .lineTo(-0.11, 0.05)
  .lineTo(-0.3, 0.05)
  .closePath();
// the shape's +Y becomes the surface frame's forward
const guideGeo = new ShapeGeometry(guideShape).rotateX(Math.PI / 2);
const guideMat = new MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.85, depthWrite: false, side: DoubleSide });

const identity = STATIONS.map((s) => new Color(IDENTITY[s.id].top));
const accent = new Color(ACCENT);
const white = new Color("#ffffff");
const tint = new Color();
const m = new Matrix4();
const s3 = new Vector3();
const p3 = new Vector3();
const fwd = new Vector3();
const camDir = new Vector3();
const ndc = new Vector3();
const at = { x: 0, y: 0 };
const dist = new Float32Array(N);
const ranked = new Float32Array(N);
/** HUD boxes the edge arrows slide around, re-measured every few frames */
let hud: DOMRect[] = [];
let measured = 0;

interface Mark {
  /** 0 an arrow, 1 a check: eased so a fresh visit turns over instead of popping */
  done: number;
  /** offscreen and picked for an edge arrow this frame */
  edge: boolean;
}

const marks: Mark[] = STATIONS.map(() => ({ done: 0, edge: false }));

interface WaypointsProps {
  near: StationId | null;
  inspecting: StationId | null;
  visited: ReadonlySet<StationId>;
  /** today's unfinished visit quest */
  target: StationId | null;
  /** markers stay out of the intro's white sky */
  show: boolean;
}

/**
 * Everything that points at a landmark: a bouncing clay arrow over each one (a check once visited),
 * its name tag, screen-edge arrows for the ones out of view, and a ground arrow while travelling.
 */
export function Waypoints({ near, inspecting, visited, target, show }: WaypointsProps) {
  const arrows = useRef<InstancedMesh>(null);
  const checks = useRef<InstancedMesh>(null);
  const guide = useRef<Mesh>(null);
  const tags = useRef<(HTMLDivElement | null)[]>([]);
  const live = useRef({ near, inspecting, visited, target, show });

  useEffect(() => {
    live.current = { near, inspecting, visited, target, show };
  }, [near, inspecting, visited, target, show]);

  useFrame(({ camera, clock, size }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const { near: talking, inspecting: focus, visited: lit, target: goal, show: on } = live.current;
    const still = !!reduced?.matches;
    const t = clock.elapsedTime;
    const p = ctl.player.n;
    camDir.copy(camera.position).normalize();
    const a = arrows.current;
    const c = checks.current;
    const roaming = on && !ctl.frozen && ctl.intro === "ground";

    for (let i = 0; i < N; i++) {
      const id = STATIONS[i].id;
      const { n } = LANDMARKS[id];
      const mk = marks[i];
      const quest = id === goal;
      mk.done += ((lit.has(id) && !quest ? 1 : 0) - mk.done) * Math.min(1, dt * 6);
      ndc.copy(n).multiplyScalar(R + TAG_Y).project(camera);
      // the top and bottom bands belong to the HUD
      const clear = n.dot(camDir) > 0.5 && ndc.y > -0.72 && ndc.y < 0.72 && Math.abs(ndc.x) < 0.92;
      // looser than a tag: in view whenever the arrow itself clears the horizon and the window
      ndc.copy(n).multiplyScalar(R + ARROW_Y).project(camera);
      const seen =
        Math.acos(n.dot(camDir)) < horizon(camera.position.length()) + HORIZON_ARROW &&
        Math.abs(ndc.x) < 0.95 &&
        ndc.y > -0.85 &&
        ndc.y < 0.9;
      // a keeper's speech bubble owns the screen while it's up
      mk.edge = roaming && !seen && !talking;
      dist[i] = mk.edge && !lit.has(id) && !quest ? arc(p, n) : Infinity;

      const el = tags.current[i];
      if (el) el.style.opacity = on && clear && (!focus || id === focus) ? "1" : "0";

      if (!a || !c) continue;
      toward(n, camera.position, fwd);
      const bob = still ? 0 : Math.sin(t * 3 + i * 1.3) * 0.14 * (1 - mk.done);
      const pulse = quest && !still ? 1 + Math.sin(t * 5) * 0.1 : 1;
      const big = (quest ? 1.4 : 1) * pulse * (on ? 1 : 0);
      frameAt(n, fwd, m, ARROW_Y + bob + (quest ? 0.25 : 0), 1);
      a.setMatrixAt(i, m.scale(s3.setScalar(big * (1 - mk.done) + 1e-4)));
      // unvisited arrows breathe toward white, a soft glow without an emissive material
      const glow = still ? 0.1 : (Math.sin(t * 2.4 + i) * 0.5 + 0.5) * (quest ? 0.35 : 0.2);
      a.setColorAt(i, tint.copy(identity[i]).lerp(white, glow));
      frameAt(n, fwd, m, CHECK_Y, 1);
      c.setMatrixAt(i, m.scale(s3.setScalar((on ? 0.8 : 0) * mk.done + 1e-4)));
    }
    if (a && c) {
      a.instanceMatrix.needsUpdate = true;
      a.instanceColor!.needsUpdate = true;
      c.instanceMatrix.needsUpdate = true;
    }

    // keep only the target and the nearest few unvisited places, so the screen edge stays readable
    ranked.set(dist);
    const cut = ranked.sort()[NEAREST - 1];
    if (roaming && ++measured % 20 === 1) {
      hud = [...document.querySelectorAll("[data-hud]")].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
    }
    ndc.copy(p).multiplyScalar(R).project(camera);
    const px = ((ndc.x + 1) / 2) * size.width;
    const py = ((1 - ndc.y) / 2) * size.height;
    for (let i = 0; i < N; i++) {
      const el = ctl.edges[i];
      if (!el) continue;
      const id = STATIONS[i].id;
      const showEdge = marks[i].edge && (id === goal || dist[i] <= cut);
      el.style.visibility = showEdge ? "visible" : "hidden";
      if (!showEdge) continue;
      mapXY(p, ctl.north, LANDMARKS[id].n, at);
      const bearing = Math.atan2(at.x, at.y);
      const [x, y] = pinToEdge(px, py, Math.sin(bearing), -Math.cos(bearing), size.width, size.height, el);
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      const pointer = el.firstElementChild as HTMLElement | null;
      if (pointer) pointer.style.transform = `rotate(${bearing}rad)`;
    }

    const g = guide.current;
    const tgt = ctl.target;
    if (g) {
      g.visible = roaming && !!tgt && arc(p, tgt.n) > GUIDE_AHEAD + 0.6;
      if (g.visible && tgt) {
        toward(p, tgt.n, fwd);
        p3.copy(p);
        walk(p3, fwd, GUIDE_AHEAD + (still ? 0 : ((t * 1.2) % 1) * 0.3));
        toward(p3, tgt.n, fwd);
        frameAt(p3, fwd, g.matrix, 0.04);
      }
    }
  });

  return (
    <>
      <instancedMesh ref={arrows} args={[arrowGeo, CLAY, N]} frustumCulled={false} />
      <instancedMesh ref={checks} args={[checkGeo, CLAY, N]} frustumCulled={false} onUpdate={paintChecks} />
      <mesh ref={guide} geometry={guideGeo} material={guideMat} matrixAutoUpdate={false} visible={false} renderOrder={2} />
      {STATIONS.map((s, i) => (
        <Tag
          key={s.id}
          station={s}
          near={near === s.id}
          lit={visited.has(s.id)}
          quest={target === s.id}
          bind={(el) => {
            tags.current[i] = el;
          }}
        />
      ))}
    </>
  );
}

function paintChecks(mesh: InstancedMesh) {
  if (mesh.instanceColor) return;
  for (let i = 0; i < N; i++) mesh.setColorAt(i, accent);
  mesh.instanceColor!.needsUpdate = true;
}

const INSET = { top: 92, bottom: 80, side: 12 };

/**
 * Where a ray from (x, y) along (dx, dy) leaves the inset screen; a spot under a HUD box slides
 * along that edge to the nearer side of the box.
 */
function pinToEdge(x: number, y: number, dx: number, dy: number, w: number, h: number, el: HTMLElement) {
  const hw = el.offsetWidth / 2 + 6;
  const hh = el.offsetHeight / 2 + 6;
  const [l, r, t, b] = [INSET.side + hw, w - INSET.side - hw, INSET.top + hh, h - INSET.bottom - hh];
  x = Math.min(r, Math.max(l, x));
  y = Math.min(b, Math.max(t, y));
  let k = Infinity;
  if (dx > 1e-6) k = Math.min(k, (r - x) / dx);
  if (dx < -1e-6) k = Math.min(k, (l - x) / dx);
  if (dy > 1e-6) k = Math.min(k, (b - y) / dy);
  if (dy < -1e-6) k = Math.min(k, (t - y) / dy);
  if (Number.isFinite(k)) [x, y] = [x + dx * k, y + dy * k];
  const side = x <= l + 1 || x >= r - 1;
  for (const box of hud) {
    if (x + hw < box.left || x - hw > box.right || y + hh < box.top || y - hh > box.bottom) continue;
    if (side) {
      const below = box.bottom + hh;
      const above = box.top - hh;
      y = below <= b && (below - y < y - above || above < t) ? below : above;
    } else {
      const after = box.right + hw;
      const before = box.left - hw;
      x = after <= r && (after - x < x - before || before < l) ? after : before;
    }
  }
  return [x, y] as const;
}

interface TagProps {
  station: Station;
  near: boolean;
  lit: boolean;
  quest: boolean;
  bind: (el: HTMLDivElement | null) => void;
}

function Tag({ station, near, lit, quest, bind }: TagProps) {
  const pos = useMemo(() => LANDMARKS[station.id].n.clone().multiplyScalar(R + TAG_Y), [station.id]);
  return (
    <Html position={pos} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={bind}
        style={{ opacity: 0 }}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium text-black transition-[transform,border-color,opacity] max-sm:px-2 max-sm:text-[10px] ${
          near ? "scale-110 border-hq-accent" : quest ? "border-hq-accent" : "border-hq-line"
        }`}
      >
        {lit && <span className="size-1.5 rounded-full bg-hq-accent" />}
        {station.label}
        {quest && <span className="text-[9px] font-semibold tracking-[0.12em] text-hq-accent uppercase">Today</span>}
      </div>
    </Html>
  );
}
