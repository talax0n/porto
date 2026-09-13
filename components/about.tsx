"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/section-heading";

/* Drop cv.pdf into /public to enable the View/Download buttons below. */
const CV_URL = "/cv.pdf";

export function About() {
  const [cvAvailable, setCvAvailable] = useState(false);

  useEffect(() => {
    fetch(CV_URL, { method: "HEAD" })
      .then((r) => setCvAvailable(r.ok))
      .catch(() => setCvAvailable(false));
  }, []);

  return (
    <section
      id="about"
      style={{ padding: "var(--section-y) var(--pad)" }}
    >
      <SectionHeading eyebrow="My story" title="About" />

      {/* Grid */}
      <div className="mt-12 max-w-[70ch] min-[901px]:mt-20">
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

          {cvAvailable && (
            <motion.div
              style={{ display: "flex", gap: "8px", marginTop: "20px" }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <a
                href={CV_URL}
                target="_blank"
                rel="noopener"
                className="cv-btn"
                style={{
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
              >
                View CV
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12L12 2M12 2H4M12 2V10" />
                </svg>
              </a>
              <a
                href={CV_URL}
                download="cv.pdf"
                className="cv-btn"
                style={{
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
              >
                Download
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 2v8M3 7l4 4 4-4M2 13h10" />
                </svg>
              </a>
            </motion.div>
          )}
        </div>

      </div>
    </section>
  );
}
