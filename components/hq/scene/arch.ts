import { Euler, Quaternion, Vector3 } from "three";
import { PAL, TONE, ball, box, cyl, part, pyramid, rod, slab, type Part, type Vec3 } from "./clay";

const { white, mid } = TONE;
const { slate, wood, woodDark, terracotta, leaf, flower, bulb } = PAL;

const UP = new Vector3(0, 1, 0);
const yawQ = new Quaternion();
const partQ = new Quaternion();
const eul = new Euler();

/** Moves parts modelled facing +Z onto the plinth: turned by `yaw`, then set down at `at`. */
export function turned(parts: Part[], at: Vec3, yaw: number): Part[] {
  yawQ.setFromAxisAngle(UP, yaw);
  return parts.map(({ geo, pos, opts }) => {
    const p = new Vector3(...pos).applyQuaternion(yawQ).add(new Vector3(...at));
    eul.setFromQuaternion(partQ.setFromEuler(eul.set(...(opts.rot ?? [0, 0, 0]))).premultiply(yawQ));
    return part(geo, [p.x, p.y, p.z], { ...opts, rot: [eul.x, eul.y, eul.z] });
  });
}

/** Seeded [0, 1) so scattered flowers and books land the same way every load. */
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export interface WindowOpts {
  /** thickness of the wall it sits in; the glass runs through so both faces show it */
  t?: number;
  frame?: string;
  shutters?: string;
  box?: boolean;
}

/** A framed, crossed window centred at `at` in a wall whose face looks along `yaw`. */
export function casement(at: Vec3, w: number, h: number, yaw: number, { t = 0.14, frame = white, shutters, box: planter }: WindowOpts = {}): Part[] {
  const d = t + 0.05;
  const parts: Part[] = [
    part(slab(w, h, t + 0.01), [0, 0, 0], { tone: "#b9dcea", surf: "glass" }),
    part(slab(w + 0.12, 0.06, d), [0, h / 2 + 0.03, 0], { tone: frame, surf: "wood" }),
    part(slab(w + 0.18, 0.05, t + 0.14), [0, -h / 2 - 0.025, 0], { tone: frame, surf: "wood" }),
    part(slab(0.05, h, d), [-w / 2 - 0.025, 0, 0], { tone: frame, surf: "wood" }),
    part(slab(0.05, h, d), [w / 2 + 0.025, 0, 0], { tone: frame, surf: "wood" }),
    part(slab(0.025, h, t + 0.03), [0, 0, 0], { tone: frame }),
    part(slab(w, 0.025, t + 0.03), [0, 0, 0], { tone: frame }),
  ];
  if (shutters)
    for (const s of [-1, 1]) {
      parts.push(part(slab(w * 0.42, h + 0.02, 0.03), [s * (w * 0.71 + 0.05), 0, t / 2 + 0.02], { tone: shutters, surf: "wood" }));
    }
  if (planter) {
    parts.push(part(slab(w + 0.1, 0.1, 0.12), [0, -h / 2 - 0.1, t / 2 + 0.08], { tone: woodDark, surf: "wood" }));
    for (let i = 0; i < 4; i++)
      parts.push(part(ball(0.05, 6, 5), [(i / 3 - 0.5) * w, -h / 2 - 0.02, t / 2 + 0.08], { tone: i % 2 ? leaf[1] : flower[i % flower.length] }));
  }
  return turned(parts, at, yaw);
}

/** A plank door with frame, knob, a stone step out front and a lamp over it; `at` is the sill's centre. */
export function door(at: Vec3, w: number, h: number, yaw: number, tone: string = woodDark, t = 0.14): Part[] {
  return turned(
    [
      part(slab(w, h, t + 0.02), [0, h / 2, 0], { tone, surf: "wood" }),
      part(slab(w + 0.12, 0.07, t + 0.06), [0, h + 0.035, 0], { tone: white, surf: "wood" }),
      part(slab(0.06, h, t + 0.06), [-w / 2 - 0.03, h / 2, 0], { tone: white, surf: "wood" }),
      part(slab(0.06, h, t + 0.06), [w / 2 + 0.03, h / 2, 0], { tone: white, surf: "wood" }),
      part(slab(w * 0.5, h * 0.22, 0.02), [0, h * 0.72, t / 2 + 0.01], { tone: "#b9dcea", surf: "glass" }),
      part(ball(0.025, 6, 5), [w * 0.32, h * 0.48, t / 2 + 0.03], { tone: "#f2c14e", surf: "metal" }),
      part(box(w + 0.2, 0.06, 0.22, 0.02), [0, 0.03, t / 2 + 0.11], { tone: mid, surf: "stone" }),
      ...lamp([0, h + 0.18, t / 2 + 0.06]),
    ],
    at,
    yaw,
  );
}

/** A little wall lamp: bracket, glowing bulb, cap. */
const lamp = ([x, y, z]: Vec3): Part[] => [
  part(slab(0.03, 0.03, 0.08), [x, y + 0.06, z - 0.03], { tone: slate, surf: "metal" }),
  part(slab(0.07, 0.08, 0.07), [x, y, z], { tone: bulb, surf: "glow" }),
  part(pyramid(0.11, 0.06), [x, y + 0.07, z], { tone: slate, surf: "metal" }),
];

