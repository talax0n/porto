import { type BufferGeometry, type Color, Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { StationId } from "@/data/stations";
import { EXPERIENCE } from "@/data/experience";
import { AWARDS } from "@/data/awards";
import { PAL, TONE, ball, box, cone, cyl, merge, part, pill, ring, type Part, type Vec3 } from "./clay";
import type { Gesture } from "./gesture";

const { white, light, mid } = TONE;
const { slate, terracotta, wood, woodDark, leaf } = PAL;

export interface Identity {
  /** plinth, walls and the keeper's shirt */
  wall: string;
  /** roofs, tops and the keeper's cap */
  top: string;
}

export const IDENTITY: Record<StationId, Identity> = {
  about: { wall: "#f6c09f", top: terracotta },
  projects: { wall: "#a6dcc0", top: "#4f9488" },
  experience: { wall: "#f5dc8a", top: "#e59a5b" },
  skills: { wall: "#cdb8ec", top: "#8f74c9" },
  awards: { wall: "#a9cdee", top: "#f2c14e" },
  github: { wall: "#f4a99a", top: "#c9624f" },
  contact: { wall: "#bcd3a8", top: "#e9776a" },
};

/** Plinth edge per station; projects is the agents' HQ, wide enough for an office, a gym and a nap corner. */
export const PLINTH_SIZE: Record<StationId, number> = {
  about: 3.2,
  projects: 6,
  experience: 3.2,
  skills: 3.2,
  awards: 3.2,
  github: 3.2,
  contact: 3.2,
};
export const PLINTH_HEIGHT = 0.4;
/** The plinth runs this far below the ground so its corners stay buried where the planet curves away, even the HQ's. */
const SKIRT = 0.9;
const H = Math.PI / 2;

/** Dioramas leave the plinth's front-right corner (x,z > half - 1.05) free for the progress tile. */

/**
 * Somewhere a villager goes to do something. `at` is the furniture's origin on the floor and `up`
 * how high the villager's feet sit above it. `kit` is the furniture in spot space: the villager
 * at the origin facing +Z (lying ones pivot at the feet, so their head points to -Z).
 */
export interface Spot {
  at: Vec3;
  yaw: number;
  up: number;
  move: Gesture;
  /** walk-cycle speed played in place, for the treadmill */
  pace?: number;
  kit: (c: Identity) => Part[];
  /** the furniture's moving parts, in spot space, driven by whoever is at the spot */
  rigs?: Rig[];
}

/** What a rig is posed from this frame. */
export interface Drive {
  /** the occupant's gesture clock while someone is at the rig's spot, else the scene clock */
  t: number;
  busy: boolean;
  /** 1 normally, 0 under reduced motion, as in gesture.ts */
  m: number;
  /** agents live right now */
  live: number;
}

/**
 * A moving piece of furniture: `parts` are modelled around a pivot at `at`, and copy k of them
 * is drawn at `pose`, a pivot-space transform written into `out` without allocating.
 */
export interface Rig {
  at: Vec3;
  parts: (c: Identity) => Part[];
  /** copies sharing the parts, like a belt's slats or a rack's LEDs */
  count?: number;
  pose(d: Drive, k: number, out: Matrix4): void;
  /** multiplies copy k's clay colour */
  tint?(d: Drive, k: number, out: Color): void;
}

const UP = new Vector3(0, 1, 0);
const yawQ = new Quaternion();
const partQ = new Quaternion();
const eul = new Euler();

/** Moves spot-space parts onto the plinth: turned by `yaw`, then set down at `at`. */
function turned(parts: Part[], at: Vec3, yaw: number): Part[] {
  yawQ.setFromAxisAngle(UP, yaw);
  return parts.map(({ geo, pos, opts }) => {
    const p = new Vector3(...pos).applyQuaternion(yawQ).add(new Vector3(...at));
    eul.setFromQuaternion(partQ.setFromEuler(eul.set(...(opts.rot ?? [0, 0, 0]))).premultiply(yawQ));
    return part(geo, [p.x, p.y, p.z], { ...opts, rot: [eul.x, eul.y, eul.z] });
  });
}

/** Monitor centre and tilt in desk spot space; workplaces.tsx draws the live screen on its seat-facing side. */
export const SCREEN = { at: [0, 0.8, 0.68] as Vec3, tilt: 0.1, depth: 0.05, w: 0.54, h: 0.32 };

const tmp = new Matrix4();
const frac = (x: number) => x - Math.floor(x);
/** crowd.tsx eases a villager toward its work pose at 4/s, so the body trails a gesture's sine at rate w by this phase */
const lag = (w: number) => Math.atan(w / 4);

/** Seat 0.24 up, desk and monitor ahead; the seat itself is the chair rig. */
const desk = ({ top }: Identity): Part[] => [
  part(cyl(0.12, 0.14, 0.03), [0, 0.015, 0], { tone: mid }),
  part(cyl(0.03, 0.03, 0.2), [0, 0.1, 0], { tone: mid }),
  part(box(0.9, 0.06, 0.5, 0.03), [0, 0.5, 0.52], { tone: white }),
  part(box(0.06, 0.48, 0.44, 0.02), [-0.4, 0.24, 0.52], { tone: top }),
  part(box(0.06, 0.48, 0.44, 0.02), [0.4, 0.24, 0.52], { tone: top }),
  part(box(0.36, 0.02, 0.13, 0.01), [0, 0.54, 0.34], { tone: light }),
  part(cyl(0.03, 0.08, 0.14), [0, 0.6, 0.72], { tone: mid }),
  part(box(0.62, 0.4, SCREEN.depth, 0.03), SCREEN.at, { rot: [SCREEN.tilt, 0, 0], tone: white }),
];

/** swivels a little with the typist's glances, which run on the same clock in gesture.ts */
const chair: Rig = {
  at: [0, 0, 0],
  parts: ({ top }) => [
    part(cyl(0.2, 0.2, 0.06), [0, 0.21, 0], { tone: top }),
    part(box(0.32, 0.22, 0.05, 0.025), [0, 0.37, -0.2], { tone: top }),
  ],
  pose: ({ t, busy, m }, _, out) => void out.makeRotationY(busy ? Math.sin(t * 0.7 - lag(0.7)) * 0.3 * m : 0),
};

const SLATS = 7;
const BELT = 1.05;
const treadmill = ({ top }: Identity): Part[] => [
  part(box(0.56, 0.1, 1.15, 0.04), [0, 0.05, 0.1], { tone: mid }),
  part(box(0.48, 0.015, 1.08, 0.005), [0, 0.1, 0.08], { tone: slate }),
  part(box(0.05, 0.8, 0.05, 0.02), [-0.25, 0.5, 0.62], { tone: mid }),
  part(box(0.05, 0.8, 0.05, 0.02), [0.25, 0.5, 0.62], { tone: mid }),
  part(box(0.6, 0.12, 0.2, 0.04), [0, 0.92, 0.62], { rot: [-0.4, 0, 0], tone: top }),
  part(cyl(0.025, 0.025, 0.55), [0, 0.78, 0.5], { rot: [0, 0, H], tone: slate }),
];

/** Slats run back under the runner's feet and wrap round to the front. */
const belt: Rig = {
  at: [0, 0.115, 0.08],
  count: SLATS,
  parts: () => [part(box(0.46, 0.02, BELT / SLATS - 0.03, 0.008), [0, 0, 0], { tone: "#5b6474" })],
  pose: ({ t, busy, m }, k, out) =>
    void out.makeTranslation(0, 0, BELT / 2 - frac(k / SLATS + (busy ? t * 1.3 * m : 0)) * BELT),
};

/** Lying: feet at the origin, so the bar racks over the chest about 0.45 back. */
const bench = ({ top }: Identity): Part[] => [
  part(box(0.36, 0.08, 1.0, 0.04), [0, 0.3, -0.5], { tone: top }),
  part(box(0.3, 0.26, 0.06, 0.02), [0, 0.13, -0.15], { tone: mid }),
  part(box(0.3, 0.26, 0.06, 0.02), [0, 0.13, -0.9], { tone: mid }),
  part(box(0.05, 0.9, 0.05, 0.02), [-0.4, 0.45, -0.45], { tone: mid }),
  part(box(0.05, 0.9, 0.05, 0.02), [0.4, 0.45, -0.45], { tone: mid }),
];

/** Rides the press gesture's own sine, so the bar is up exactly when the arms are. */
const barbell: Rig = {
  at: [0, 0.86, -0.45],
  parts: () => [
    part(cyl(0.022, 0.022, 1.1), [0, 0, 0], { rot: [0, 0, H], tone: slate }),
    part(cyl(0.16, 0.16, 0.06), [-0.5, 0, 0], { rot: [0, 0, H], tone: slate }),
    part(cyl(0.16, 0.16, 0.06), [0.5, 0, 0], { rot: [0, 0, H], tone: slate }),
  ],
  pose: ({ t, busy, m }, _, out) =>
    void out.makeTranslation(0, busy ? -0.3 + (0.5 + Math.sin(t * 2.6 - lag(2.6)) * 0.5) * m * 0.25 : 0, 0),
};

/** Seated on the saddle 0.42 up, pedalling the flywheel ahead. */
const bike = ({ top }: Identity): Part[] => [
  part(box(0.5, 0.06, 0.14, 0.03), [0, 0.03, -0.3], { tone: mid }),
  part(box(0.5, 0.06, 0.14, 0.03), [0, 0.03, 0.55], { tone: mid }),
  part(box(0.1, 0.06, 0.9, 0.03), [0, 0.06, 0.12], { tone: slate }),
  part(cyl(0.03, 0.03, 0.36), [0, 0.22, -0.05], { rot: [-0.2, 0, 0], tone: mid }),
  part(box(0.24, 0.06, 0.3, 0.03), [0, 0.41, -0.06], { tone: top }),
  part(box(0.09, 0.8, 0.09, 0.03), [0, 0.42, 0.5], { rot: [-0.25, 0, 0], tone: top }),
  part(cyl(0.025, 0.025, 0.44), [0, 0.8, 0.42], { rot: [0, 0, H], tone: slate }),
  part(cyl(0.2, 0.2, 0.07), [0, 0.26, 0.42], { rot: [0, 0, H], tone: slate }),
  part(box(0.16, 0.1, 0.06, 0.02), [0, 0.86, 0.5], { rot: [-0.6, 0, 0], tone: white }),
];

const PEDAL = 6;
/** Cranks turn with the pedal gesture: the left pedal is on top when the left foot lifts. */
const cranks: Rig = {
  at: [0, 0.22, 0.12],
  parts: () => [
    part(cyl(0.05, 0.05, 0.16), [0, 0, 0], { rot: [0, 0, H], tone: slate }),
    part(box(0.03, 0.15, 0.03, 0.01), [-0.1, 0.065, 0], { tone: mid }),
    part(box(0.03, 0.15, 0.03, 0.01), [0.1, -0.065, 0], { tone: mid }),
    part(box(0.1, 0.025, 0.07, 0.01), [-0.15, 0.13, 0], { tone: slate }),
    part(box(0.1, 0.025, 0.07, 0.01), [0.15, -0.13, 0], { tone: slate }),
  ],
  pose: ({ t, busy, m }, _, out) => void out.makeRotationX(busy ? (t * PEDAL - lag(PEDAL) - H) * m : 0),
};

/** Standing in front of a bag on a stand: the bag hangs 0.5 ahead. */
const bagStand = ({ top }: Identity): Part[] => [
  part(cyl(0.26, 0.3, 0.08), [0, 0.04, 0.95], { tone: mid }),
  part(cyl(0.035, 0.035, 1.35), [0, 0.7, 0.95], { tone: slate }),
  part(box(0.06, 0.06, 0.55, 0.02), [0, 1.36, 0.72], { tone: slate }),
  part(cyl(0.012, 0.012, 0.1), [0, 1.29, 0.5], { tone: mid }),
  part(box(0.7, 0.02, 0.7, 0.01), [0, 0.025, 0.15], { tone: top }),
];

const PUNCH = 7;
/** Knocked back by each jab of the punch gesture, a beat after the fist lands. */
const bag: Rig = {
  at: [0, 1.25, 0.5],
  parts: ({ top }) => [
    part(cyl(0.17, 0.17, 0.06), [0, -0.03, 0], { tone: slate }),
    part(pill(0.17, 0.42), [0, -0.42, 0], { tone: terracotta }),
    part(cyl(0.175, 0.175, 0.08), [0, -0.3, 0], { tone: top }),
  ],
  pose: ({ t, busy, m }, _, out) => {
    const hit = busy ? Math.abs(Math.sin(t * PUNCH - lag(PUNCH) - 0.3)) * m : 0;
    out.makeRotationZ(busy ? Math.sin(t * PUNCH - lag(PUNCH) - 0.3) * 0.08 * m : 0).premultiply(tmp.makeRotationX(-0.04 - hit * 0.16));
  },
};

const dumbbell = (x: number, y: number, z: number, tone: string): Part[] => [
  part(cyl(0.025, 0.025, 0.24), [x, y, z], { rot: [0, 0, H], tone: slate }),
  part(ball(0.07), [x - 0.12, y, z], { tone }),
  part(ball(0.07), [x + 0.12, y, z], { tone }),
];

const mat = ({ top }: Identity): Part[] => [
  part(box(0.75, 0.03, 0.95, 0.015), [0, 0.015, 0], { tone: leaf[0] }),
  part(box(0.24, 0.42, 0.75, 0.04), [-0.65, 0.21, 0], { tone: white }),
  ...[-0.22, 0.05, 0.3].flatMap((z, i) => dumbbell(-0.65, 0.48, z, ["#f29a83", top, "#8cc6e6"][i])),
];

/** Lying: feet at the origin, head on the pillow 1.0 back against the headboard. */
const bed = ({ top }: Identity): Part[] => [
  part(box(0.62, 0.22, 1.25, 0.05), [0, 0.11, -0.55], { tone: wood }),
  part(box(0.66, 0.5, 0.07, 0.03), [0, 0.25, -1.18], { tone: woodDark }),
  part(box(0.56, 0.1, 1.15, 0.05), [0, 0.27, -0.55], { tone: white }),
  part(box(0.42, 0.08, 0.22, 0.04), [0, 0.35, -1.0], { tone: light }),
  part(box(0.58, 0.05, 0.55, 0.03), [0, 0.33, -0.2], { tone: top }),
];

/**
 * Every agent lives in the projects HQ: desks in the office at the back, the gym down the right,
 * beds for finished ones in the nap corner at the front left. A spot's index is its identity;
 * desks and gym together seat MAX_AGENTS so nobody waits at the door.
 */
export const PLACES = {
  desk: {
    station: "projects",
    spots: [-1.95, -0.6].flatMap((z) =>
      [-2.3, -1.25, -0.2].map((x): Spot => ({ at: [x, 0, z], yaw: Math.PI, up: 0.24, move: "type", kit: desk, rigs: [chair] })),
    ),
  },
  gym: {
    station: "projects",
    spots: [
      { at: [2.35, 0, -1.6], yaw: Math.PI, up: 0.12, move: "run", pace: 1.6, kit: treadmill, rigs: [belt] },
      { at: [1.55, 0, -1.85], yaw: Math.PI, up: 0.42, move: "pedal", kit: bike, rigs: [cranks] },
      { at: [2.25, 0, 0.35], yaw: 0, up: 0.53, move: "press", kit: bench, rigs: [barbell] },
      { at: [1.45, 0, 1.0], yaw: H, up: 0.02, move: "punch", kit: bagStand, rigs: [bag] },
      { at: [1.2, 0, 2.0], yaw: 0, up: 0.03, move: "lift", kit: mat },
    ],
  },
  bed: {
    station: "projects",
    spots: [0.8, 1.6, 2.4].map((z): Spot => ({ at: [-1.4, 0, z], yaw: H, up: 0.51, move: "sleep", kit: bed })),
  },
} satisfies Record<string, { station: StationId; spots: Spot[] }>;
export type Place = keyof typeof PLACES;

const kits = (place: Place, c: Identity): Part[] => PLACES[place].spots.flatMap((s: Spot) => turned(s.kit(c), s.at, s.yaw));

const RACK: Vec3 = [0.85, 0, -2.55];
const COOLER: Vec3 = [0.85, 0, -1.45];
const COFFEE: Vec3 = [0.85, 0, -0.45];
const FAN: Vec3 = [-0.45, 0, 1.6];
const PLANTS: Vec3[] = [[0.15, 0, 0.55], [0.1, 0, 2.6], [-2.65, 0, -0.05]];

/** Blinks faster the more agents are live; under reduced motion a steady share of lights shows how many. */
const leds: Rig = {
  at: [RACK[0], 0, RACK[2] + 0.26],
  count: 12,
  parts: () => [part(box(0.09, 0.05, 0.02, 0.01), [0, 0, 0], { tone: white })],
  pose: (_, k, out) => void out.makeTranslation(((k % 3) - 1) * 0.14, 0.3 + Math.floor(k / 3) * 0.24, 0),
  tint: ({ t, m, live }, k, out) => {
    const on = m ? hash(k * 131 + Math.floor(t * (1.5 + live * 0.8) + k * 0.37)) < 0.35 + live * 0.05 : k < live;
    out.set(on ? "#8fcf9a" : "#4a5262");
  },
};

const PUFFS = 3;
/** Rise, swell and shrink away above the cup. */
const steam: Rig = {
  at: [COFFEE[0] + 0.1, 0.86, COFFEE[2] + 0.12],
  count: PUFFS,
  parts: () => [part(ball(0.06, 8, 6), [0, 0, 0], { tone: white })],
  pose: ({ t }, k, out) => {
    const p = frac(t * 0.45 + k / PUFFS);
    const s = Math.sin(p * Math.PI) * (0.6 + p * 0.6);
    out.makeScale(s, s, s).setPosition(Math.sin(p * 6 + k) * 0.04, p * 0.45, 0);
  },
};

const BUBBLES = 3;
const bubbles: Rig = {
  at: [COOLER[0], 0.66, COOLER[2] + 0.11],
  count: BUBBLES,
  parts: () => [part(ball(0.035, 8, 6), [0, 0, 0], { tone: "#eaf6fb" })],
  pose: ({ t }, k, out) => {
    const p = frac(t * 0.3 + k / BUBBLES);
    const s = Math.min(1, p * 6, (1 - p) * 6);
    out.makeScale(s, s, s).setPosition((hash(k) - 0.5) * 0.12, p * 0.3, 0);
  },
};

/** The head sweeps side to side and the blades spin on it, so the blades share the head's sweep. */
const sweep = (t: number) => -H + Math.sin(t * 0.6) * 0.7;
const fanHead: Rig = {
  at: [FAN[0], 0.92, FAN[2]],
  parts: () => [
    part(ball(0.08), [0, 0, -0.02], { tone: white }),
    part(ring(0.2, 0.018, 6, 24), [0, 0, 0.08], { tone: mid }),
  ],
  pose: ({ t }, _, out) => void out.makeRotationY(sweep(t)),
};
const blades: Rig = {
  at: [FAN[0], 0.92, FAN[2]],
  parts: ({ top }) =>
    [0, 1, 2].map((i) => {
      const a = (i * 2 * Math.PI) / 3;
      return part(box(0.08, 0.17, 0.015, 0.007), [-Math.sin(a) * 0.09, Math.cos(a) * 0.09, 0.08], { rot: [0, 0, a], tone: top });
    }),
  pose: ({ t }, _, out) => void out.makeRotationZ(t * 9).premultiply(tmp.makeRotationY(sweep(t))),
};

/** Leaves sway on their pots, each out of step with the others. */
const fronds = (at: Vec3, k: number): Rig => ({
  at: [at[0], 0.26, at[2]],
  parts: () => [
    part(ball(0.22), [0, 0.18, 0], { tone: leaf[1] }),
    part(ball(0.16), [0.12, 0.38, 0.06], { tone: leaf[0] }),
    part(ball(0.13), [-0.1, 0.34, -0.08], { tone: leaf[2] }),
  ],
  pose: ({ t }, _, out) => void out.makeRotationZ(Math.sin(t * 1.1 + k * 2) * 0.06).premultiply(tmp.makeRotationX(Math.sin(t * 0.8 + k) * 0.05)),
});

/** The HQ's always-on bits, in plinth space; `t` is the scene clock. */
export const AMBIENCE = {
  station: "projects",
  rigs: [leds, steam, bubbles, fanHead, blades, ...PLANTS.map(fronds)],
} satisfies { station: StationId; rigs: Rig[] };

/** Cheap integer hash to [0, 1). */
export function hash(n: number) {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function about({ wall, top }: Identity): Part[] {
  return [
    part(box(2.7, 0.1, 2.7, 0.04), [-0.1, 0.05, -0.1], { tone: "#e9cfa6" }),
    part(box(2.7, 1.6, 0.14, 0.05), [-0.1, 0.8, -1.4], { tone: wall }),
    part(box(0.14, 1.6, 2.7, 0.05), [-1.4, 0.8, -0.1], { tone: wall }),
    part(box(2.82, 0.12, 0.26, 0.05), [-0.1, 1.64, -1.42], { tone: top }),
    part(box(0.26, 0.12, 2.82, 0.05), [-1.42, 1.64, -0.1], { tone: top }),
    part(box(0.58, 0.48, 0.04, 0.02), [-0.3, 1.05, -1.33], { tone: white }),
    part(box(0.5, 0.4, 0.04, 0.02), [-0.3, 1.05, -1.32], { tone: slate }),
    // desk
    part(box(1.0, 0.08, 0.55, 0.03), [0.6, 0.55, -1.0], { tone: wood }),
    part(box(0.08, 0.5, 0.5, 0.02), [0.15, 0.28, -1.0], { tone: woodDark }),
    part(box(0.08, 0.5, 0.5, 0.02), [1.05, 0.28, -1.0], { tone: woodDark }),
    part(box(0.5, 0.34, 0.05, 0.03), [0.45, 0.84, -1.12], { tone: slate }),
    part(cyl(0.04, 0.05, 0.18), [0.45, 0.65, -1.1], { tone: mid }),
    // lamp
    part(cyl(0.1, 0.12, 0.04), [0.92, 0.61, -1.1], { tone: top }),
    part(cyl(0.015, 0.015, 0.4), [0.92, 0.8, -1.1], { tone: mid }),
    part(cone(0.14, 0.18), [0.92, 1.05, -1.1], { rot: [Math.PI, 0, 0], tone: PAL.bulb }),
    // chair
    part(cyl(0.2, 0.2, 0.07), [0.5, 0.34, -0.45], { tone: top }),
    part(cyl(0.03, 0.03, 0.3), [0.5, 0.17, -0.45], { tone: mid }),
    part(box(0.38, 0.34, 0.06, 0.03), [0.5, 0.58, -0.25], { tone: top }),
    // plant
    part(cyl(0.16, 0.12, 0.26), [1.0, 0.13, 0.15], { tone: terracotta }),
    part(ball(0.2), [1.0, 0.42, 0.15], { tone: leaf[1] }),
    part(ball(0.15), [1.13, 0.62, 0.21], { tone: leaf[0] }),
    part(ball(0.13), [0.9, 0.58, 0.07], { tone: leaf[2] }),
    // a sofa and rug where the reading nook is
    part(cyl(0.75, 0.75, 0.02), [-0.25, 0.11, -0.1], { scale: [1, 1, 0.8], tone: top }),
    part(box(0.55, 0.22, 1.3, 0.06), [-1.0, 0.21, -0.15], { tone: wall }),
    part(box(0.18, 0.55, 1.3, 0.06), [-1.22, 0.42, -0.15], { tone: wall }),
    part(box(0.55, 0.34, 0.16, 0.06), [-1.0, 0.27, -0.88], { tone: wall }),
    part(box(0.55, 0.34, 0.16, 0.06), [-1.0, 0.27, 0.58], { tone: wall }),
    part(box(0.45, 0.08, 0.58, 0.04), [-0.98, 0.35, -0.47], { tone: white }),
    part(box(0.45, 0.08, 0.58, 0.04), [-0.98, 0.35, 0.17], { tone: white }),
    part(box(0.12, 0.26, 0.26, 0.05), [-1.08, 0.5, 0.35], { rot: [0, 0, 0.3], tone: PAL.autumn[0] }),
    part(cyl(0.22, 0.22, 0.05), [-0.2, 0.33, -0.1], { tone: wood }),
    part(cyl(0.04, 0.04, 0.2), [-0.2, 0.2, -0.1], { tone: woodDark }),
    part(cyl(0.05, 0.04, 0.08), [-0.15, 0.4, -0.05], { tone: white }),
  ];
}

const pot = (at: Vec3): Part[] => [
  part(cyl(0.16, 0.12, 0.26), [at[0], 0.13, at[2]], { tone: terracotta }),
  part(cyl(0.05, 0.05, 0.12), [at[0], 0.3, at[2]], { tone: PAL.trunk }),
];

/** The agents' HQ: office floor at the back, gym rubber down the right, a rug in the nap corner. */
function projects(c: Identity): Part[] {
  const { top } = c;
  return [
    part(box(3.3, 0.02, 3.1, 0.01), [-1.25, 0.01, -1.4], { tone: light }),
    part(box(1.75, 0.02, 4.45, 0.01), [2.05, 0.01, -0.7], { tone: "#c3cdd6" }),
    part(box(1.9, 0.02, 2.5, 0.01), [-1.95, 0.01, 1.6], { tone: "#f3d9b8" }),
    ...kits("desk", c),
    ...kits("gym", c),
    ...kits("bed", c),
    // the kitchen strip between office and gym: server rack, water cooler, coffee
    part(box(0.6, 1.3, 0.5, 0.05), [RACK[0], 0.65, RACK[2]], { tone: slate }),
    part(box(0.5, 0.06, 0.4, 0.02), [RACK[0], 1.33, RACK[2]], { tone: top }),
    part(box(0.34, 0.6, 0.32, 0.04), [COOLER[0], 0.3, COOLER[2]], { tone: white }),
    part(cyl(0.14, 0.14, 0.34), [COOLER[0], 0.78, COOLER[2]], { tone: "#a9d8ec" }),
    part(cyl(0.06, 0.08, 0.05), [COOLER[0], 0.97, COOLER[2]], { tone: "#a9d8ec" }),
    part(box(0.06, 0.04, 0.05, 0.01), [COOLER[0], 0.48, COOLER[2] + 0.17], { tone: slate }),
    part(box(0.55, 0.56, 0.45, 0.04), [COFFEE[0], 0.28, COFFEE[2]], { tone: PAL.wood }),
    part(box(0.6, 0.04, 0.5, 0.02), [COFFEE[0], 0.58, COFFEE[2]], { tone: white }),
    part(box(0.26, 0.32, 0.24, 0.04), [COFFEE[0] - 0.08, 0.76, COFFEE[2] - 0.04], { tone: slate }),
    part(box(0.2, 0.04, 0.08, 0.02), [COFFEE[0] - 0.08, 0.86, COFFEE[2] + 0.1], { tone: mid }),
    part(cyl(0.05, 0.04, 0.09), [COFFEE[0] + 0.1, 0.65, COFFEE[2] + 0.12], { tone: top }),
    // the fan's stand; its head and blades are rigs
    part(cyl(0.16, 0.18, 0.04), [FAN[0], 0.02, FAN[2]], { tone: mid }),
    part(cyl(0.025, 0.025, 0.85), [FAN[0], 0.45, FAN[2]], { tone: mid }),
    ...PLANTS.flatMap(pot),
  ];
}

function experience({ wall, top }: Identity): Part[] {
  const n = EXPERIENCE.length;
  const parts: Part[] = [];
  for (let i = 0; i < n; i++) {
    const h = 0.32 * (i + 1);
    // steps climb away from the camera so every riser stays visible
    parts.push(part(box(0.85, h, 1.25, 0.07), [0.55 - i * 0.85, h / 2, -0.35], { tone: i % 2 ? white : wall }));
  }
  const peak = 0.32 * n;
  const x = 0.55 - (n - 1) * 0.85;
  parts.push(
    part(cyl(0.025, 0.025, 0.7), [x, peak + 0.35, -0.5], { tone: slate }),
    part(box(0.4, 0.24, 0.03, 0.02), [x + 0.2, peak + 0.58, -0.5], { tone: top }),
    part(ball(0.17), [x, peak + 0.17, 0.05], { tone: leaf[0] }),
  );
  return parts;
}

const block = (at: Vec3, size: number, tone: string, yaw = 0): Part =>
  part(box(size, size, size, 0.05), at, { rot: [0, yaw, 0], tone });

/** A workbench: the toolbox and pegboard of the trade, and the stack itself as blocks piled up beside it. */
function skills({ wall, top }: Identity): Part[] {
  return [
    part(box(2.7, 0.02, 2.7, 0.01), [-0.1, 0.01, -0.1], { tone: light }),
    part(box(1.7, 0.08, 0.7, 0.03), [-0.25, 0.62, -0.9], { tone: wood }),
    ...[-1.0, 0.5].flatMap((x) => [-1.15, -0.65].map((z) => part(box(0.08, 0.58, 0.08, 0.02), [x, 0.29, z], { tone: woodDark }))),
    part(box(1.6, 0.05, 0.6, 0.02), [-0.25, 0.2, -0.9], { tone: woodDark }),
    part(box(1.7, 0.85, 0.06, 0.02), [-0.25, 1.1, -1.24], { tone: white }),
    part(box(0.07, 0.4, 0.04, 0.02), [-0.8, 1.15, -1.19], { tone: slate }),
    part(ring(0.06, 0.02), [-0.8, 1.38, -1.19], { tone: slate }),
    part(cyl(0.025, 0.025, 0.32), [-0.5, 1.1, -1.19], { tone: wood }),
    part(box(0.18, 0.08, 0.06, 0.02), [-0.5, 1.28, -1.19], { tone: slate }),
    part(box(0.3, 0.06, 0.04, 0.02), [0.1, 1.25, -1.19], { rot: [0, 0, 0.5], tone: top }),
    part(box(0.48, 0.22, 0.26, 0.04), [-0.75, 0.77, -0.85], { tone: top }),
    part(box(0.5, 0.03, 0.28, 0.01), [-0.75, 0.89, -0.85], { tone: wall }),
    part(ring(0.07, 0.015), [-0.75, 0.94, -0.85], { tone: slate }),
    block([0.0, 0.76, -0.85], 0.2, "#8cc6e6", 0.3),
    block([0.25, 0.76, -0.8], 0.2, "#f7d26e", -0.2),
    // the stack, piled up: React, Next, Unity, Docker in clay
    block([0.55, 0.22, 0.05], 0.44, "#8cc6e6"),
    block([0.4, 0.22, -0.42], 0.44, "#f29a83", 0.4),
    block([0.5, 0.62, -0.15], 0.36, top, 0.25),
    block([0.52, 0.94, -0.13], 0.28, "#f7d26e", -0.2),
    block([-0.75, 0.16, 0.25], 0.32, "#8fcf9a", 0.6),
  ];
}

function awards({ top }: Identity): Part[] {
  const wins = Math.min(3, AWARDS.length);
  const steps: [number, number, number][] = [
    [0, 0.95, 1],
    [-0.9, 0.65, 2],
    [0.9, 0.45, 3],
  ];
  const parts: Part[] = [];
  steps.slice(0, wins).forEach(([x, h, place]) => {
    parts.push(
      part(box(0.8, h, 0.8, 0.07), [x, h / 2, -0.4], { tone: place === 1 ? white : light }),
      part(cyl(0.1, 0.06, 0.2), [x, h + 0.13, -0.4], { tone: top }),
      part(ball(0.1), [x, h + 0.33, -0.4], { tone: top }),
      part(ring(0.08, 0.02), [x - 0.12, h + 0.2, -0.4], { rot: [0, 0, H], tone: top }),
      part(ring(0.08, 0.02), [x + 0.12, h + 0.2, -0.4], { rot: [0, 0, H], tone: top }),
      part(cyl(0.12, 0.14, 0.04), [x, h + 0.02, -0.4], { tone: slate }),
    );
  });
  return parts;
}

function github(): Part[] {
  return [part(box(2.7, 0.12, 1.5, 0.05), [0, 0.06, -0.4], { tone: white })];
}

function contact({ top }: Identity): Part[] {
  return [
    part(cyl(0.07, 0.09, 0.9), [-0.4, 0.45, -0.6], { tone: wood }),
    part(box(0.75, 0.42, 0.5, 0.12), [-0.4, 1.05, -0.6], { tone: top }),
    part(cyl(0.25, 0.25, 0.75), [-0.4, 1.26, -0.6], { rot: [0, 0, H], tone: top }),
    part(box(0.04, 0.3, 0.12, 0.02), [-0.02, 1.05, -0.6], { tone: "#f7d26e" }),
    part(box(0.5, 0.05, 0.36, 0.025), [0.25, 0.08, -0.2], { rot: [0, 0.35, 0], tone: white }),
    part(ball(0.06), [0.25, 0.14, -0.2], { tone: top }),
    part(box(0.5, 0.05, 0.36, 0.025), [0.1, 0.3, 0.1], { rot: [0.5, 0.9, 0.2], tone: white }),
  ];
}

const BUILDERS: Record<StationId, (c: Identity) => Part[]> = {
  about,
  projects,
  experience,
  skills,
  awards,
  github,
  contact,
};

export function buildStation(id: StationId): BufferGeometry {
  const h = PLINTH_HEIGHT + SKIRT;
  const plinth = part(box(PLINTH_SIZE[id], h, PLINTH_SIZE[id], 0.14), [0, -PLINTH_HEIGHT - SKIRT + h / 2, 0], {
    tone: IDENTITY[id].wall,
  });
  return merge([plinth, ...BUILDERS[id](IDENTITY[id])], [0, PLINTH_HEIGHT, 0]);
}
