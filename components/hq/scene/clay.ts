import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const ACCENT = "#2b3cff";

export const TONE = {
  white: "#fbfaf7",
  light: "#ebe8e2",
  mid: "#d3cfc7",
  dark: "#2c2c2e",
} as const;

/** The one clay material. Per-part tone lives in vertex colours so every static mesh can share it. */
export const CLAY = new MeshStandardMaterial({
  color: "#ffffff",
  vertexColors: true,
  roughness: 0.85,
  metalness: 0,
});

export type Vec3 = [number, number, number];

export interface PartOpts {
  rot?: Vec3;
  scale?: Vec3;
  tone?: string;
}

export interface Part {
  geo: BufferGeometry;
  pos: Vec3;
  opts: PartOpts;
}

export function paint(geo: BufferGeometry, tone: string): BufferGeometry {
  const c = new Color(tone);
  const n = geo.getAttribute("position").count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(arr, i * 3);
  geo.setAttribute("color", new Float32BufferAttribute(arr, 3));
  return geo;
}

const cache = new Map<string, BufferGeometry>();
function shared(key: string, make: () => BufferGeometry) {
  let g = cache.get(key);
  if (!g) cache.set(key, (g = make()));
  return g;
}

// Rounded boxes stay at smoothness 2, props' spheres at 12 segments.
export const box = (w: number, h: number, d: number, r = 0.05) =>
  shared(`b${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)));
export const ball = (r: number, w = 12, h = 9) => shared(`s${r},${w},${h}`, () => new SphereGeometry(r, w, h));
export const cyl = (rt: number, rb: number, h: number) =>
  shared(`c${rt},${rb},${h}`, () => new CylinderGeometry(rt, rb, h, 14));
export const cone = (r: number, h: number) => shared(`n${r},${h}`, () => new ConeGeometry(r, h, 14));
export const ring = (r: number, tube: number, rad = 8, seg = 18) =>
  shared(`t${r},${tube},${rad},${seg}`, () => new TorusGeometry(r, tube, rad, seg));
export const pill = (r: number, len: number, cap = 4, rad = 10) =>
  shared(`p${r},${len},${cap},${rad}`, () => new CapsuleGeometry(r, len, cap, rad));

export const part = (geo: BufferGeometry, pos: Vec3, opts: PartOpts = {}): Part => ({ geo, pos, opts });

const m = new Matrix4();
const q = new Quaternion();
const one = new Vector3(1, 1, 1);

/** Bakes every part's transform and tone into a single geometry: one draw call per station. */
export function merge(parts: Part[], at: Vec3 = [0, 0, 0]): BufferGeometry {
  const baked = parts.map(({ geo, pos, opts }) => {
    q.setFromEuler(new Euler(...(opts.rot ?? [0, 0, 0])));
    m.compose(new Vector3(pos[0] + at[0], pos[1] + at[1], pos[2] + at[2]), q, opts.scale ? new Vector3(...opts.scale) : one);
    return paint(geo.index ? geo.toNonIndexed() : geo.clone(), opts.tone ?? TONE.white).applyMatrix4(m);
  });
  const out = mergeGeometries(baked, false);
  baked.forEach((g) => g.dispose());
  return out;
}
