"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const sideBlockVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const, delay: i * 0.1 },
  }),
};

export function About() {
  const [experience, setExperience] = useState<{ company: string; role: string; years: string }[]>([]);
  const [awards, setAwards] = useState<{ title: string; issuer: string; year: string }[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/experience").then((r) => r.json()),
      fetch("/api/awards").then((r) => r.json()),
      fetch("/api/skills").then((r) => r.json()),
    ]).then(([e, a, s]) => {
      setExperience(e);
      setAwards(a);
      setSkills(s);
    }).catch(() => {});
  }, []);

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
    <strong className="font-light text-[var(--fg)]">2 years in software engineering</strong>, building everything from robust web platforms to cross-platform mobile apps. I&apos;ve developed complex backend systems, shipped games in Unity, and deployed smart contracts on Solana and Ethereum.
  </>,
  <>
    <strong className="font-light text-[var(--fg)]">My process is architecture-first.</strong> I need to understand the data flow, security requirements, and business logic before I spin up a Docker container or write a single line of code.
  </>,
  <>
    <strong className="font-light text-[var(--fg)]">I own the full technical scope,</strong> from designing database schemas to delivering highly responsive React frontends. I thrive in teams where technical decisions are driven by product goals, not just the latest framework hype.
  </>,
  <>
    Lately, I&apos;ve been heavily focused on integrating <strong className="font-light text-[var(--fg)]">AI-assisted workflows and agentic coding</strong> into my daily process, which allows me to ship cleaner code and build smarter systems faster than ever.
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
            className="cv-btn"
            style={{
              marginTop: "20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "100px",
              padding: "7px 15px",
              color: "var(--muted)",
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.3s ease",
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            View CV
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12L12 2M12 2H4M12 2V10" />
            </svg>
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
