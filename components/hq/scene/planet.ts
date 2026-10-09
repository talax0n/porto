import { Matrix4, Quaternion, Vector3 } from "three";
import { STATIONS, type StationId } from "@/data/stations";

/** Planet radius. Every position on it is a unit vector; surface distance is angle times R. */
export const R = 9;
export const NORTH_POLE = new Vector3(0, 1, 0);

const DEG = Math.PI / 180;

export function dirAt(polar: number, azimuth: number, out = new Vector3()): Vector3 {
  const t = polar * DEG;
  const p = azimuth * DEG;
  return out.set(Math.sin(t) * Math.cos(p), Math.cos(t), Math.sin(t) * Math.sin(p));
}

/** Surface distance between two unit positions. */
export const arc = (a: Vector3, b: Vector3) => Math.acos(Math.min(1, Math.max(-1, a.dot(b)))) * R;

/** Projects v onto the tangent plane at n and normalizes it; zero when v is parallel to n. */
export function flatten(v: Vector3, n: Vector3): Vector3 {
  v.addScaledVector(n, -n.dot(v));
  const l = v.length();
  return l > 1e-6 ? v.divideScalar(l) : v.set(0, 0, 0);
}

/** Great-circle tangent at n heading for m. */
export const toward = (n: Vector3, m: Vector3, out: Vector3) => flatten(out.copy(m), n);

const axis = new Vector3();
const q = new Quaternion();

/** Walks n `dist` along tangent `dir`. Tangents that ride along (heading, view north) are carried with it. */
export function walk(n: Vector3, dir: Vector3, dist: number, ...riders: Vector3[]) {
  axis.crossVectors(n, dir);
  if (axis.lengthSq() < 1e-12) return;
  q.setFromAxisAngle(axis.normalize(), dist / R);
  n.applyQuaternion(q).normalize();
  for (const r of riders) flatten(r.applyQuaternion(q), n);
}

const side = new Vector3();

/** Local frame on the surface: +Y along the normal, +Z along `fwd`, origin `lift` above the ground. */
export function frameAt(n: Vector3, fwd: Vector3, out: Matrix4, lift = 0, scale = 1): Matrix4 {
  side.crossVectors(n, fwd);
  out.makeBasis(side, n, fwd);
  if (scale !== 1) out.scale(side.set(scale, scale, scale));
  return out.setPosition(n.x * (R + lift), n.y * (R + lift), n.z * (R + lift));
}

/** Point offset from n by local tangent distances (right, forward), measured along the surface. */
function offset(n: Vector3, fwd: Vector3, right: number, forward: number): Vector3 {
  const out = n.clone();
  const dir = new Vector3().crossVectors(n, fwd).multiplyScalar(right).addScaledVector(fwd, forward);
  const d = dir.length();
  if (d > 0) walk(out, dir.divideScalar(d), d);
  return out;
}

export interface Landmark {
  id: StationId;
  n: Vector3;
  /** local +X+Z diagonal (the diorama's open corner) faces the hub */
  frame: Matrix4;
  door: Vector3;
  keeper: Vector3;
  /** keeper's resting heading, looking back toward the hub */
  keeperFacing: Vector3;
}

/** Dioramas were modelled for a flat island; on the planet they shrink so the world reads small. */
export const LANDMARK_SCALE = 0.75;
/** Footprint radius of a plinth, a little past its inscribed circle so corners rarely clip. */
export const FOOTPRINT = 2.15 * LANDMARK_SCALE;
const DOOR = 2.8 * LANDMARK_SCALE;

function landmark(id: StationId, at: [number, number]): Landmark {
  const n = dirAt(...at);
  const hub = toward(n, NORTH_POLE, new Vector3());
  const b = new Vector3().crossVectors(n, hub);
  const z = hub.clone().sub(b).normalize();
  const door = offset(n, hub, 0, DOOR);
  const keeper = offset(n, hub, -0.85, DOOR - 0.25);
  return {
    id,
    n,
    frame: frameAt(n, z, new Matrix4(), 0, LANDMARK_SCALE),
    door,
    keeper,
    keeperFacing: toward(keeper, NORTH_POLE, new Vector3()),
  };
}

export const LANDMARKS = Object.fromEntries(STATIONS.map((s) => [s.id, landmark(s.id, s.at)])) as Record<
  StationId,
  Landmark
>;

export interface Obstacle {
  n: Vector3;
  r: number;
}

/** Mutable: props.ts appends trees and lamps once their scatter is generated. */
export const OBSTACLES: Obstacle[] = STATIONS.map((s) => ({ n: LANDMARKS[s.id].n, r: FOOTPRINT }));

const away = new Vector3();
const perp = new Vector3();
const toGoal = new Vector3();

/**
 * Bends a desired tangent direction around obstacles: inward motion is cancelled close to an
 * edge and turned into a slide, so a straight great-circle walk flows around landmarks.
 * Returns how hard the walker is pressed against something (0 free, 1 touching).
 */
export function steer(n: Vector3, dir: Vector3, radius: number, goal: Vector3 | null): number {
  let pressed = 0;
  for (const o of OBSTACLES) {
    const reach = o.r + radius;
    const cos = n.dot(o.n);
    if (cos < Math.cos((reach + 1.2) / R)) continue;
    const d = Math.acos(Math.min(1, cos)) * R;
    const w = Math.min(1, Math.max(0, 1 - (d - reach) / 1.2));
    toward(n, o.n, away).negate();
    const into = -dir.dot(away);
    if (into <= 0 || w === 0) continue;
    // a goal nearer than the obstacle's edge needs no detour
    if (goal && arc(n, goal) < d - reach) continue;
    dir.addScaledVector(away, into * w);
    perp.crossVectors(n, away);
    if (goal && toward(n, goal, toGoal).dot(perp) < 0) perp.negate();
    dir.addScaledVector(perp, into * w * 0.6);
    flatten(dir, n);
    pressed = Math.max(pressed, w);
  }
  return pressed;
}

/** Hard constraint after a step: pops a walker back out of any footprint it slid into. */
export function resolve(n: Vector3, radius: number, ...riders: Vector3[]) {
  for (const o of OBSTACLES) {
    const reach = o.r + radius;
    const d = arc(n, o.n);
    if (d >= reach) continue;
    toward(n, o.n, away).negate();
    if (away.lengthSq() === 0) continue;
    walk(n, away, reach - d, ...riders);
  }
}
