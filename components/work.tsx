"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface Project {
  num: string;
  title: string;
  techStack: string[];
  gradient: string;
  blobColor: string;
  href?: string;
  wip?: boolean;
}

const projects: Project[] = [
  {
    num: "01",
    title: "Turning free trial users into\nloyal members",
    techStack: ["Retention", "Gamification"],
    gradient: "linear-gradient(145deg, #001A0A 0%, #004A20 55%, #00A854 100%)",
    blobColor: "#00C96B",
    href: "/neotaste-quests",
  },
  {
    num: "02",
    title: "Finding the right incentive to double referral volume",
    techStack: ["Growth", "A/B Testing"],
    gradient: "linear-gradient(145deg, #001209 0%, #003D1A 55%, #00C96B 100%)",
    blobColor: "#00C96B",
    wip: true,
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.article
      className={`group overflow-hidden rounded-[var(--radius)] border border-[var(--border)] transition-[border-color] duration-[400ms] ${
        project.wip ? "pointer-events-none" : "cursor-pointer"
      } hover:border-[var(--border-hover)]`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.75, ease: "easeOut", delay: index * 0.08 }}
      onClick={() => {
        if (project.href && !project.wip) window.location.href = project.href;
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "42% 58%",
          minHeight: "520px",
        }}
        className="max-[900px]:!grid-cols-1 max-[900px]:!min-h-0"
      >
        {/* Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "16px",
            padding: "48px 44px",
          }}
          className="max-[900px]:!p-7 max-[480px]:!p-6"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", color: "var(--muted)" }}>
              {project.num}
            </span>
            {project.wip && (
              <span className="inline-flex items-center gap-[7px] rounded-full border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.12)] px-3 py-[5px] text-[10px] font-bold tracking-[0.06em] uppercase text-[#F59E0B]">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]"
                  style={{ animation: "blink 2.2s ease infinite" }}
                />
                Work in progress
              </span>
            )}
          </div>

          <h3
            style={{
              fontSize: "clamp(24px, 2.8vw, 38px)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              whiteSpace: "pre-line",
            }}
          >
            {project.title}
          </h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
            {project.techStack.map((tech) => (
              <span
                key={tech}
                style={{
                  borderRadius: "9999px",
                  border: "1px solid var(--border)",
                  padding: "4px 11px",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div
          style={{ position: "relative", overflow: "hidden" }}
          className="max-[900px]:order-[-1] max-[900px]:h-[260px]"
        >
          <div
            className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.06]"
            style={{ background: project.gradient }}
          />
          {/* Blobs */}
          <div
            className="absolute -top-20 -right-[60px] h-[320px] w-[320px] rounded-full opacity-[0.22] transition-all duration-[900ms] group-hover:opacity-[0.38] group-hover:scale-[1.2] group-hover:rotate-[20deg]"
            style={{ background: project.blobColor }}
          />
          <div
            className="absolute bottom-[30px] right-[70px] h-[200px] w-[200px] rounded-full opacity-[0.1] transition-all duration-[900ms] group-hover:opacity-[0.38] group-hover:scale-[1.2] group-hover:rotate-[20deg]"
            style={{ background: project.blobColor }}
          />
          {/* Arrow */}
          {!project.wip && (
            <div className="absolute bottom-6 right-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.18] transition-all duration-300 group-hover:rotate-45 group-hover:border-white group-hover:bg-white">
              <ArrowUpRight className="h-3.5 w-3.5 stroke-white group-hover:stroke-black" />
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function Work() {
  return (
    <section id="work" style={{ padding: "140px 44px" }} className="max-[900px]:!px-6 max-[900px]:!py-20">
      {/* Header */}
      <div style={{ marginBottom: "64px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }} className="max-[900px]:!mb-10">
        <p style={{ marginBottom: "10px", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>
          Selected Projects
        </p>
        <h2
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "clamp(60px, 9vw, 130px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.045em",
          }}
        >
         Project
        </h2>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.num} project={p} index={i} />
        ))}
      </div>

     
    </section>
  );
}