/** A post lantern standing at `at`. */
export function lantern(at: Vec3, h = 0.9, cap: string = slate): Part[] {
  const [x, y, z] = at;
  return [
    part(slab(0.12, 0.06, 0.12), [x, y + 0.03, z], { tone: mid, surf: "stone" }),
    part(rod(0.022, h), [x, y + h / 2, z], { tone: slate, surf: "metal" }),
    part(slab(0.13, 0.03, 0.13), [x, y + h, z], { tone: slate, surf: "metal" }),
    part(slab(0.1, 0.13, 0.1), [x, y + h + 0.08, z], { tone: bulb, surf: "glow" }),
    part(pyramid(0.17, 0.09), [x, y + h + 0.19, z], { tone: cap, surf: "metal" }),
    part(ball(0.02, 6, 4), [x, y + h + 0.25, z], { tone: cap }),
  ];
}

/** A lumpy shrub of three leaf balls, `s` its rough radius. */
export function shrub(at: Vec3, s = 0.2, k = 0): Part[] {
  const [x, y, z] = at;
  return [
    part(ball(s, 10, 7), [x, y + s * 0.8, z], { tone: leaf[k % 5], surf: "leaf" }),
    part(ball(s * 0.75, 8, 6), [x + s * 0.6, y + s * 0.6, z + s * 0.3], { tone: leaf[(k + 1) % 5], surf: "leaf" }),
    part(ball(s * 0.7, 8, 6), [x - s * 0.5, y + s * 0.55, z - s * 0.35], { tone: leaf[(k + 2) % 5], surf: "leaf" }),
  ];
}

/** A terracotta pot with a leafy plant; `s` scales the whole thing. */
export function potted(at: Vec3, s = 1, k = 0): Part[] {
  const [x, y, z] = at;
  return [
    part(cyl(0.13 * s, 0.1 * s, 0.22 * s), [x, y + 0.11 * s, z], { tone: terracotta }),
    part(cyl(0.145 * s, 0.145 * s, 0.04 * s), [x, y + 0.22 * s, z], { tone: terracotta }),
    part(ball(0.17 * s, 10, 7), [x, y + 0.36 * s, z], { tone: leaf[k % 5], surf: "leaf" }),
    part(ball(0.12 * s, 8, 6), [x + 0.09 * s, y + 0.5 * s, z + 0.04 * s], { tone: leaf[(k + 2) % 5], surf: "leaf" }),
  ];
}

/** A strip of flowers between a and b: stems and blooms in the palette. */
export function flowers(a: Vec3, b: Vec3, n: number, seed = 0): Part[] {
  const parts: Part[] = [];
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    const x = a[0] + (b[0] - a[0]) * f + (rnd(seed + i) - 0.5) * 0.06;
    const z = a[2] + (b[2] - a[2]) * f + (rnd(seed + i + 50) - 0.5) * 0.08;
    const h = 0.1 + rnd(seed + i + 9) * 0.08;
    parts.push(
      part(rod(0.008, h, 4), [x, a[1] + h / 2, z], { tone: leaf[3] }),
      part(ball(0.035, 6, 4), [x, a[1] + h, z], { tone: flower[Math.floor(rnd(seed + i + 3) * flower.length)] }),
    );
    if (i % 2) parts.push(part(ball(0.05, 6, 4), [x, a[1] + 0.03, z], { tone: leaf[i % 5], surf: "leaf", scale: [1, 0.6, 1] }));
  }
  return parts;
}

/** A row of books standing on a shelf at `at`, running along +x. */
export function books(at: Vec3, n: number, seed = 0): Part[] {
  const tones = ["#e9776a", "#8cc6e6", "#f7d26e", "#8fcf9a", "#b9a3e6", "#fbfaf7", "#f29a83"];
  const parts: Part[] = [];
  let x = at[0];
  for (let i = 0; i < n; i++) {
    const w = 0.035 + rnd(seed + i) * 0.03;
    const h = 0.16 + rnd(seed + i + 7) * 0.08;
    parts.push(part(slab(w, h, 0.14), [x + w / 2, at[1] + h / 2, at[2]], { tone: tones[(seed + i) % tones.length], rot: [0, 0, i === n - 1 ? -0.25 : 0] }));
    x += w + 0.008;
  }
  return parts;
}

/** A plank crate. */
export function crate(at: Vec3, s = 0.3, yaw = 0, tone: string = wood): Part[] {
  return turned(
    [
      part(box(s, s, s, 0.02), [0, s / 2, 0], { tone, surf: "wood" }),
      part(slab(s + 0.02, 0.04, s + 0.02), [0, s * 0.15, 0], { tone: woodDark, surf: "wood" }),
      part(slab(s + 0.02, 0.04, s + 0.02), [0, s * 0.85, 0], { tone: woodDark, surf: "wood" }),
    ],
    at,
    yaw,
  );
}

/** A slatted park bench whose seat faces +Z. */
export function bench(at: Vec3, yaw: number, w = 0.8): Part[] {
  const parts: Part[] = [];
  for (const s of [-1, 1])
    parts.push(
      part(slab(0.05, 0.22, 0.3), [s * (w / 2 - 0.06), 0.11, 0], { tone: slate, surf: "metal" }),
      part(slab(0.05, 0.3, 0.05), [s * (w / 2 - 0.06), 0.33, -0.14], { tone: slate, surf: "metal" }),
    );
  for (let i = 0; i < 3; i++) parts.push(part(slab(w, 0.035, 0.08), [0, 0.24, -0.1 + i * 0.1], { tone: wood, surf: "wood" }));
  for (let i = 0; i < 2; i++) parts.push(part(slab(w, 0.07, 0.03), [0, 0.36 + i * 0.1, -0.16], { rot: [-0.15, 0, 0], tone: wood, surf: "wood" }));
  return turned(parts, at, yaw);
}
