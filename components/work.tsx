"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";

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

/* ─── Slider ─── */
const COLLAPSED_W = 200;
const EXPANDED_W = 340;
const GAP = 40;

function SliderStrip({
  project,
  index,
  isHovered,
  onHover,
  onLeave,
}: {
  project: Project;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <motion.article
      className="relative flex-shrink-0 cursor-pointer overflow-hidden border border-[var(--border)]"
      style={{ height: 560, borderRadius: "6px" }}
      animate={{
        width: isHovered ? EXPANDED_W : COLLAPSED_W,
        borderColor: isHovered ? "var(--border-hover)" : "var(--border)",
      }}
      initial={{ opacity: 0, y: 20, width: COLLAPSED_W }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6%" }}
      transition={{
        width: { duration: 0.55, ease: EASE },
        borderColor: { duration: 0.4 },
        opacity: { duration: 0.6, ease: EASE, delay: index * 0.06 },
        y: { duration: 0.6, ease: EASE, delay: index * 0.06 },
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={() => {
        window.location.href = `/projects/${slugify(project.title)}`;
      }}
    >
      {/* BG */}
      <motion.div
        className="absolute inset-0"
        style={{ background: project.gradient }}
        animate={{ scale: isHovered ? 1.06 : 1 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </motion.div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
        }}
      />

      {/* Top-left: number + WIP */}
      <div className="absolute top-0 left-0 z-10 flex items-center gap-2" style={{ padding: "14px 16px" }}>
        <span
          style={{
            fontSize: "9px",
            letterSpacing: "0.12em",
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {project.num}
        </span>
        {project.wip && (
          <span className="inline-flex items-center gap-[4px] rounded-full border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.1)] px-[6px] py-[2px] text-[7px] font-bold tracking-[0.06em] uppercase text-[#F59E0B]">
            <span
              className="h-1 w-1 shrink-0 rounded-full bg-[#F59E0B]"
              style={{ animation: "blink 2.2s ease infinite" }}
            />
            WIP
          </span>
        )}
      </div>

      {/* Right edge: category — vertical text */}
      <div
        className="absolute z-10 flex items-center gap-[6px]"
        style={{
          top: "14px",
          right: "12px",
          writingMode: "vertical-lr",
          textOrientation: "mixed",
        }}
      >
        <span
          style={{
            fontSize: "8px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "rgba(255,255,255,0.3)",
            whiteSpace: "nowrap",
          }}
        >
          {project.category}
        </span>
      </div>

      {/* Bottom: title */}
      <div className="absolute bottom-0 left-0 right-0 z-10" style={{ padding: "0 16px 18px" }}>
        <h3
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "clamp(16px, 1.4vw, 22px)",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "#fff",
          }}
        >
          {project.title.replace(/\n/g, " ")}
        </h3>
      </div>
    </motion.article>
  );
}

/* ─── List Row with spotlight ─── */
function ListRow({ project, index }: { project: Project; index: number }) {
  const rowRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      ref={rowRef}
      className="group relative cursor-pointer overflow-hidden border-b border-[var(--border)]"
      style={{ minHeight: 90 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6%" }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        window.location.href = `/projects/${slugify(project.title)}`;
      }}
    >
      {/* Background image/gradient — always present */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: project.gradient }}
      >
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </div>
      {/* Dim overlay — lightens on hover */}
      <motion.div
        className="absolute inset-0 z-[1]"
        animate={{ opacity: hovered ? 0 : 0.55 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{ background: "var(--bg)" }}
      />

      {/* Accent top line */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10"
        style={{ height: "2px", background: "var(--accent)", transformOrigin: "left" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 0",
          gap: "24px",
          position: "relative",
          zIndex: 5,
        }}
        className="max-[600px]:!flex-col max-[600px]:!items-start max-[600px]:!gap-3"
      >
        {/* Left: num + title */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "20px", flex: 1, minWidth: 0 }}>
          <motion.span
            animate={{ color: hovered ? "rgba(255,255,255,0.5)" : "var(--muted)" }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
              fontSize: "10px",
              letterSpacing: "0.1em",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {project.num}
          </motion.span>
          <motion.h3
            animate={{ color: hovered ? "#fff" : "var(--fg)" }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "clamp(20px, 2.8vw, 32px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textShadow: hovered ? "0 1px 8px rgba(0,0,0,0.5)" : "none",
            }}
          >
            {project.title.replace(/\n/g, " ")}
          </motion.h3>
        </div>

        {/* Right: category + wip + arrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexShrink: 0,
          }}
          className="max-[600px]:!ml-[30px]"
        >
          {project.wip && (
            <span className="inline-flex items-center gap-[5px] rounded-full border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] px-2 py-0.5 text-[8px] font-bold tracking-[0.06em] uppercase text-[#F59E0B]">
              <span
                className="h-1 w-1 shrink-0 rounded-full bg-[#F59E0B]"
                style={{ animation: "blink 2.2s ease infinite" }}
              />
              WIP
            </span>
          )}
          <motion.span
            animate={{ color: hovered ? "rgba(255,255,255,0.5)" : "var(--muted)" }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{
              fontSize: "9px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
            className="max-[900px]:!hidden"
          >
            {project.category}
          </motion.span>
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-full border"
            animate={{
              rotate: hovered ? 45 : 0,
              borderColor: hovered ? "rgba(255,255,255,0.4)" : "var(--border)",
              backgroundColor: hovered ? "#fff" : "transparent",
            }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <ArrowUpRight
              className="h-3 w-3"
              style={{ color: hovered ? "#000" : "var(--fg)", transition: "color 0.4s" }}
            />
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── View Toggle ─── */
function ViewToggle({
  view,
  onChange,
}: {
  view: "slider" | "list";
  onChange: (v: "slider" | "list") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        border: "1px solid var(--border)",
        borderRadius: "100px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => onChange("slider")}
        className="transition-all duration-[400ms]"
        style={{
          padding: "6px 14px",
          fontSize: "9px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: view === "slider" ? "var(--bg)" : "var(--muted)",
          background: view === "slider" ? "var(--fg)" : "transparent",
        }}
      >
        Slider
      </button>
      <button
        onClick={() => onChange("list")}
        className="transition-all duration-[400ms]"
        style={{
          padding: "6px 14px",
          fontSize: "9px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: view === "list" ? "var(--bg)" : "var(--muted)",
          background: view === "list" ? "var(--fg)" : "transparent",
        }}
      >
        List
      </button>
    </div>
  );
}

/* ─── Main ─── */
export function Work() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"slider" | "list">("slider");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    if (view !== "slider") return;
    const el = trackRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => checkScroll());
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, view]);


  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -(COLLAPSED_W + GAP) * 2 : (COLLAPSED_W + GAP) * 2,
      behavior: "smooth",
    });
  };

  return (
    <section id="work" style={{ padding: "140px 0" }} className="max-[900px]:!py-20">
      {/* Header */}
      <div
        style={{
          padding: "0 44px 24px",
          marginBottom: "48px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
        className="max-[900px]:!px-6 max-[900px]:!mb-8"
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
              fontSize: "clamp(60px, 9vw, 130px)",
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
            }}
          >
            Project
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <ViewToggle view={view} onChange={setView} />
          {view === "slider" && (canScrollLeft || canScrollRight) && (
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--fg)] transition-all duration-[400ms] hover:border-[var(--border-hover)] disabled:opacity-25 disabled:cursor-default"
                aria-label="Scroll left"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--fg)] transition-all duration-[400ms] hover:border-[var(--border-hover)] disabled:opacity-25 disabled:cursor-default"
                aria-label="Scroll right"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === "slider" ? (
          <motion.div
            key="slider"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: EASE }}
            ref={trackRef}
            style={{
              display: "flex",
              gap: `${GAP}px`,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              padding: "0 24px 0 44px",
              scrollbarWidth: "none",
            }}
            className="max-[900px]:!px-6 [&::-webkit-scrollbar]:hidden"
          >
            {projects.map((p, i) => (
              <div key={p.num} style={{ scrollSnapAlign: "start" }}>
                <SliderStrip
                  project={p}
                  index={i}
                  isHovered={hoveredIndex === i}
                  onHover={() => setHoveredIndex(i)}
                  onLeave={() => setHoveredIndex(null)}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ padding: "0 44px" }}
            className="max-[900px]:!px-6"
          >
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {projects.map((p, i) => (
                <ListRow key={p.num} project={p} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
