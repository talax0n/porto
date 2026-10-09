import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  PlaneGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STATIONS } from "@/data/stations";
import { TONE, ball, box, cone, cyl, merge, paint, part, ring, type Part } from "./clay";
import { PLINTH_SIZE } from "./dioramas";
import { LANDMARKS, LANDMARK_SCALE, NORTH_POLE, OBSTACLES, R, arc, dirAt, frameAt, toward, walk } from "./planet";

const { white, light, mid } = TONE;
export const PASTEL = ["#f6d9cf", "#d8eadc", "#e3dcf2", "#f4ebc6", "#d7e5f3", "#f4d6de"] as const;

/** Deterministic scatter so the planet looks the same on every visit. */
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform random point on the unit sphere. */
export function scatter(rand: () => number, out = new Vector3()): Vector3 {
  const y = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - y * y);
  return out.set(s * Math.cos(a), y, s * Math.sin(a));
}

const tree = (rand: () => number): Part[] => {
  const tone = rand() < 0.55 ? white : PASTEL[Math.floor(rand() * 3)];
  const s = 0.8 + rand() * 0.45;
  if (rand() < 0.35) {
    return [part(ball(0.3, 10, 7), [0, 0.2 * s, 0], { scale: [1.25 * s, 0.85 * s, 1.25 * s], tone })];
  }
  return [
    part(cyl(0.06, 0.09, 0.5 * s), [0, 0.25 * s, 0], { tone: mid }),
    part(ball(0.3, 10, 7), [0, 0.68 * s, 0], { scale: [1.25 * s, 1.35 * s, 1.25 * s], tone }),
    part(ball(0.3, 8, 6), [0.16 * s, 0.52 * s, 0.1 * s], { scale: [0.7 * s, 0.7 * s, 0.7 * s], tone }),
  ];
};

const lamp = (): Part[] => [
  part(cyl(0.09, 0.11, 0.06), [0, 0.03, 0], { tone: mid }),
  part(cyl(0.025, 0.03, 1), [0, 0.5, 0], { tone: mid }),
  part(ball(0.12), [0, 1.06, 0]),
  part(cone(0.13, 0.09), [0, 1.2, 0], { tone: mid }),
];

const bench = (): Part[] => [
  part(box(0.7, 0.06, 0.24, 0.03), [0, 0.22, 0], { tone: light }),
  part(box(0.7, 0.18, 0.05, 0.025), [0, 0.37, -0.1], { tone: light }),
  part(box(0.06, 0.2, 0.2, 0.02), [-0.28, 0.1, 0], { tone: mid }),
  part(box(0.06, 0.2, 0.2, 0.02), [0.28, 0.1, 0], { tone: mid }),
];

const PLAZA = 1.6;
const plaza = (): Part[] => [
  part(cyl(0.6, 0.68, 0.26), [0, 0.13, 0]),
  part(ring(0.56, 0.07), [0, 0.27, 0], { rot: [Math.PI / 2, 0, 0] }),
  part(cyl(0.48, 0.48, 0.04), [0, 0.25, 0], { tone: light }),
  part(cyl(0.04, 0.05, 0.36), [0, 0.42, 0], { tone: mid }),
  part(ball(0.16), [0, 0.66, 0]),
];

const PATH_WIDTH = 0.66;
const PATH_LIFT = 0.025;

