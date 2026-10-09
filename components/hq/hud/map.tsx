import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Vector3 } from "three";
import { STATIONS, type StationId } from "@/data/stations";
import { cn } from "@/lib/utils";
import { ACCENT, PAL } from "../scene/clay";
import { IDENTITY } from "../scene/dioramas";
import { LANDMARKS, NORTH_POLE, R, mapXY } from "../scene/planet";
import { PLAZA } from "../scene/props";
import { ctl } from "../game";

interface Charted {
  visited: ReadonlySet<StationId>;
  met: ReadonlySet<number>;
  /** today's quest destination, ringed on the map */
  target: StationId | null;
}

/** How much of the planet the corner radar shows, in radians from the player; the full map shows all of it. */
const RADAR = 1.6;
const FULL = Math.PI;
const REDRAW_MS = 66;
/** percent of the full map per radian; the 6px canvas inset is about 1.2% of a ~500px card */
const LABEL_SCALE = 48.8 / FULL;
const reduced = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");
const at = { x: 0, y: 0 };
const right = new Vector3();

/** Draws the planet as seen from above the player, camera-forward up, into a square canvas. */
function draw(canvas: HTMLCanvasElement, range: number, { visited, met, target }: Charted, big: boolean) {
  const ctx = canvas.getContext("2d");
  const size = canvas.clientWidth;
  if (!ctx || !size) return;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(size * dpr)) canvas.width = canvas.height = Math.round(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const c = size / 2;
  const r = c - (big ? 6 : 3);
  const k = r / range;
  const { n, heading } = ctl.player;
  const up = ctl.north;
  /** projects a unit position; false when it lies past the rim, after pinning it there */
  const place = (p: Vector3) => {
    mapXY(n, up, p, at);
    const d = Math.hypot(at.x, at.y);
    const inside = d <= range;
    const s = inside ? k : r / d;
    at.x = c + at.x * s;
    at.y = c - at.y * s;
    return inside;
  };

  // the far side of the planet shades darker toward the rim, so the disc still reads as a ball
  const ground = ctx.createRadialGradient(c, c, r * 0.3, c, c, r);
  ground.addColorStop(0, "#d8edc9");
  ground.addColorStop(1, range > 2 ? "#b9d9a3" : "#cfe7bd");
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fillStyle = ground;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#bcdca6";
  ctx.stroke();
  ctx.save();
  ctx.clip();

  if (place(NORTH_POLE)) {
    ctx.beginPath();
    ctx.arc(at.x, at.y, Math.max(3, (PLAZA / R) * k), 0, Math.PI * 2);
    ctx.fillStyle = PAL.sand;
    ctx.fill();
  }

  const dot = big ? 2.4 : 1.6;
  for (const v of ctl.villagers) {
    if (!place(v.n)) continue;
    ctx.beginPath();
    ctx.arc(at.x, at.y, dot, 0, Math.PI * 2);
    ctx.fillStyle = met.has(v.id) ? ACCENT : "rgba(17,17,17,0.32)";
    ctx.fill();
  }
  ctx.restore();

  const pin = big ? 8 : 5;
  const pulse = reduced?.matches ? 0 : Math.sin(performance.now() / 260) * 0.5 + 0.5;
  for (const s of STATIONS) {
    const inside = place(LANDMARKS[s.id].n);
    const pr = inside ? pin : pin * 0.75;
    if (s.id === target) {
      ctx.beginPath();
      ctx.arc(at.x, at.y, pr + 3 + pulse * 2.5, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = ACCENT;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(at.x, at.y, pr, 0, Math.PI * 2);
    ctx.fillStyle = IDENTITY[s.id].top;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    if (visited.has(s.id)) {
      const t = pr * 0.5;
      ctx.beginPath();
      ctx.moveTo(at.x - t, at.y);
      ctx.lineTo(at.x - t * 0.25, at.y + t * 0.7);
      ctx.lineTo(at.x + t, at.y - t * 0.6);
      ctx.lineWidth = big ? 2 : 1.5;
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.stroke();
    }
  }

  right.crossVectors(up, n);
  const a = Math.atan2(heading.dot(right), heading.dot(up));
  const h = big ? 9 : 7;
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(h * 0.75, h * 0.7);
  ctx.lineTo(0, h * 0.35);
  ctx.lineTo(-h * 0.75, h * 0.7);
  ctx.closePath();
  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.restore();
}

/** Redraws at ~15Hz while mounted; the latest props are read through a ref so the loop never restarts. */
function useChart(range: number, charted: Charted, big: boolean) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef(charted);
  useEffect(() => {
    live.current = charted;
  });
  useEffect(() => {
    const tick = () => canvas.current && draw(canvas.current, range, live.current, big);
    tick();
    const id = setInterval(tick, REDRAW_MS);
    return () => clearInterval(id);
  }, [range, big]);
  return canvas;
}

export function Minimap({ onOpen, ...charted }: Charted & { onOpen: () => void }) {
  const canvas = useChart(RADAR, charted, false);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open map (M)"
      title="Map (M)"
      className="group relative block size-[132px] rounded-full border border-hq-line bg-white/90 p-1 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.25)] backdrop-blur transition-transform hover:scale-[1.03] max-sm:size-24"
    >
      <canvas ref={canvas} className="size-full rounded-full" aria-hidden />
      <kbd className="absolute -top-1 -left-1 rounded border border-hq-line bg-white px-1 py-px font-sans text-[10px] text-hq-mute pointer-coarse:hidden">
        M
      </kbd>
    </button>
  );
}

