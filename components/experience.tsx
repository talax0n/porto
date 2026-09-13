"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/section-heading";
import { EXPERIENCE } from "@/data/experience";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function Experience() {
  const entries = EXPERIENCE;

  return (
    <section
      id="experience"
      style={{ padding: "var(--section-y) var(--pad)" }}
    >
      <SectionHeading eyebrow="Where I've worked" title="Experience" />

      <ol>
        {entries.map((e, i) => (
          <motion.li
            key={e.company + e.years}
            className="grid grid-cols-1 gap-2 border-b border-[var(--border)] py-7 min-[901px]:grid-cols-[minmax(240px,1fr)_1.4fr_auto] min-[901px]:items-baseline min-[901px]:gap-12"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
          >
            <span className="order-2 text-[11px] tracking-[0.1em] text-[var(--muted)] uppercase min-[901px]:order-3 min-[901px]:text-right">
              {e.years}
            </span>
            <h3
              className="order-1 text-[clamp(20px,2.4vw,28px)] leading-[1.15] font-extrabold tracking-[-0.02em] min-[901px]:order-1"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {e.company}
            </h3>
            <p className="order-3 text-[15px] leading-[1.6] font-light text-[var(--muted)] min-[901px]:order-2">
              {e.role}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
