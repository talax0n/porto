import { BufferGeometry, Color, Matrix4, PlaneGeometry, SphereGeometry, Vector3 } from "three";
import { MAX_AGENTS } from "@/data/pulse";
import { STATIONS, type StationId } from "@/data/stations";
import { ACCENT, TONE, ball, cyl, merge, paint, part, pill, ring, type Part } from "./clay";
import { IDENTITY } from "./dioramas";
import { type Gesture, type Pose, blankPose } from "./gesture";
import { rng, scatter } from "./props";
import { LANDMARKS, NORTH_POLE, OBSTACLES, R, arc, flatten, plinthLift, resolve, steer, toward, walk } from "./planet";

/** one villager slot per agent the pulse can carry; a slot only shows while an agent holds it */
export const VILLAGERS = MAX_AGENTS;

/**
 * Character space: feet on y=0, facing +Z, about one unit tall before `SCALE`.
 * Every part is baked at its rest pose, so a part's instance matrix is just the pose of the
 * bone it hangs from (torso or head) and no per-part offsets live in the frame loop.
 */
export const SCALE = 0.78;
export const HEAD_Y = 0.7;
const HEAD_R = 0.33;
const HEAD_SQUASH = 0.9;

const ell = (seg: [number, number]) => new SphereGeometry(1, ...seg);

/** Point on the head surface at (x, y) on its front, plus the outward normal there. */
function onHead(x: number, y: number): [Vector3, Vector3] {
  const dy = (y - HEAD_Y) / HEAD_SQUASH;
  const z = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - x * x - dy * dy));
  const p = new Vector3(x, y, z);
  const nrm = new Vector3(x, dy / HEAD_SQUASH, z).normalize();
  return [p, nrm];
}

/** A flattened dot lying on the head, its thin axis along the surface normal. */
function dot(x: number, y: number, r: [number, number, number], tone: string): Part {
  const [p, nrm] = onHead(x, y);
  const m = new Matrix4().lookAt(nrm, new Vector3(), new Vector3(0, 1, 0));
  return part(ell([6, 4]).scale(...r).applyMatrix4(m).translate(p.x, p.y, p.z), [0, 0, 0], { tone });
}

function bake(geo: BufferGeometry, s: [number, number, number], at: [number, number, number], tone = "#ffffff") {
  return paint(geo.scale(...s).translate(...at), tone);
}

const flatPlane = () => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

export const PARTS = {
  head: bake(ell([14, 10]), [HEAD_R, HEAD_R * HEAD_SQUASH, HEAD_R], [0, HEAD_Y, 0]),
  body: bake(ell([10, 8]), [0.2, 0.22, 0.18], [0, 0.3, 0]),
  /** feet and arms: a unit nub scaled per instance */
  nub: paint(ell([5, 4]), "#ffffff"),
  face: merge([
    dot(-0.115, 0.7, [0.038, 0.05, 0.02], "#1c1c1e"),
    dot(0.115, 0.7, [0.038, 0.05, 0.02], "#1c1c1e"),
    dot(-0.2, 0.62, [0.06, 0.032, 0.012], "#f3b9b1"),
    dot(0.2, 0.62, [0.06, 0.032, 0.012], "#f3b9b1"),
  ]),
  beanie: merge([
    part(new SphereGeometry(HEAD_R + 0.02, 14, 5, 0, Math.PI * 2, 0, Math.PI * 0.36), [0, HEAD_Y + 0.02, 0], {
      scale: [1, HEAD_SQUASH, 1],
    }),
    part(ring(0.29, 0.045, 5, 14), [0, HEAD_Y + 0.17, 0], { rot: [Math.PI / 2, 0, 0] }),
    part(ball(0.075, 7, 5), [0, HEAD_Y + 0.33, 0]),
  ]),
  cap: merge([
    part(new SphereGeometry(HEAD_R + 0.015, 14, 5, 0, Math.PI * 2, 0, Math.PI * 0.32), [0, HEAD_Y + 0.02, 0], {
      scale: [1, HEAD_SQUASH, 1],
    }),
    part(cyl(0.17, 0.17, 0.025), [0, HEAD_Y + 0.17, 0.27], { rot: [0.25, 0, 0], scale: [1, 1, 0.75] }),
  ]),
  ears: merge([
    part(pill(0.065, 0.2, 3, 8), [-0.12, HEAD_Y + 0.38, 0], { rot: [0, 0, 0.22] }),
    part(pill(0.065, 0.2, 3, 8), [0.12, HEAD_Y + 0.38, 0], { rot: [0, 0, -0.22] }),
    part(pill(0.032, 0.14, 2, 6), [-0.125, HEAD_Y + 0.38, 0.045], { rot: [0, 0, 0.22], tone: "#f3c4c4" }),
    part(pill(0.032, 0.14, 2, 6), [0.125, HEAD_Y + 0.38, 0.045], { rot: [0, 0, -0.22], tone: "#f3c4c4" }),
  ]),
  blob: flatPlane(),
} satisfies Record<string, BufferGeometry>;

