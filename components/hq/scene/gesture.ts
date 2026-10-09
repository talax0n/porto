export type Gesture =
  | "rest"
  | "wave"
  | "point"
  | "cheer"
  | "ready"
  | "crouch";

/**
 * The player's gesture layer, in character space. Arm raise swings out from hanging (0) through
 * level (π/2) to overhead; fwd pitches the arm toward the front. R is the character's right arm.
 */
export interface Pose {
  armR: number;
  fwdR: number;
  armL: number;
  fwdL: number;
  /** 0 hanging nubs, 1 the longer arm a raised hand needs to clear the head */
  grow: number;
  /** how much of the walk's arm swing shows through */
  swing: number;
  /** body roll, positive toward the character's right */
  lean: number;
  bounce: number;
  headYaw: number;
  /** positive squashes, negative stretches */
  squash: number;
}

const KEYS = ["armR", "fwdR", "armL", "fwdL", "grow", "swing", "lean", "bounce", "headYaw", "squash"] as const;

export const blankPose = (): Pose => ({
  armR: 0.55,
  fwdR: 0,
  armL: 0.55,
  fwdL: 0,
  grow: 0,
  swing: 1,
  lean: 0,
  bounce: 0,
  headYaw: 0,
  squash: 0,
});

const REST = blankPose();
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

interface Move {
  /** one-shots hand back to rest after this many seconds */
  once?: number;
  /** `m` is 1 normally and 0 under reduced motion, which freezes every loop and hop into a held pose */
  set(p: Pose, t: number, m: number): void;
}

const MOVES: Record<Gesture, Move> = {
  rest: { set() {} },
  wave: {
    set(p, t, m) {
      p.armR = 2.4 + Math.sin(t * 10) * 0.38 * m;
      p.grow = 1;
      p.lean = Math.sin(t * 10) * 0.06 * m;
    },
  },
  point: {
    // showing off the town: one arm out and a touch up, body and gaze leaning after it
    set(p, t, m) {
      p.armR = 1.95 + Math.sin(t * 3) * 0.08 * m;
      p.fwdR = 0.35;
      p.armL = 0.3;
      p.grow = 1;
      p.lean = 0.14 + Math.sin(t * 3) * 0.02 * m;
      p.headYaw = -0.35;
    },
  },
  cheer: {
    set(p, t, m) {
      const hop = Math.abs(Math.sin(t * 6.5)) * m;
      // a wide V: overhead, the nubs vanish behind the head
      p.armR = 2.15 + Math.sin(t * 13) * 0.2 * m;
      p.armL = 2.15 - Math.sin(t * 13) * 0.2 * m;
      p.fwdR = p.fwdL = 0.15;
      p.grow = 1;
      p.bounce = hop * 0.22;
      p.squash = (0.12 - hop * 0.2) * m;
    },
  },
  ready: {
    // a fist pump on the free side, the other hand on the hip
    set(p, t, m) {
      const pump = Math.max(0, Math.sin(t * 5)) ** 2 * m;
      p.armL = 2.8 - pump * 1.1;
      p.fwdL = 0.25;
      p.armR = 0.3;
      p.fwdR = -0.3;
      p.grow = 1;
      p.lean = -0.06;
      p.bounce = pump * 0.05;
      p.squash = pump * 0.06;
    },
  },
  crouch: {
    // anticipation: wind down with the arms swept back, then spring up as the drop starts
    once: 1.2,
    set(p, t, m) {
      const wind = smooth(t / 0.2);
      const spring = smooth((t - 0.2) / 0.12);
      p.armR = p.armL = 0.55 - wind * 0.35 + spring * 1.95;
      p.fwdR = p.fwdL = -wind * 0.7 * (1 - spring) + spring * 0.15;
      p.grow = spring;
      p.bounce = -wind * (1 - spring) * 0.1 * m;
      p.squash = (wind * 0.25 - spring * 0.35) * m;
    },
  },
};

export const onceOf = (g: Gesture) => MOVES[g].once;

/** Writes `g`'s pose at `t` seconds in; `out` is reused, so this allocates nothing. */
export function poseOf(g: Gesture, t: number, m: number, out: Pose): Pose {
  for (const k of KEYS) out[k] = REST[k];
  MOVES[g].set(out, t, m);
  return out;
}

/** `out` = `a` eased toward `b` by `k` in [0, 1]. */
export function mixPose(a: Pose, b: Pose, k: number, out: Pose): Pose {
  const e = smooth(k);
  for (const key of KEYS) out[key] = a[key] + (b[key] - a[key]) * e;
  return out;
}

