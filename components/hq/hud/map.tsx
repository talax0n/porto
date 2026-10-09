import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Navigation2, X } from "lucide-react";
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
/**
 * The full map rescales each equidistant radius to equal-area (2·sin(d/2)). The landmarks all sit
 * within ~1.4 rad of anyone, and a linear disc out to the antipode piles their labels in the middle.
 */
const spread = (d: number, range: number) => (range === FULL ? Math.sin(d / 2) / Math.sin(FULL / 2) : d / range);
const REDRAW_MS = 66;
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
  const { n, heading } = ctl.player;
  const up = ctl.north;
  /** projects a unit position; false when it lies past the rim, after pinning it there */
  const place = (p: Vector3) => {
    mapXY(n, up, p, at);
    const d = Math.hypot(at.x, at.y);
    const inside = d <= range;
    const s = d > 0 ? (r * Math.min(1, spread(d, range))) / d : 0;
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
    ctx.arc(at.x, at.y, Math.max(3, r * spread(PLAZA / R, range)), 0, Math.PI * 2);
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

/** The map's header; the globe, its labels and the drag all live in the scene. */
export function MapChrome({ onClose }: { onClose: () => void }) {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced?.matches ? 0 : 0.2 }}
      role="dialog"
      aria-label="Map"
      className="absolute top-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-hq-line bg-white/90 py-1.5 pr-1.5 pl-4 text-hq-ink shadow-[0_12px_30px_-18px_rgba(0,0,0,0.25)] backdrop-blur sm:top-6"
    >
      <h2 className="font-display text-lg font-extrabold leading-none tracking-tight">Map</h2>
      <p className="whitespace-nowrap text-[11px] text-hq-mute">
        Drag to spin · <span className="pointer-coarse:hidden">Click</span>
        <span className="hidden pointer-coarse:inline">Tap</span> a place to go
      </p>
      <kbd className="rounded-md border border-hq-line px-1.5 py-0.5 text-[10px] text-hq-mute pointer-coarse:hidden">M</kbd>
      <button
        type="button"
        onClick={onClose}
        autoFocus
        aria-label="Close map"
        className="grid size-8 place-items-center rounded-full border border-hq-line transition-colors hover:bg-hq-bg pointer-coarse:size-11"
      >
        <X className="size-4" />
      </button>
    </motion.header>
  );
}

/** Screen-edge pointers to places out of view. The scene picks, places and turns them every frame. */
export function EdgeArrows({ target, onTravel }: { target: StationId | null; onTravel: (id: StationId) => void }) {
  return (
    <div aria-label="Places out of view" role="group">
      {STATIONS.map((s, i) => (
        <button
          key={s.id}
          type="button"
          ref={(el) => {
            ctl.edges[i] = el;
            return () => {
              ctl.edges[i] = null;
            };
          }}
          onClick={() => onTravel(s.id)}
          aria-label={`Go to ${s.label}`}
          style={{ visibility: "hidden" }}
          className={cn(
            "absolute top-0 left-0 z-10 flex items-center gap-1.5 rounded-full border bg-white/95 py-1 pr-2.5 pl-1 text-[11px] max-sm:size-11 max-sm:justify-center max-sm:p-0 font-medium text-hq-ink shadow-[0_8px_20px_-12px_rgba(0,0,0,0.35)] backdrop-blur transition-colors hover:border-hq-accent pointer-coarse:min-h-11",
            s.id === target ? "border-hq-accent" : "border-hq-line",
          )}
        >
          <span className="grid size-6 place-items-center rounded-full text-white" style={{ background: IDENTITY[s.id].top }}>
            <Navigation2 className="size-3.5 fill-current" aria-hidden />
          </span>
          <span className="max-sm:sr-only">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