export const HATS = ["beanie", "cap", "ears"] as const;
export type Hat = (typeof HATS)[number];

/** Instance tint that leaves a part's baked vertex colours untouched (face dots). */
export const PLAIN = new Color("#ffffff");

const colors = (hex: readonly string[]) => hex.map((c) => new Color(c));
const SKIN = colors(["#f8dcc6", "#f0c6a4", "#e2ad86", "#c98e66", "#a46d4a", "#7c4e34"]);
const CLOTHES = colors(["#f08a7e", "#f6b26b", "#f5d06a", "#8fcf9a", "#7fb8e6", "#b49be0", "#f4a3c0", "#5fc2b8"]);
const HAT = colors(["#f08a7e", "#f5d06a", "#7fb8e6", "#b49be0", "#8fcf9a", "#fbfaf7", "#5b6474"]);
/** Bunny ears keep light shades; their pink lining is multiplied by this tint. */
const EARS = colors(["#fbfaf7", "#fbe3ea", "#f6ecd6", "#e8e1f6"]);
const SHOES = colors(["#8a6f60", "#6d7a94", "#a8765c", "#fbfaf7"]);

interface Body {
  n: Vector3;
  heading: Vector3;
  hat: Hat | null;
  hatColor: Color;
  skin: Color;
  shirt: Color;
  foot: Color;
  /** walk speed now, in surface units per second */
  speed: number;
  phase: number;
  /** waddle amplitude, eased toward 0 at rest and 1 at full walk */
  amp: number;
  /** squash spring for start/stop */
  sq: number;
  sqv: number;
  /** signed turn rate, for leaning into turns */
  lean: number;
  /** seconds since the last greeting hop started; Infinity when idle */
  hop: number;
}

export type Folk = Body &
  (
    | { kind: "player" }
    | {
        kind: "villager";
        id: number;
        want: number;
        turn: number;
        timer: number;
        goal: Vector3 | null;
        /** centre of the landmark this villager may walk onto, while it heads to or from a spot there */
        skip: Vector3 | null;
        /** the spot it has settled into and holds: a desk, a gym machine, a bed */
        pin: Post | null;
        /** feet above the ground: a plinth top, a stool, a mattress */
        lift: number;
        /** the work loop's pose, chased toward the pin's move each frame */
        pose: Pose;
        clock: number;
        /** false while no agent holds this slot: nothing drawn, nothing to bump into */
        shown: boolean;
        /** height above the ground while it drops in from the sky, and its vertical speed */
        alt: number;
        vy: number;
      }
    | { kind: "keeper"; station: StationId; post: Vector3; rest: Vector3 }
  );

export type Villager = Extract<Folk, { kind: "villager" }>;

/** A spot on the planet a villager settles into: where, facing which way, how high, doing what. */
export interface Post {
  n: Vector3;
  heading: Vector3;
  lift: number;
  move: Gesture;
  pace?: number;
}

const rest = (): Omit<Body, "n" | "heading" | "hat" | "hatColor" | "skin" | "shirt" | "foot"> => ({
  speed: 0,
  phase: 0,
  amp: 0,
  sq: 0,
  sqv: 0,
  lean: 0,
  hop: Infinity,
});

const accent = new Color(ACCENT);

/** The player rides on `ctl.player`'s vectors, so the crowd always reads the live pose. */
export function makeCrowd(player: { n: Vector3; heading: Vector3 }): Folk[] {
  const rand = rng(42);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
  const folk: Folk[] = [
    {
      kind: "player",
      ...player,
      ...rest(),
      hat: "beanie",
      hatColor: accent,
      skin: SKIN[1],
      // the only white outfit on the planet, so "you" reads at a glance in a colourful crowd
      shirt: new Color(TONE.white),
      foot: new Color("#4a5694"),
    },
  ];
  for (const s of STATIONS) {
    const { keeper, keeperFacing } = LANDMARKS[s.id];
    folk.push({
      kind: "keeper",
      station: s.id,
      post: keeper,
      rest: keeperFacing,
      n: keeper.clone(),
      heading: keeperFacing.clone(),
      ...rest(),
      hat: "cap",
      hatColor: new Color(IDENTITY[s.id].top),
      skin: pick(SKIN),
      shirt: new Color(IDENTITY[s.id].wall),
      foot: pick(SHOES),
    });
  }
  for (let id = 0; id < VILLAGERS; id++) {
    const n = new Vector3();
    do scatter(rand, n);
    while (OBSTACLES.some((o) => arc(n, o.n) < o.r + 0.4) || arc(n, NORTH_POLE) < 2.5);
    const roll = rand();
    const hat: Hat | null = roll < 0.18 ? "ears" : roll < 0.4 ? "beanie" : roll < 0.62 ? "cap" : null;
    folk.push({
      kind: "villager",
      id,
      n,
      heading: toward(n, scatter(rand, new Vector3()), new Vector3()),
      ...rest(),
      want: 0,
      turn: 0,
      timer: rand() * 3,
      goal: null,
      skip: null,
      pin: null,
      lift: 0,
      pose: blankPose(),
      clock: 0,
      shown: false,
      alt: 0,
      vy: 0,
      hat,
      hatColor: pick(hat === "ears" ? EARS : HAT),
      skin: pick(SKIN),
      shirt: pick(CLOTHES),
      foot: pick(SHOES),
    });
  }
  return folk;
}

