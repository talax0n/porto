"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const experience = [
  { company: "NeoTaste", role: "Product Designer", years: "2025 - Now" },
  { company: "Zattoo", role: "Product Designer", years: "2023 - 2025" },
  { company: "Gymondo", role: "Senior UI/UX Designer", years: "2019 - 2022" },
  { company: "VASS \u00D7 CaixaBank", role: "UI/UX Designer", years: "2017 - 2019" },
  { company: "SEAT", role: "UI/UX Designer", years: "2016" },
  { company: "Lafosca \u00B7 Mobile Jazz", role: "Junior UI Designer", years: "2015 - 2016" },
];

const awards = [
  { title: "Best Mobile Banking App, Western Europe", issuer: "Global Finance", year: "Sep 2018" },
  { title: "Best Mobile Tech Project", issuer: "The Banker Tech Project Awards", year: "Oct 2018" },
  { title: "Best Project - Innovative Touchpoints & Connected Services", issuer: "BAI Global Innovation Awards", year: "Oct 2018" },
  { title: "Silver - Digital New Service or Application", issuer: "London Design Awards", year: "Nov 2018" },
];

const skills = [
  "Systems Thinking", "Design Systems", "0\u21921 Product Work", "Cross-functional",
  "Data-informed Design", "Prototyping", "A/B Testing", "Research & Synthesis",
  "Best Slack Memes", "Stakeholder Alignment", "Design \u00D7 Engineering",
  "AI-assisted Workflows", "Product Strategy", "Good Vibes",
];

const sideBlockVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const, delay: i * 0.1 },
  }),
};

export function About() {
  return (
    <section id="about" className="px-11 py-[120px] max-[900px]:px-6 max-[900px]:py-20">
      {/* Header */}
      <div className="mb-16 flex items-center justify-between border-b border-[var(--border)] pb-5 max-[900px]:mb-10">
        <div>
          <p className="mb-2 text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">
            My story
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
                About
              </motion.span>
            </span>
          </h2>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-20 grid grid-cols-[1.1fr_0.9fr] gap-20 max-[900px]:mt-12 max-[900px]:grid-cols-1 max-[900px]:gap-12">
        {/* Bio */}
        <div>
          {[
            <>
              <strong className="font-light text-[var(--fg)]">Eight years in product design</strong>, working from Barcelona agencies to Berlin startups. I&apos;ve designed for banks, fitness platforms, a streaming service and a food tech app with over 2 million users.
            </>,
            <>
              <strong className="font-light text-[var(--fg)]">My process is research-first.</strong> I want to understand why users behave the way they do before I open Figma.
            </>,
            <>
              <strong className="font-light text-[var(--fg)]">I own the full design scope,</strong> from early research to shipped components. I like working in teams where decisions get debated properly, not just handed down.
            </>,
            <>
              Since 2018, I&apos;ve served on the <strong className="font-light text-[var(--fg)]">Awwwards Young Jury</strong>, which keeps me honest about craft quality across the industry.
            </>,
          ].map((content, i) => (
            <motion.p
              key={i}
              className="mb-6 text-[clamp(17px,1.7vw,22px)] font-light leading-[1.62] text-[var(--muted)] last:mb-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.65, ease: "easeOut", delay: i * 0.08 }}
            >
              {content}
            </motion.p>
          ))}

          <motion.a
            href="/cv.pdf"
            target="_blank"
            rel="noopener"
            className="mt-5 inline-flex items-center gap-[7px] rounded-full border border-[var(--border)] px-[15px] py-[7px] text-[11px] tracking-[0.08em] uppercase text-[var(--muted)] transition-all duration-300 hover:border-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            View CV
            <ArrowUpRight className="h-3 w-3" />
          </motion.a>
        </div>

        {/* Side */}
        <div className="flex flex-col gap-11">
          {/* Experience */}
          <motion.div
            variants={sideBlockVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            custom={0}
          >
            <h3 className="mb-4 text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">
              Experience
            </h3>
            <ul className="flex flex-col">
              {experience.map((e) => (
                <li
                  key={e.company}
                  className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-3.5"
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-sm font-bold tracking-[-0.01em]"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      {e.company}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{e.role}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">{e.years}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Awards */}
          <motion.div
            variants={sideBlockVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            custom={1}
          >
            <h3 className="mb-4 text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">
              Awards
            </h3>
            <ul className="flex flex-col">
              {awards.map((a) => (
                <li
                  key={a.title}
                  className="flex items-baseline justify-between gap-3 border-b border-[var(--border)] py-3.5"
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-sm font-bold tracking-[-0.01em]"
                      style={{ fontFamily: "var(--font-syne), sans-serif" }}
                    >
                      {a.title}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{a.issuer}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">{a.year}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Skills */}
          <motion.div
            variants={sideBlockVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            custom={2}
          >
            <h3 className="mb-4 text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">
              Skills
            </h3>
            <div className="flex flex-wrap gap-[7px]">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-[11px] tracking-[0.06em] text-[var(--muted)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
