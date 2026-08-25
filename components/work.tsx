"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import AccordionGallery, {
  type AccordionGalleryItem,
} from "@/components/reactbits/AccordionGallery";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface Project {
  id?: string;
  num: string;
  title: string;
  category: string;
  techStack: string[];
  gradient: string;
  image?: string;
  href?: string;
  wip?: boolean;
}

export function Work() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const items = useMemo<AccordionGalleryItem[]>(
    () =>
      projects.map((p) => ({
        image: p.image || "",
        gradient: p.gradient,
        label: p.title.replace(/\n/g, " "),
        sublabel: `${p.num} — ${p.category}`,
        badge: p.wip ? "WIP" : undefined,
        link: `/projects/${slugify(p.title)}`,
        alt: p.title.replace(/\n/g, " "),
      })),
    [projects]
  );

  return (
    <section
      id="work"
      style={{ paddingTop: "var(--section-y)", paddingBottom: "var(--section-y)" }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0 var(--pad) 24px",
          marginBottom: "clamp(28px, 5vw, 48px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div>
          <p
            style={{
              marginBottom: "10px",
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Selected Projects
          </p>
          <h2
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "clamp(52px, 9vw, 130px)",
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
            }}
          >
            Project
          </h2>
        </div>

        <p className="mb-2 hidden shrink-0 text-[10px] tracking-[0.12em] whitespace-nowrap text-[var(--muted)] uppercase min-[601px]:block">
          {compact ? "Tap to expand" : "Hover to expand"}
        </p>
      </div>

      {/* Accordion */}
      <motion.div
        style={{ padding: "0 var(--pad)" }}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {items.length > 0 && (
          <AccordionGallery
            items={items}
            orientation={compact ? "vertical" : "horizontal"}
            trigger={compact ? "click" : "hover"}
            height={compact ? 380 : 560}
            gap={compact ? 8 : 12}
            radius={8}
            expandRatio={compact ? 0.5 : 0.42}
            accentColor="var(--accent)"
            overlayColor="#0C0C0B"
            textColor="#ffffff"
            tilt={compact ? 0 : 6}
            parallax={compact ? 0.2 : 0.5}
            grayscale={false}
          />
        )}
      </motion.div>
    </section>
  );
}