export const RADIUS = 0.26;
export const WALK = 1.1;
const SPACE = 0.75;
/** how close to its goal a villager stops, in surface units */
const ARRIVE = 0.6;

const dir = new Vector3();
const push = new Vector3();
const tmp = new Vector3();

/** Random-walk steering: wander, keep a little apart, give the player and props room. A pinned villager just settles. */
export function stepVillager(f: Villager, crowd: Folk[], dt: number, rand: () => number) {
  const pin = f.pin;
  if (pin) settle(f, pin, dt);
  else roam(f, crowd, dt, rand);
  f.lift += ((pin ? pin.lift : plinthLift(f.n)) - f.lift) * Math.min(1, dt * 8);
}

function roam(f: Villager, crowd: Folk[], dt: number, rand: () => number) {
  const goal = f.goal;
  if (goal) {
    toward(f.n, goal, dir);
    // spots on a plinth sit close together, so walk right up to them
    f.want = arc(f.n, goal) > (f.skip ? 0.25 : ARRIVE) ? WALK * 1.3 : 0;
    f.turn = 0;
  } else {
    f.timer -= dt;
    if (f.timer < 0) {
      const stroll = rand() < 0.7;
      f.want = stroll ? WALK * (0.6 + rand() * 0.5) : 0;
      f.turn = (rand() - 0.5) * (stroll ? 1.6 : 0);
      f.timer = 1.5 + rand() * 3.5;
    }
    dir.copy(f.heading).applyAxisAngle(f.n, f.turn * dt);
  }
  push.set(0, 0, 0);
  // all-pairs is fine for ~70 walkers; bucket by cell if the crowd grows into the hundreds
  for (const o of crowd) {
    if (o === f || (o.kind === "villager" && !o.shown)) continue;
    const c = f.n.dot(o.n);
    if (c < Math.cos(SPACE / R)) continue;
    const d = Math.acos(Math.min(1, c)) * R;
    toward(f.n, o.n, tmp).multiplyScalar(-(SPACE - d) / SPACE);
    push.add(o.kind === "player" ? tmp.multiplyScalar(2) : tmp);
  }
  const crowded = push.lengthSq() > 0.04;
  dir.addScaledVector(push, 2.5);
  flatten(dir, f.n);
  const pressed = steer(f.n, dir, RADIUS, goal, f.skip);
  // turning the body is what makes the wander read as walking, not sliding
  f.heading.lerp(dir, Math.min(1, dt * 4));
  flatten(f.heading, f.n);
  const want = crowded && !goal ? Math.max(f.want, WALK * 0.7) : f.want * (1 - pressed * 0.5);
  f.speed += (want - f.speed) * Math.min(1, dt * 3);
  move(f, dt);
}

/** Slides onto a pinned spot and turns to face its way, then holds there; `pace` keeps a treadmill runner's legs going. */
function settle(f: Villager, pin: Post, dt: number) {
  const d = arc(f.n, pin.n);
  if (d > 1e-3) walk(f.n, toward(f.n, pin.n, dir), Math.min(d, dt * WALK * 0.6), f.heading);
  f.heading.lerp(pin.heading, Math.min(1, dt * 5));
  flatten(f.heading, f.n);
  f.speed = d > 0.05 ? WALK * 0.5 : (pin.pace ?? 0);
  f.want = f.turn = 0;
}

/** Advances along the heading by the current speed and keeps clear of footprints. */
export function move(f: Folk, dt: number, along: Vector3 = f.heading, ...riders: Vector3[]) {
  if (f.speed > 1e-3) walk(f.n, along, f.speed * dt, f.heading, ...riders);
  resolve(f.n, RADIUS, f.kind === "villager" ? f.skip : null, f.heading, ...riders);
}

const SQ_SPRING = 170;
const SQ_DAMP = 15;

/** Walk cycle, waddle, squash spring and hop clock, shared by every character. */
export function animate(f: Folk, dt: number, turnRate: number) {
  const walking = f.speed > 0.25;
  const target = Math.min(1, f.speed / WALK);
  if ((f.amp > 0.4) !== walking && Math.abs(target - f.amp) > 0.3) f.sqv += walking ? 3 : -3.2;
  f.amp += (target - f.amp) * Math.min(1, dt * 8);
  f.phase += dt * (5 + 7 * f.amp) * (f.amp > 0.02 ? 1 : 0);
  // a stiff spring diverges on a long step (a hitch, or ?speed), so it never takes one
  const k = Math.min(dt, 1 / 30);
  f.sqv += (-SQ_SPRING * f.sq - SQ_DAMP * f.sqv) * k;
  f.sq += f.sqv * k;
  f.lean += (turnRate - f.lean) * Math.min(1, dt * 6);
  if (f.hop !== Infinity) f.hop += dt;
}

export const HOP = 0.45;
