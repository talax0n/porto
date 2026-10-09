"use client";

import { useEffect, useId, useRef } from "react";
import { newLook, skyNow } from "./scene/sky";

/** mulberry32, so server and client render the same stars */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const STARS = (() => {
  const next = rng(7);
  return Array.from({ length: 80 }, () => ({
    x: r2(next() * 100),
    y: r2(next() * 60),
    size: r2(1 + next() * 1.6),
    opacity: r2(0.45 + next() * 0.55),
    dur: r2(2.5 + next() * 3.5),
    delay: r2(-next() * 6),
  }));
})();

const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;

/** Parks a body on the arc: `p` runs 0 → 1 across the sky, fading and shrinking toward either end so it sets. */
function place(el: HTMLElement, p: number, lit: number) {
  const arc = Math.sin(Math.PI * p);
  const o = Math.min(1, arc * 4) * lit;
  el.style.left = `${10 + 80 * p}%`;
  el.style.top = `${40 - 28 * arc}%`;
  el.style.opacity = String(o);
  el.style.transform = `translate(-50%, -50%) scale(${0.6 + 0.4 * Math.min(1, arc * 4)})`;
}

/** The Jakarta sky behind the canvas: gradient, sun, moon and stars, all driven by the clock. */
export function Sky() {
  const root = useRef<HTMLDivElement>(null);
  const stars = useRef<HTMLDivElement>(null);
  const sun = useRef<HTMLDivElement>(null);
  const moon = useRef<HTMLDivElement>(null);
  const mask = useId();

  useEffect(() => {
    const look = newLook();
    // quantized so a full-screen gradient only repaints when something is visibly different
    let top = -1;
    let bottom = -1;
    // on the parent, so the HUD beside the sky can read them too
    const host = root.current?.parentElement?.style;
    let night = -1;
    let sunKey = -1;
    let moonKey = -1;
    let id = 0;
    const tick = () => {
      skyNow(look);
      if (look.top !== top || look.bottom !== bottom) {
        top = look.top;
        bottom = look.bottom;
        host?.setProperty("--sky-top", hex(top));
        host?.setProperty("--sky-bottom", hex(bottom));
        host?.setProperty("--sky-ink", hex(look.ink));
        host?.setProperty("--sky-mute", hex(look.mute));
      }
      const n = Math.round((1 - look.day) * 1000);
      if (n !== night && stars.current) {
        night = n;
        stars.current.style.opacity = String(n / 1000);
      }
      const s = Math.round(look.sun * 1000);
      if (s !== sunKey && sun.current) {
        sunKey = s;
        place(sun.current, s / 1000, 1);
      }
      const m = Math.round(look.moon * 1000);
      if (m * 1001 + n !== moonKey && moon.current) {
        moonKey = m * 1001 + n;
        place(moon.current, m / 1000, n / 1000);
      }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: "linear-gradient(var(--sky-top, #e4eeff), var(--sky-bottom, #ffffff))" }}
    >
      <div ref={stars} className="absolute inset-0" style={{ opacity: 0 }}>
        {STARS.map((s, i) => (
          <i
            key={i}
            className="star absolute rounded-full bg-white"
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
                "--d": `${s.dur}s`,
                animationDelay: `${s.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div
        ref={sun}
        className="absolute size-44 rounded-full will-change-transform"
        style={{
          opacity: 0,
          background:
            "radial-gradient(circle, #fff8d6 0%, #ffd964 16%, rgba(255,196,80,.55) 30%, rgba(255,196,80,0) 70%)",
        }}
      />
      <div
        ref={moon}
        className="absolute will-change-transform"
        style={{ opacity: 0, filter: "drop-shadow(0 0 14px rgba(190,205,255,.65))" }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64">
          <mask id={mask}>
            <rect width="64" height="64" fill="#fff" />
            <circle cx="43" cy="26" r="20" fill="#000" />
          </mask>
          <circle cx="32" cy="32" r="24" fill="#f4f0d8" mask={`url(#${mask})`} />
        </svg>
      </div>
    </div>
  );
}
