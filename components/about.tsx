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
    <section id="about" style={{ padding: "120px 44px" }} className="max-[900px]:!px-6 max-[900px]:!py-20">
      {/* Header */}
      <div style={{ paddingBottom: "20px", borderBottom: "1px solid var(--border)", marginBottom: "64px" }} className="flex items-center justify-between max-[900px]:!mb-10">
        <div>
          <p className="mb-2 text-[10px] tracking-[0.14em] uppercase text-[var(--muted)]">
            My story
          </p>
          <motion.h2
            className="text-[clamp(52px,8vw,110px)] font-extrabold leading-[0.88] tracking-[-0.045em] max-[480px]:text-[14vw]"
            style={{ fontFamily: "var(--font-syne), sans-serif", overflow: "hidden", paddingBottom: "0.15em" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.01 }}
          >
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.05, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              About
            </motion.span>
          </motion.h2>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "80px", marginTop: "80px" }} className="max-[900px]:!grid-cols-1 max-[900px]:!gap-12 max-[900px]:!mt-12">
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
        <div style={{ display: "flex", flexDirection: "column", gap: "44px" }}>
          {/* Experience */}
          <motion.div
            variants={sideBlockVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-12%" }}
            custom={0}
          >
            <h3 style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "16px" }}>
              Experience
            </h3>
            <ul style={{ display: "flex", flexDirection: "column" }}>
              {experience.map((e) => (
                <li
                  key={e.company}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "14px 0",
                    borderBottom: "1px solid var(--border)",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {e.company}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{e.role}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }}>{e.years}</span>
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
            <h3 style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "16px" }}>
              Awards
            </h3>
            <ul style={{ display: "flex", flexDirection: "column" }}>
              {awards.map((a) => (
                <li
                  key={a.title}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "14px 0",
                    borderBottom: "1px solid var(--border)",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {a.title}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{a.issuer}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }}>{a.year}</span>
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
            <h3 style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "16px" }}>
              Skills
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {skills.map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    padding: "6px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "100px",
                    color: "var(--muted)",
                  }}
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
