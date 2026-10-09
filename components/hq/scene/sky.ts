/** Hours (Jakarta) of the sun crossing the horizon, and the half-width of the dusk/dawn blend around each. */
const SUNRISE = 5 + 50 / 60;
const SUNSET = 17 + 55 / 60;
const TWILIGHT = 35 / 60;

const HOUR = 3_600_000;
const mod24 = (h: number) => ((h % 24) + 24) % 24;

/** Fractional hour of day in Jakarta. Indonesia has no DST, so a fixed UTC+7 offset is exact. */
export const jakartaHour = (nowMs: number) => mod24(nowMs / HOUR + 7);

/** dev only: `?hour=H` starts the clock at H and `?speed=N` runs it N× from page load */
const query =
  process.env.NODE_ENV !== "production" && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
const T0 = Date.now();
const SPEED = Number(query?.get("speed")) || 1;
const START = query?.has("hour") ? Number(query.get("hour")) : jakartaHour(T0);
const SHIFT = Number.isFinite(START) ? (START - jakartaHour(T0)) * HOUR : 0;

/** The hour the sky shows right now. */
export const skyHour = () => jakartaHour(T0 + SHIFT + (Date.now() - T0) * SPEED);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Packed 0xRRGGBB colours for the DOM backdrop and the lights, plus the intensities that go with them. */
interface Palette {
  top: number;
  bottom: number;
  hemiSky: number;
  hemiGround: number;
  hemi: number;
  key: number;
  keyI: number;
  /** HUD text that sits straight on the sky */
  ink: number;
  mute: number;
}

export interface Look extends Palette {
  /** 0 night … 1 full day */
  day: number;
  /** 0 … 1, peaks mid-twilight */
  dusk: number;
  /** 0 … 1 along the sun's arc, sunrise → sunset */
  sun: number;
  /** 0 … 1 along the moon's arc, sunset → sunrise */
  moon: number;
}

/** Day is the look the scene was built in; night and dusk are measured against it. */
const KEYS: Record<"night" | "dusk" | "day", Palette> = {
  night: { top: 0x0b1230, bottom: 0x1d2a55, hemiSky: 0x7088d0, hemiGround: 0x2c3358, hemi: 0.5, key: 0x9db4ff, keyI: 0.7, ink: 0xf3f2ef, mute: 0xa9b3d6 },
  dusk: { top: 0x4a4585, bottom: 0xff9a62, hemiSky: 0xffc9a8, hemiGround: 0x7a5a60, hemi: 0.85, key: 0xffb070, keyI: 1.5, ink: 0xfbf6ec, mute: 0xf1e2e6 },
  day: { top: 0xe4eeff, bottom: 0xffffff, hemiSky: 0xeaf2ff, hemiGround: 0xf3e3c8, hemi: 1.1, key: 0xfff3e2, keyI: 2.1, ink: 0x111111, mute: 0x6b6b6b },
};
const COLOURS = ["top", "bottom", "hemiSky", "hemiGround", "key", "ink", "mute"] as const;
const AMOUNTS = ["hemi", "keyI"] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpHex = (a: number, b: number, t: number) =>
  (Math.round(lerp(a >> 16, b >> 16, t)) << 16) |
  (Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)) << 8) |
  Math.round(lerp(a & 255, b & 255, t));

export const newLook = (): Look => ({ ...KEYS.day, day: 1, dusk: 0, sun: 0.5, moon: 1 });

/** Where the sun and moon are and how lit the day is at `hour`. Writes into `out` so a frame loop allocates nothing. */
export function skyAt(hour: number, out = newLook()): Look {
  const h = mod24(hour);
  out.day = smooth(SUNRISE - TWILIGHT, SUNRISE + TWILIGHT, h) - smooth(SUNSET - TWILIGHT, SUNSET + TWILIGHT, h);
  out.dusk = 4 * out.day * (1 - out.day);
  out.sun = clamp01((h - SUNRISE) / (SUNSET - SUNRISE));
  out.moon = clamp01(mod24(h - SUNSET) / (24 - (SUNSET - SUNRISE)));
  return out;
}

/** Fills the palette from the keys: night → day by `day`, then toward dusk by `dusk`. */
export function mix(out: Look): Look {
  for (const k of COLOURS) out[k] = lerpHex(lerpHex(KEYS.night[k], KEYS.day[k], out.day), KEYS.dusk[k], out.dusk);
  for (const k of AMOUNTS) out[k] = lerp(lerp(KEYS.night[k], KEYS.day[k], out.day), KEYS.dusk[k], out.dusk);
  return out;
}

export const skyNow = (out: Look) => mix(skyAt(skyHour(), out));