/** A flat strip draped along the great circle from a to b. */
function ribbon(a: Vector3, b: Vector3): BufferGeometry {
  const len = arc(a, b);
  const steps = Math.ceil(len / 0.35);
  const n = a.clone();
  const dir = toward(n, b, new Vector3());
  const pos: number[] = [];
  const nor: number[] = [];
  const side = new Vector3();
  for (let i = 0; i <= steps; i++) {
    side.crossVectors(n, dir).multiplyScalar(PATH_WIDTH / 2);
    for (const s of [-1, 1]) {
      pos.push(n.x * (R + PATH_LIFT) + side.x * s, n.y * (R + PATH_LIFT) + side.y * s, n.z * (R + PATH_LIFT) + side.z * s);
      nor.push(n.x, n.y, n.z);
    }
    walk(n, dir, len / steps, dir);
  }
  const idx: number[] = [];
  for (let i = 0; i < steps; i++) {
    const k = i * 2;
    idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setIndex(idx);
  return paint(g.toNonIndexed(), light);
}

/** Lays flat geometry onto the surface at n, bending every vertex down onto the sphere. */
function drape(g: BufferGeometry, n: Vector3, fwd: Vector3, lift: number): BufferGeometry {
  g.applyMatrix4(frameAt(n, fwd, new Matrix4()));
  const p = g.getAttribute("position");
  const v = new Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).setLength(R + lift);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  const nor = g.getAttribute("normal");
  if (nor) for (let i = 0; i < nor.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

function placed(parts: Part[], n: Vector3, fwd: Vector3): BufferGeometry {
  return merge(parts).applyMatrix4(frameAt(n, fwd, new Matrix4()));
}

/** Path start points on the plaza rim and the walkable lines between them and every door. */
const PATHS = STATIONS.map((s) => {
  const door = LANDMARKS[s.id].door;
  const start = NORTH_POLE.clone();
  walk(start, toward(start, door, new Vector3()), PLAZA);
  return [start, door] as const;
});

function nearPath(p: Vector3, clearance: number): boolean {
  const t = new Vector3();
  return PATHS.some(([a, b]) => {
    // distance to the great-circle segment via its plane normal, only between the endpoints
    const pole = t.crossVectors(a, b).normalize();
    const off = Math.abs(Math.asin(Math.min(1, Math.abs(p.dot(pole))))) * R;
    const span = arc(a, b);
    return off < clearance && arc(a, p) < span + clearance && arc(b, p) < span + clearance;
  });
}

const blocked = (p: Vector3, r: number) =>
  arc(p, NORTH_POLE) < PLAZA + r + 0.3 ||
  nearPath(p, PATH_WIDTH / 2 + r) ||
  STATIONS.some(({ id }) => arc(p, LANDMARKS[id].door) < 1.3) ||
  OBSTACLES.some((o) => arc(p, o.n) < o.r + r + 0.15);

export interface Decal {
  n: Vector3;
  fwd: Vector3;
  size: number;
}

interface Prop {
  parts: Part[];
  n: Vector3;
  fwd: Vector3;
}

/** Laid out at import so walkers can steer around props before anything renders. */
const PROPS: Prop[] = [];
const BLOBS: Decal[] = [];
{
  const rand = rng(7);
  const add = (parts: Part[], n: Vector3, fwd: Vector3, r: number) => {
    PROPS.push({ parts, n, fwd });
    OBSTACLES.push({ n, r });
  };

  OBSTACLES.push({ n: NORTH_POLE, r: 0.7 });

  // a lamp beside each path, just past its middle
  for (const [a, b] of PATHS) {
    const p = a.clone();
    const dir = toward(p, b, new Vector3());
    walk(p, dir, arc(a, b) * 0.55, dir);
    walk(p, new Vector3().crossVectors(p, dir), PATH_WIDTH / 2 + 0.3);
    add(lamp(), p, dir, 0.15);
  }

  // a bench in each gap between the paths leaving the plaza, facing the fountain
  const az = STATIONS.map((s) => s.at[1]).sort((a, b) => a - b);
  az.forEach((a, i) => {
    const gap = (az[(i + 1) % az.length] - a + 360) % 360;
    const p = dirAt(((PLAZA + 0.5) / R) * (180 / Math.PI), a + gap / 2);
    add(bench(), p, toward(p, NORTH_POLE, new Vector3()), 0.35);
  });

  for (let tries = 0, trees = 0; trees < 64 && tries < 2000; tries++) {
    const p = scatter(rand);
    if (blocked(p, 0.45)) continue;
    const fwd = toward(p, scatter(rand, new Vector3()), new Vector3());
    add(tree(rand), p, fwd, 0.32);
    BLOBS.push({ n: p, fwd, size: 1.1 });
    trees++;
  }
}

/** The planet, paths, plaza, trees, lamps and benches baked into one clay geometry. */
export function buildGround(): BufferGeometry {
  const disc = new CircleGeometry(PLAZA, 40).rotateX(-Math.PI / 2);
  const parts = [
    paint(new IcosahedronGeometry(R, 18), "#f8f6f1"),
    paint(drape(disc, NORTH_POLE, new Vector3(0, 0, 1), PATH_LIFT + 0.005).toNonIndexed(), light),
    placed(plaza(), NORTH_POLE, new Vector3(0, 0, 1)),
    ...PATHS.map(([a, b]) => ribbon(a, b)),
    ...PROPS.map(({ parts, n, fwd }) => placed(parts, n, fwd)),
  ];
  const ground = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  return ground;
}

/** A square of soft shadow per plinth and a round one under each tree, draped onto the sphere. */
export function buildDecals() {
  const many = (list: Decal[], lift: number) =>
    mergeGeometries(
      list.map(({ n, fwd, size }) => drape(new PlaneGeometry(size, size, 6, 6).rotateX(-Math.PI / 2), n, fwd, lift)),
      false,
    );
  const plinths = STATIONS.map(({ id }) => {
    const { n, frame } = LANDMARKS[id];
    const fwd = new Vector3().setFromMatrixColumn(frame, 2);
    return { n, fwd, size: PLINTH_SIZE * 2 * LANDMARK_SCALE };
  });
  return { squares: many(plinths, 0.03), rounds: many(BLOBS, 0.035) };
}

export function softSquare(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.shadowColor = "#000";
  g.shadowBlur = 22;
  g.shadowOffsetX = 1000;
  g.fillStyle = "#000";
  g.beginPath();
  g.roundRect(32 - 1000, 32, 64, 64, 10);
  g.fill();
  return new CanvasTexture(c);
}

export function blobTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(40,34,24,0.55)");
  grad.addColorStop(1, "rgba(40,34,24,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}
