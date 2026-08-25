"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/section-heading";

interface Award {
  title: string;
  issuer: string;
  year: string;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function Awards() {
  const [awards, setAwards] = useState<Award[]>([]);

  useEffect(() => {
    fetch("/api/awards")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAwards)
      .catch(() => {});
  }, []);

  if (awards.length === 0) return null;

  return (
    <section id="awards" style={{ padding: "var(--section-y) var(--pad)" }}>
      <SectionHeading eyebrow="Recognition" title="Awards" />

      <div className="grid grid-cols-1 gap-4 min-[601px]:grid-cols-2 min-[1101px]:grid-cols-3">
        {awards.map((a, i) => (
          <motion.article
            key={a.title + a.year}
            className="flex flex-col gap-3 rounded-xl border border-[var(--border)] p-6 transition-colors hover:border-[var(--border-hover)]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
          >
            <span className="text-[10px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
              {a.year}
            </span>
            <h3
              className="text-[19px] leading-[1.25] font-extrabold tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {a.title}
            </h3>
            <p className="mt-auto text-[13px] leading-[1.6] font-light text-[var(--muted)]">
              {a.issuer}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
