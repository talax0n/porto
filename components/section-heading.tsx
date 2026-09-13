"use client";

import { motion } from "framer-motion";

/* Shared section header — eyebrow + oversized display title on a rule. */
export function SectionHeading({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[var(--border)] pb-5 min-[901px]:mb-16">
      <div>
        <p className="mb-2 text-[10px] tracking-[0.14em] text-[var(--muted)] uppercase">
          {eyebrow}
        </p>
        <h2
          className="overflow-hidden pb-[0.15em] text-[clamp(32px,10vw,110px)] leading-[0.88] font-extrabold tracking-[-0.045em]"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {title}
          </motion.span>
        </h2>
      </div>
      {aside}
    </div>
  );
}
