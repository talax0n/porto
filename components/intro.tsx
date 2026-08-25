"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplitText from "@/components/reactbits/SplitText";

const KEY = "intro-seen";
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/* Blank-background opening. Runs once per browser session, skippable,
   and skipped outright for reduced-motion. */
export function Intro() {
  const [phase, setPhase] = useState<"pending" | "playing" | "done">("pending");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      // private mode / storage blocked — treat as unseen, it only costs one play
    }
    // sessionStorage and matchMedia are client-only, so this cannot be decided during render
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase(reduced || seen ? "done" : "playing");
  }, []);

  const finish = useCallback(() => {
    setPhase((p) => (p === "playing" ? "done" : p));
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
  }, []);

  // Lock scroll while the overlay is up, and let any interaction dismiss it
  useEffect(() => {
    if (phase !== "playing") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(finish, 3800);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") finish();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", finish, { passive: true });
    window.addEventListener("touchmove", finish, { passive: true });

    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", finish);
      window.removeEventListener("touchmove", finish);
    };
  }, [phase, finish]);

  return (
    <AnimatePresence>
      {phase === "playing" && (
        <motion.div
          key="intro"
          role="presentation"
          onClick={finish}
          className="fixed inset-0 z-[9998] flex cursor-pointer flex-col items-center justify-center gap-6 px-[var(--pad)] text-center"
          style={{ background: "var(--bg)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: EASE } }}
        >
          <SplitText
            tag="h1"
            text="Hi, I'm Theo."
            className="font-[family-name:var(--font-syne)] text-[clamp(38px,8vw,92px)] leading-[1.05] font-extrabold tracking-[-0.045em]"
            splitType="chars"
            delay={45}
            duration={0.9}
            from={{ opacity: 0, y: 60 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0}
            rootMargin="0px"
          />

          <motion.p
            className="max-w-[52ch] text-[clamp(14px,1.6vw,18px)] leading-[1.7] font-light text-[var(--muted)]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 1.1 }}
          >
            A fullstack engineer from Tangerang who builds web platforms, mobile
            apps, and on-chain systems — end to end.
          </motion.p>

          <motion.span
            className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] text-[10px] tracking-[0.16em] text-[var(--muted)] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.1 }}
          >
            Tap anywhere to enter
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
