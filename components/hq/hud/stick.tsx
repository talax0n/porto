import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ctl } from "../game";

/** how far the knob's centre travels from the ring's, in px: the 112px ring less the 48px knob, halved */
const REACH = 32;
const DEAD = 0.12;

/** A touch joystick that writes `ctl.stick`; it ignores every pointer but the one that grabbed it. */
export function Stick() {
  const knob = useRef<HTMLSpanElement>(null);
  const grab = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(
    () => () => {
      ctl.stick.x = ctl.stick.y = 0;
    },
    [],
  );

  const aim = (e: React.PointerEvent) => {
    const g = grab.current;
    if (!g || e.pointerId !== g.id) return;
    let dx = e.clientX - g.x;
    let dy = e.clientY - g.y;
    const d = Math.hypot(dx, dy);
    if (d > REACH) {
      dx *= REACH / d;
      dy *= REACH / d;
    }
    knob.current!.style.transform = `translate(${dx}px, ${dy}px)`;
    // rescale past the dead zone so a push just outside it starts from a crawl, not a jump
    const m = Math.min(d, REACH) / REACH;
    const s = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD) / m / REACH;
    ctl.stick.x = dx * s;
    ctl.stick.y = -dy * s;
  };

  const release = (e: React.PointerEvent) => {
    if (e.pointerId !== grab.current?.id) return;
    grab.current = null;
    ctl.stick.x = ctl.stick.y = 0;
    const k = knob.current!;
    k.style.transform = "";
    delete k.dataset.active;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      aria-hidden
      onPointerDown={(e) => {
        if (grab.current) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        grab.current = { id: e.pointerId, x: r.left + r.width / 2, y: r.top + r.height / 2 };
        knob.current!.dataset.active = "";
        aim(e);
      }}
      onPointerMove={aim}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="grid size-28 touch-none place-items-center rounded-full border border-hq-line bg-white/80 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.3)] backdrop-blur select-none"
    >
      <span
        ref={knob}
        className="size-12 rounded-full border border-hq-line bg-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)] transition-[transform,border-color] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] data-active:border-2 data-active:border-hq-accent data-active:transition-none motion-reduce:transition-none"
      />
    </motion.div>
  );
}

/** The touch stand-in for Space. In water the player swims, so a tap there does nothing. */
export function JumpButton() {
  return (
    <button
      type="button"
      aria-label="Jump"
      onPointerDown={(e) => {
        e.preventDefault();
        ctl.jump = true;
      }}
      className="grid size-16 touch-none place-items-center rounded-full border border-hq-line bg-white/80 text-[12px] font-semibold text-hq-ink shadow-[0_10px_30px_-16px_rgba(0,0,0,0.3)] backdrop-blur select-none active:scale-95 active:border-hq-accent"
    >
      Jump
    </button>
  );
}
