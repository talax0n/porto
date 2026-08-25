"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/section-heading";
import { SKILL_CATEGORIES } from "@/lib/skill-categories";

interface Skill {
  name: string;
  category: string;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSkills)
      .catch(() => {});
  }, []);

  // Known categories first, in schema order; anything unrecognised trails behind.
  const groups = useMemo(() => {
    const byCategory = new Map<string, string[]>();
    for (const s of skills) {
      const list = byCategory.get(s.category) ?? [];
      list.push(s.name);
      byCategory.set(s.category, list);
    }
    const known = SKILL_CATEGORIES.filter((c) => byCategory.has(c));
    const extra = [...byCategory.keys()].filter(
      (c) => !(SKILL_CATEGORIES as readonly string[]).includes(c)
    );
    return [...known, ...extra].map((c) => ({
      category: c,
      items: byCategory.get(c)!,
    }));
  }, [skills]);

  if (groups.length === 0) return null;

  return (
    <section id="skills" style={{ padding: "var(--section-y) var(--pad)" }}>
      <SectionHeading eyebrow="What I work with" title="Skills" />

      <div className="flex flex-col">
        {groups.map((g, i) => (
          <motion.div
            key={g.category}
            className="grid grid-cols-1 gap-4 border-b border-[var(--border)] py-7 min-[901px]:grid-cols-[220px_1fr] min-[901px]:gap-10"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.6, ease: EASE, delay: i * 0.05 }}
          >
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase min-[901px]:pt-1.5">
              {g.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {g.items.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-[var(--border)] px-4 py-1.5 text-[13px] transition-colors hover:border-[var(--border-hover)]"
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
