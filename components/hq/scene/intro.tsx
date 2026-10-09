import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { type Group, Vector3 } from "three";
import { INTRO } from "@/data/onboarding";
import { cn } from "@/lib/utils";
import { ctl } from "../game";
import { R } from "./planet";

const side = new Vector3();
/** from the bubble anchor up past the hat with room for the cheer hop, so the phone thread never covers the head */
const HEAD_TOP = 0.8;
const touch =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;
const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The 3D close-up grows with the screen, so the bubble grows with it; phones and small laptops stay at 1. */
export function introScale(width: number, height: number) {
  return Math.min(1.75, Math.max(1, Math.min(height / 720, width / 1152)));
}

interface IntroBubbleProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

/** The player's speech bubble: beside the head on wide screens, above it on phones. */
export function IntroBubble({ step, onNext, onSkip }: IntroBubbleProps) {
  const anchor = useRef<Group>(null);

  useFrame(({ size }) => {
    const g = anchor.current;
    if (!g) return;
    const n = ctl.player.n;
    g.position.copy(n).multiplyScalar(R + ctl.alt + 0.45);
    // the close-up looks along the carried north, so screen-right is north × up
    if (size.width < 640) g.position.addScaledVector(n, HEAD_TOP);
    else g.position.addScaledVector(side.crossVectors(ctl.north, n), 0.62);
  });

  const scale = useThree(({ size }) => introScale(size.width, size.height));
  const typing = useTyping(step);
  const narrow = typeof window !== "undefined" && window.innerWidth < 640;
  // short phones can't fit four bubbles above the head without reaching the wordmark
  const first = narrow && window.innerHeight < 800 ? Math.max(0, step - 2) : 0;
  return (
    <group ref={anchor}>
      <Html zIndexRange={[16, 0]}>
        {/* scaled about the anchor, so the bubble's offsets from the head scale with it */}
        <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <div
          role="dialog"
          aria-label="Intro"
          className="flex w-[min(300px,calc(100vw-24px))] -translate-y-1/2 flex-col items-start gap-1.5 max-sm:w-[min(320px,calc(100vw-32px))] max-sm:-translate-x-1/2 max-sm:-translate-y-full max-sm:items-center"
        >
          {INTRO.slice(first, step + 1).map((line, j) => {
            const i = first + j;
            const current = i === step;
            return (
              <motion.button
                key={i}
                type="button"
                onClick={onNext}
                tabIndex={current ? 0 : -1}
                layout
                initial={{ opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: current ? 1 : narrow ? 0.45 : 0.55, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                style={{ originX: narrow ? 0.5 : 0, originY: 1 }}
                className={cn(
                  "relative max-w-full rounded-[22px] bg-white px-4 py-2.5 text-left text-[15px] leading-snug text-hq-ink [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.18))_drop-shadow(0_6px_14px_rgba(0,0,0,0.1))]",
                  // the tail points back at the speaker: left on wide screens, down on phones
                  current &&
                    "rounded-bl-md before:absolute before:-left-1.5 before:bottom-2.5 before:size-4 before:rotate-45 before:rounded-[3px] before:bg-white max-sm:mb-1.5 max-sm:rounded-bl-[22px] max-sm:before:-bottom-1.5 max-sm:before:left-1/2 max-sm:before:-translate-x-1/2",
                )}
                aria-live={current ? "polite" : undefined}
              >
                {current && typing ? (
                  <Dots />
                ) : (
                  (touch && line.touch) || line.text
                )}
              </motion.button>
            );
          })}
          <IntroControls step={step} onNext={onNext} onSkip={onSkip} className="mt-1 pl-1 max-sm:hidden" />
        </div>
        </div>
      </Html>
    </group>
  );
}

/**
 * Progress, Skip and Next. Beside the thread on wide screens; on phones `hq.tsx` pins it to the
 * bottom of the screen instead, in thumb reach and clear of the bubbles.
 */
export function IntroControls({ step, onNext, onSkip, bar, className }: IntroBubbleProps & { bar?: boolean; className?: string }) {
  const last = step === INTRO.length - 1;
  return (
    <div className={cn("flex w-full items-center gap-2", bar && "flex-wrap gap-y-3", className)}>
      <ol
        className={cn("flex flex-1 gap-1.5", bar && "basis-full justify-center")}
        aria-label={`Step ${step + 1} of ${INTRO.length}`}
      >
        {INTRO.map((_, i) => (
          <li
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-300",
              i === step ? "w-4 bg-hq-accent" : "w-1.5 bg-(--sky-ink,#111111) opacity-20",
            )}
          />
        ))}
      </ol>
      <button
        type="button"
        onClick={onSkip}
        className={cn(
          "rounded-full px-2 py-1.5 text-[11px] text-(--sky-mute,#6b6b6b) transition-colors hover:text-(--sky-ink,#111111)",
          bar && "min-h-12 px-4 text-[14px]",
        )}
      >
        Skip intro
      </button>
      <button
        type="button"
        onClick={onNext}
        className={cn(
          "rounded-full bg-hq-accent px-3.5 py-1.5 text-[12px] font-semibold text-white",
          bar && "min-h-12 flex-1 text-[15px] shadow-[0_12px_30px_-12px_rgba(43,60,255,0.6)]",
        )}
      >
        {last ? "Let's go" : "Next"}
      </button>
    </div>
  );
}

/** A beat of "typing…" before each new line, like a chat reply. */
function useTyping(step: number) {
  const [shown, setShown] = useState(-1);
  useEffect(() => {
    const t = setTimeout(() => setShown(step), reduced ? 0 : 420);
    return () => clearTimeout(t);
  }, [step]);
  return shown !== step;
}

function Dots() {
  return (
    <span className="flex h-[1.375em] items-center gap-1" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-hq-ink/40"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </span>
  );
}