interface FullMapProps extends Charted {
  onTravel: (id: StationId) => void;
  onClose: () => void;
}

/** The whole planet as one disc around the player. The world is paused underneath, so labels sit still. */
export function FullMap({ onTravel, onClose, ...charted }: FullMapProps) {
  const canvas = useChart(FULL, charted, true);
  const spots = useMemo(
    () =>
      STATIONS.map((s) => {
        const { x, y } = mapXY(ctl.player.n, ctl.north, LANDMARKS[s.id].n, { x: 0, y: 0 });
        return { s, left: 50 + x * LABEL_SCALE, top: 50 - y * LABEL_SCALE };
      }),
    [],
  );
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced?.matches ? 0 : 0.18 }}
      className="absolute inset-0 z-40 grid place-items-center bg-white/55 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Map"
        className="w-[min(520px,calc(100vw-24px),calc(100dvh-140px))] rounded-3xl border border-hq-line bg-white p-5 text-hq-ink shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] max-sm:p-3"
      >
        <header className="mb-3 flex items-center gap-3">
          <h2 className="flex-1 font-display text-2xl font-extrabold leading-none tracking-tight">Map</h2>
          <p className="text-[11px] text-hq-mute max-sm:hidden">Pick a place to go</p>
          <kbd className="rounded-md border border-hq-line px-1.5 py-0.5 text-[10px] text-hq-mute pointer-coarse:hidden">M</kbd>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close map"
            className="grid place-items-center rounded-full border border-hq-line p-1.5 transition-colors hover:bg-hq-bg pointer-coarse:size-11"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="relative aspect-square w-full">
          <canvas ref={canvas} className="size-full" aria-hidden />
          <ul aria-label="Places">
            {spots.map(({ s, left, top }) => (
              <li key={s.id} className="absolute -translate-x-1/2 translate-y-2.5" style={{ left: `${left}%`, top: `${top}%` }}>
                <button
                  type="button"
                  onClick={() => onTravel(s.id)}
                  aria-label={`Go to ${s.label}${charted.visited.has(s.id) ? ", visited" : ""}`}
                  className="flex min-h-7 items-center gap-1 whitespace-nowrap rounded-full border bg-white px-2 py-0.5 text-[11px] font-medium shadow-[0_6px_16px_-10px_rgba(0,0,0,0.35)] transition-colors hover:border-hq-accent pointer-coarse:min-h-11 pointer-coarse:px-3"
                  style={{ borderColor: s.id === charted.target ? ACCENT : undefined }}
                >
                  {charted.visited.has(s.id) && <Check className="size-3 text-hq-accent" strokeWidth={3} />}
                  <span className={cn(s.id === charted.target && "text-hq-accent")}>{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </motion.div>
  );
}
