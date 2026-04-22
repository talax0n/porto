"use client";

import { motion } from "framer-motion";

const EASE_POWER3: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const lineReveal = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: 0,
    transition: { duration: 1.05, ease: EASE_POWER3, delay: i * 0.1 + 0.05 },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: "easeOut" as const, delay },
  }),
};

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex flex-col justify-end max-[900px]:px-6 max-[900px]:pb-10"
      style={{ minHeight: "100svh", paddingLeft: 80, paddingRight: 64, paddingBottom: 160 }}
    >
        {/* Eyebrow */}
        <div className="mb-5 overflow-hidden text-[11px] tracking-[0.14em] uppercase text-[var(--muted)]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, ease: EASE_POWER3, delay: 0.5 }}
          >
            Fullstack Engineer
          </motion.span>
        </div>

        {/* Title */}
        <h1
          className="text-[clamp(72px,12vw,176px)] font-extrabold leading-[0.88] tracking-[-0.05em] max-[480px]:text-[15vw]"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          {["Theo", "Niomba"].map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <motion.span
                className="block"
                variants={lineReveal}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

      {/* Bottom row — pinned to bottom corners */}
      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 80,
          right: 64,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        <motion.p
          style={{
            maxWidth: 320,
            fontSize: 14,
            fontWeight: 300,
            lineHeight: 1.65,
            color: "var(--muted)",
          }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.65}
        >
          Based in Tangerang, Indonesia. 2 years of experience building scalable web applications for the e-commerce, fintech, and healthcare sectors.
        </motion.p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          {[
            { text: "Available for work", available: true },
            { text: "Tangerang, Indonesia", available: false },
          ].map((pill, i) => (
            <motion.div
              key={pill.text}
              className={pill.available ? "pill-available" : ""}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 9999,
                border: pill.available ? undefined : "1px solid var(--border)",
                padding: "6px 16px",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: pill.available ? undefined : "var(--muted)",
              }}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.55,
                ease: "easeOut",
                delay: 0.75 + i * 0.1,
              }}
            >
              {pill.available && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "currentColor",
                    flexShrink: 0,
                    animation: "blink 2.2s ease infinite",
                  }}
                />
              )}
              {pill.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll hint — top right, below nav */}
      <motion.div
        className="absolute top-[100px] right-11 flex flex-col items-center gap-2.5 max-[900px]:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        aria-hidden
      >
        <div className="relative h-16 w-px overflow-hidden bg-[var(--border)]">
          <div
            className="absolute left-0 h-full w-full bg-[var(--accent)]"
            style={{ animation: "shline 2.4s ease infinite" }}
          />
        </div>
        <span className="text-[9px] tracking-[0.18em] uppercase text-[var(--muted)] [writing-mode:vertical-lr]">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
