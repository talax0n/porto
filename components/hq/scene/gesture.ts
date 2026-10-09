export type Gesture =
  | "rest"
  | "wave"
  | "point"
  | "cheer"
  | "ready"
  | "crouch"
  | "idleLook"
  | "idleStretch"
  | "idleTap"
  | "idleSway"
  | "hop"
  | "greet"
  | "celebrate"
  /** villager work loops, played at a desk, gym spot or bed */
  | "type"
  | "run"
  | "lift"
  | "press"
  | "sleep";

export const IDLES = ["idleLook", "idleStretch", "idleTap", "idleSway"] as const satisfies readonly Gesture[];

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
  /** lift of the left foot */
  tap: number;
  /** 0 upright, 1 flat on the back, pivoting at the feet so the head ends up behind */
  lie: number;
}

const KEYS = ["armR", "fwdR", "armL", "fwdL", "grow", "swing", "lean", "bounce", "headYaw", "squash", "tap", "lie"] as const;

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
  tap: 0,
  lie: 0,
});

const REST = blankPose();
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** 0 → 1 over `rise` seconds, held, then back to 0 by `end` */
const swell = (t: number, rise: number, end: number) => smooth(t / rise) * (1 - smooth((t - end + rise) / rise));

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
  idleLook: {
    set(p, t) {
      // wide enough that a cheek shows past the beanie from the camera behind
      p.headYaw = Math.sin(t * 1.4) * 1;
      p.lean = Math.sin(t * 1.4) * -0.06;
    },
  },
  idleStretch: {
    set(p, t) {
      const up = swell(t, 0.7, 3);
      p.armR = p.armL = 0.55 + up * 2.35;
      p.grow = up;
      p.squash = up * -0.14 + Math.sin(t * 2) * 0.02 * up;
      p.swing = 1 - up;
    },
  },
  idleTap: {
    set(p, t) {
      const tap = Math.max(0, Math.sin(t * 8));
      p.tap = tap;
      p.lean = -0.05;
      p.bounce = tap * 0.03;
      p.armR = p.armL = 0.55 + tap * 0.2;
      p.headYaw = 0.15;
    },
  },
  idleSway: {
    set(p, t) {
      p.lean = Math.sin(t * 2.6) * 0.13;
      p.bounce = Math.abs(Math.sin(t * 2.6)) * 0.04;
      p.headYaw = Math.sin(t * 2.6) * 0.18;
      p.armR = 0.55 + Math.max(0, Math.sin(t * 2.6)) * 0.3;
      p.armL = 0.55 + Math.max(0, -Math.sin(t * 2.6)) * 0.3;
    },
  },
  hop: {
    once: 0.7,
    set(p, t, m) {
      const air = t < 0.45 ? Math.sin((Math.PI * t) / 0.45) : 0;
      p.armR = p.armL = 2.15;
      p.grow = 1;
      p.swing = 0;
      p.bounce = air * 0.42 * m;
      p.squash = (t < 0.45 ? -air * 0.14 : Math.sin(((t - 0.45) / 0.25) * Math.PI) * 0.16) * m;
    },
  },
  greet: {
    once: 0.7,
    set(p, t, m) {
      const up = swell(t, 0.12, 0.7);
      p.armR = 0.55 + up * (1.85 + Math.sin(t * 16) * 0.35 * m);
      p.grow = up;
      p.swing = 1 - up;
      p.headYaw = -0.3 * up;
    },
  },
  celebrate: {
    // the crowd's shared jump lifts the body; this is only the arms
    once: 1.4,
    set(p, t, m) {
      p.armR = 2.15 + Math.sin(t * 14) * 0.2 * m;
      p.armL = 2.15 - Math.sin(t * 14) * 0.2 * m;
      p.grow = 1;
      p.swing = 0;
    },
  },
  type: {
    // hunched at the keyboard, hands pecking out of step, an occasional glance across the screen
    set(p, t, m) {
      p.armR = p.armL = 0.3;
      p.fwdR = 1.15 + Math.max(0, Math.sin(t * 17)) * 0.25 * m;
      p.fwdL = 1.15 + Math.max(0, Math.sin(t * 17 + 2)) * 0.25 * m;
      p.swing = 0;
      p.headYaw = Math.sin(t * 0.7) * 0.25 * m;
      p.bounce = -0.03 + Math.abs(Math.sin(t * 17)) * 0.008 * m;
      p.squash = 0.06;
    },
  },
  run: {
    // the treadmill supplies the legs through the walk cycle; this pumps the arms harder
    set(p, t, m) {
      p.armR = p.armL = 0.35;
      p.swing = 1.9;
      p.bounce = Math.abs(Math.sin(t * 11)) * 0.05 * m;
    },
  },
  lift: {
    // squat and press: dip, then drive both hands overhead
    set(p, t, m) {
      const up = Math.max(0, Math.sin(t * 3.2)) * m;
      p.armR = p.armL = 1.5 + up * 1.2;
      p.fwdR = p.fwdL = 0.2;
      p.grow = 0.4 + up * 0.6;
      p.swing = 0;
      p.bounce = -(1 - up) * 0.08 * m;
      p.squash = (1 - up) * 0.12 * m - up * 0.06;
    },
  },
  press: {
    // flat on the bench, pushing the bar straight up off the chest
    set(p, t, m) {
      const up = (0.5 + Math.sin(t * 2.6) * 0.5) * m;
      p.lie = 1;
      p.armR = p.armL = 0.15;
      p.fwdR = p.fwdL = Math.PI / 2;
      p.grow = 0.2 + up * 0.8;
      p.swing = 0;
      p.squash = -up * 0.05;
    },
  },
  sleep: {
    set(p, t, m) {
      p.lie = 1;
      p.armR = p.armL = 0.25;
      p.swing = 0;
      p.headYaw = 0.35;
      p.squash = Math.sin(t * 1.3) * 0.06 * m;
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

/** Eases `cur` toward `to` by `k` in [0, 1], for a pose that follows a changing target without a fixed blend clock. */
export function chasePose(cur: Pose, to: Pose, k: number): Pose {
  for (const key of KEYS) cur[key] += (to[key] - cur[key]) * k;
  return cur;
}

/** Swaps the arms and every left-right sign, so a gesture can play on the other side. */
export function mirrorPose(p: Pose): Pose {
  const arm = p.armR;
  const fwd = p.fwdR;
  p.armR = p.armL;
  p.fwdR = p.fwdL;
  p.armL = arm;
  p.fwdL = fwd;
  p.lean = -p.lean;
  p.headYaw = -p.headYaw;
  return p;
}
