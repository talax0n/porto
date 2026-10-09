import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { type Group, Vector3 } from "three";
import { INTRO } from "@/data/onboarding";
import { cn } from "@/lib/utils";
import { ctl } from "../game";
import { R } from "./planet";

const side = new Vector3();
const touch =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;
const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface IntroBubbleProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

/** The player's speech bubble: beside the head on wide screens, under the feet on phones. */
export function IntroBubble({ step, onNext, onSkip }: IntroBubbleProps) {
  const anchor = useRef<Group>(null);

  useFrame(({ size }) => {
    const g = anchor.current;
    if (!g) return;
    const n = ctl.player.n;
    g.position.copy(n).multiplyScalar(R + ctl.alt + 0.45);
    // the close-up looks along the carried north, so screen-right is north × up
    if (size.width < 640) g.position.addScaledVector(n, -0.75);
    else g.position.addScaledVector(side.crossVectors(ctl.north, n), 0.62);
  });

  const last = step === INTRO.length - 1;
  const typing = useTyping(step);
  const narrow = typeof window !== "undefined" && window.innerWidth < 640;
  return (
    <group ref={anchor}>
      <Html zIndexRange={[16, 0]}>
        <div
          role="dialog"
          aria-label="Intro"
          className="flex w-[min(300px,calc(100vw-24px))] -translate-y-1/2 flex-col items-start gap-1.5 max-sm:-translate-x-1/2 max-sm:translate-y-3"
        >
          {/* phones put the newest line right under the speaker, so the thread reads upward there */}
          <div className="flex flex-col items-start gap-1.5 max-sm:flex-col-reverse">
            {INTRO.slice(0, step + 1).map((line, i) => {
              const current = i === step;
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={onNext}
                  tabIndex={current ? 0 : -1}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: current ? 1 : 0.55, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  style={{ originX: 0, originY: narrow ? 0 : 1 }}
                  className={cn(
                    "relative max-w-full rounded-[22px] bg-white px-4 py-2.5 text-left text-[15px] leading-snug text-hq-ink [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.18))_drop-shadow(0_6px_14px_rgba(0,0,0,0.1))]",
                    // the tail points back at the speaker: left on wide screens, up on phones
                    current &&
                      "rounded-bl-md before:absolute before:-left-1.5 before:bottom-2.5 before:size-4 before:rotate-45 before:rounded-[3px] before:bg-white max-sm:rounded-bl-[22px] max-sm:rounded-tl-md max-sm:before:-top-1.5 max-sm:before:bottom-auto max-sm:before:left-5",
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
          </div>
          <div className="mt-1 flex w-full items-center gap-2 pl-1">
            <ol
              className="flex flex-1 gap-1.5"
              aria-label={`Step ${step + 1} of ${INTRO.length}`}
            >
              {INTRO.map((_, i) => (
                <li
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-[width,background-color] duration-300",
                    i === step ? "w-4 bg-hq-accent" : "w-1.5 bg-hq-ink/15",
                  )}
                />
              ))}
            </ol>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full px-2 py-1.5 text-[11px] text-hq-mute transition-colors hover:text-hq-ink max-sm:min-h-11 max-sm:px-3"
            >
              Skip intro
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-hq-accent px-3.5 py-1.5 text-[12px] font-semibold text-white max-sm:min-h-11 max-sm:min-w-11 max-sm:px-4"
            >
              {last ? "Let's go" : "Next"}
            </button>
          </div>
        </div>
      </Html>
    </group>
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
