import { type BufferGeometry, Euler, Quaternion, Vector3 } from "three";
import type { StationId } from "@/data/stations";
import { EXPERIENCE } from "@/data/experience";
import { AWARDS } from "@/data/awards";
import { PAL, TONE, ball, box, cone, cyl, merge, part, ring, type Part, type Vec3 } from "./clay";
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

/** Plinth edge per station; projects is wider so a whole team of agents fits at its desks. */
export const PLINTH_SIZE: Record<StationId, number> = {
  about: 3.2,
  projects: 4.4,
  experience: 3.2,
  skills: 3.2,
  awards: 3.2,
  github: 3.2,
  contact: 3.2,
};
export const PLINTH_HEIGHT = 0.4;
/** The plinth runs this far below the ground so its corners stay buried where the planet curves away. */
const SKIRT = 0.5;
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

/** Seat 0.24 up, desk and monitor ahead. */
const desk = ({ top }: Identity): Part[] => [
  part(cyl(0.2, 0.2, 0.06), [0, 0.21, 0], { tone: top }),
  part(cyl(0.03, 0.03, 0.2), [0, 0.1, 0], { tone: mid }),
  part(box(0.9, 0.06, 0.5, 0.03), [0, 0.5, 0.52], { tone: white }),
  part(box(0.06, 0.48, 0.44, 0.02), [-0.4, 0.24, 0.52], { tone: top }),
  part(box(0.06, 0.48, 0.44, 0.02), [0.4, 0.24, 0.52], { tone: top }),
  part(box(0.36, 0.02, 0.13, 0.01), [0, 0.54, 0.34], { tone: light }),
  part(cyl(0.03, 0.08, 0.14), [0, 0.6, 0.72], { tone: mid }),
  part(box(0.62, 0.4, SCREEN.depth, 0.03), SCREEN.at, { rot: [SCREEN.tilt, 0, 0], tone: white }),
];

const treadmill = ({ top }: Identity): Part[] => [
  part(box(0.56, 0.1, 1.15, 0.04), [0, 0.05, 0.1], { tone: mid }),
  part(box(0.46, 0.02, 1.05, 0.01), [0, 0.11, 0.08], { tone: "#5b6474" }),
  part(box(0.05, 0.8, 0.05, 0.02), [-0.25, 0.5, 0.62], { tone: mid }),
  part(box(0.05, 0.8, 0.05, 0.02), [0.25, 0.5, 0.62], { tone: mid }),
  part(box(0.6, 0.12, 0.2, 0.04), [0, 0.92, 0.62], { rot: [-0.4, 0, 0], tone: top }),
  part(cyl(0.025, 0.025, 0.55), [0, 0.78, 0.5], { rot: [0, 0, H], tone: slate }),
];

/** Lying: feet at the origin, so the bar racks over the chest about 0.45 back. */
const bench = ({ top }: Identity): Part[] => [
  part(box(0.36, 0.08, 1.0, 0.04), [0, 0.3, -0.5], { tone: top }),
  part(box(0.3, 0.26, 0.06, 0.02), [0, 0.13, -0.15], { tone: mid }),
  part(box(0.3, 0.26, 0.06, 0.02), [0, 0.13, -0.9], { tone: mid }),
  part(box(0.05, 0.9, 0.05, 0.02), [-0.4, 0.45, -0.45], { tone: mid }),
  part(box(0.05, 0.9, 0.05, 0.02), [0.4, 0.45, -0.45], { tone: mid }),
  part(cyl(0.022, 0.022, 1.1), [0, 0.86, -0.45], { rot: [0, 0, H], tone: slate }),
  part(cyl(0.16, 0.16, 0.06), [-0.5, 0.86, -0.45], { rot: [0, 0, H], tone: slate }),
  part(cyl(0.16, 0.16, 0.06), [0.5, 0.86, -0.45], { rot: [0, 0, H], tone: slate }),
];

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

/** Workplaces for live agents and beds for finished ones; a spot's index is its identity. */
export const PLACES = {
  desk: {
    station: "projects",
    spots: [
      { at: [-0.65, 0, -1.0], yaw: Math.PI, up: 0.24, move: "type", kit: desk },
      { at: [0.65, 0, -1.0], yaw: Math.PI, up: 0.24, move: "type", kit: desk },
      { at: [-1.0, 0, 0.05], yaw: -H, up: 0.24, move: "type", kit: desk },
      { at: [-1.0, 0, 1.3], yaw: -H, up: 0.24, move: "type", kit: desk },
    ],
  },
  gym: {
    station: "skills",
    spots: [
      { at: [-0.85, 0, -0.3], yaw: Math.PI, up: 0.12, move: "run", pace: 1.6, kit: treadmill },
      { at: [0.45, 0, 0.15], yaw: 0, up: 0.53, move: "press", kit: bench },
      { at: [-0.6, 0, 0.9], yaw: Math.PI / 4, up: 0.03, move: "lift", kit: mat },
    ],
  },
  bed: {
    station: "about",
    spots: [-0.85, -0.15, 0.55].map((z): Spot => ({ at: [-0.12, 0.1, z], yaw: H, up: 0.51, move: "sleep", kit: bed })),
  },
} satisfies Record<string, { station: StationId; spots: Spot[] }>;
export type Place = keyof typeof PLACES;

const kits = (place: Place, c: Identity): Part[] => PLACES[place].spots.flatMap((s: Spot) => turned(s.kit(c), s.at, s.yaw));

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
    ...kits("bed", { wall, top }),
  ];
}

function projects(c: Identity): Part[] {
  return [
    part(box(3.0, 0.02, 2.6, 0.01), [-0.45, 0.01, -0.3], { tone: light }),
    ...kits("desk", c),
    // a server rack in the back corner, blinking for whoever is on shift
    part(box(0.55, 1.25, 0.5, 0.05), [1.6, 0.63, -1.6], { tone: slate }),
    ...[0.35, 0.65, 0.95].map((y) => part(box(0.4, 0.04, 0.02, 0.01), [1.6, y, -1.34], { tone: "#8fcf9a" })),
    part(cyl(0.16, 0.12, 0.26), [-1.8, 0.13, -1.8], { tone: terracotta }),
    part(ball(0.22), [-1.8, 0.44, -1.8], { tone: leaf[1] }),
    part(ball(0.16), [-1.68, 0.66, -1.72], { tone: leaf[0] }),
    part(ball(0.12), [0.95, 0.12, 0.2], { tone: PAL.autumn[1] }),
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

/** The skills station is a gym: agents work out here while its panel still lists the stack. */
function skills(c: Identity): Part[] {
  return [
    part(box(2.9, 0.02, 2.9, 0.01), [-0.1, 0.01, -0.1], { tone: light }),
    ...kits("gym", c),
    part(cyl(0.12, 0.14, 0.5), [1.15, 0.25, -1.15], { tone: c.top }),
    part(ball(0.3), [1.15, 0.8, -1.15], { tone: "#f7d26e" }),
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
