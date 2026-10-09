import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { type Group, Vector3 } from "three";
import { INTRO } from "@/data/onboarding";
import { cn } from "@/lib/utils";
import { ctl } from "../game";
import { R } from "./planet";

const side = new Vector3();
const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

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

  const line = INTRO[step];
  const last = step === INTRO.length - 1;
  return (
    <group ref={anchor}>
      <Html zIndexRange={[16, 0]}>
        <div
          role="dialog"
          aria-label="Intro"
          className="w-[min(320px,calc(100vw-24px))] -translate-y-1/2 max-sm:-translate-x-1/2 max-sm:translate-y-3"
        >
          <div className="rounded-3xl border border-hq-line bg-white p-4 text-hq-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,0.3)]">
            <button type="button" onClick={onNext} className="block w-full text-left" aria-live="polite">
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="block font-display text-[19px] font-bold leading-snug tracking-tight max-sm:text-[17px]"
              >
                {(touch && line.touch) || line.text}
              </motion.span>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <ol className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of ${INTRO.length}`}>
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
        </div>
      </Html>
    </group>
  );
}
