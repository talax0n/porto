"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface Project {
  num: string;
  company: string;
  title: string;
  year: string;
  tags: string[];
  metrics: { value: string; label: string }[];
  gradient: string;
  blobColor: string;
  href?: string;
  wip?: boolean;
}

const projects: Project[] = [
  {
    num: "01",
    company: "NeoTaste / 2025 - 2026",
    title: "Turning free trial users into\nloyal members",
    year: "",
    tags: ["Retention", "Gamification"],
    metrics: [
      { value: "+22%", label: "Trial-to-paid\nconversion uplift" },
      { value: "~48%", label: "Quest completion rate" },
    ],
    gradient: "linear-gradient(145deg, #001A0A 0%, #004A20 55%, #00A854 100%)",
    blobColor: "#00C96B",
    href: "/neotaste-quests",
  },
  {
    num: "02",
    company: "NeoTaste / 2025 - 2026",
    title: "Finding the right incentive to double referral volume",
    year: "",
    tags: ["Growth", "A/B Testing"],
    metrics: [
      { value: "+148%", label: "Total referral\nvolume growth" },
      { value: "5.2%", label: "Final referral rate\n(was 2.1%)" },
    ],
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
      <div className="grid min-h-[400px] grid-cols-2 max-[900px]:grid-cols-1">
        {/* Info */}
        <div className="flex flex-col justify-between gap-5 p-10 max-[900px]:p-7 max-[480px]:p-6">
          <div className="flex items-center gap-3.5">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[var(--muted)]">
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

          <div className="flex flex-1 flex-col justify-start gap-3.5 py-1">
            <p className="text-xs text-[var(--muted)]">{project.company}</p>
            <h3
              className="text-[clamp(22px,2.8vw,40px)] font-extrabold leading-[1.08] tracking-[-0.03em] max-[480px]:text-[7vw] whitespace-pre-line"
            >
              {project.title}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] px-[11px] py-1 text-[9px] tracking-[0.1em] uppercase text-[var(--muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-8">
            {project.metrics.map((m) => (
              <div key={m.value} className="flex flex-col gap-[3px]">
                <span className="text-[30px] font-extrabold tracking-[-0.04em] text-[var(--muted)]">
                  {m.value}
                </span>
                <span className="max-w-[130px] text-[11px] leading-[1.35] text-[var(--muted)] whitespace-pre-line">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="relative overflow-hidden max-[900px]:order-[-1] max-[900px]:h-[220px]">
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
    <section id="work" className="px-11 py-[120px] max-[900px]:px-6 max-[900px]:py-20">
      {/* Header */}
      <div className="mb-16 flex items-center justify-between border-b border-[var(--border)] pb-5 max-[900px]:mb-10">
        <div>
          <p className="mb-2 text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">
            Selected Projects
          </p>
          <h2
            className="text-[clamp(52px,8vw,110px)] font-extrabold leading-[0.88] tracking-[-0.045em] max-[480px]:text-[14vw]"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-12%" }}
                transition={{ duration: 1.05, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Work
              </motion.span>
            </span>
          </h2>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        {projects.map((p, i) => (
          <ProjectCard key={p.num} project={p} index={i} />
        ))}
      </div>

      {/* PDF strip */}
      <motion.div
        className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--border)] pt-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        <div>
          <p className="mb-1 text-sm font-semibold">Looking for more?</p>
          <p className="text-[13px] leading-[1.5] text-[var(--muted)]">
            More work from my time at Gymondo is available as a PDF, including a conversion project
            and a retention feature.
          </p>
        </div>
        <a
          href="/portfolio.pdf"
          target="_blank"
          rel="noopener"
          className="inline-flex shrink-0 items-center gap-[7px] rounded-full border border-[var(--border)] px-[15px] py-[7px] text-[11px] tracking-[0.08em] uppercase text-[var(--muted)] transition-all duration-300 hover:border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)]"
        >
          View PDF
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </motion.div>
    </section>
  );
}
