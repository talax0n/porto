"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  num: string;
  title: string;
  category: string;
  description: string;
  techStack: string[];
  gradient: string;
  image?: string;
  href?: string;
  github?: string;
  wip?: boolean;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setProject)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: "var(--muted)", fontSize: "14px", letterSpacing: "0.1em" }}
        >
          Loading...
        </motion.p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "24px",
            fontWeight: 800,
            color: "var(--fg)",
          }}
        >
          Project not found
        </p>
        <Link
          href="/#work"
          style={{
            fontSize: "14px",
            color: "var(--accent)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>
      </div>
    );
  }

  // Ensure href is a proper external URL
  const projectUrl = project.href
    ? project.href.startsWith("http")
      ? project.href
      : `https://${project.href}`
    : null;

  const githubUrl = project.github
    ? project.github.startsWith("http")
      ? project.github
      : `https://${project.github}`
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      {/* ── Hero Banner ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "45vh",
          minHeight: "320px",
          overflow: "hidden",
        }}
      >
        {/* Gradient background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: project.gradient,
          }}
        />
        {/* Image overlay if present */}
        {project.image && (
          <img
            src={project.image}
            alt={project.title}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.4,
              mixBlendMode: "overlay",
            }}
          />
        )}
        {/* Dark overlay at bottom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)",
          }}
        />

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ position: "absolute", top: "32px", left: "44px", zIndex: 10 }}
          className="max-[900px]:!left-6 max-[900px]:!top-6"
        >
          <Link
            href="/#work"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "rgba(255,255,255,0.7)",
              fontSize: "13px",
              letterSpacing: "0.06em",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          >
            <ArrowLeft size={18} />
            Back
          </Link>
        </motion.div>

        {/* Hero content */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 44px 48px",
            zIndex: 10,
          }}
          className="max-[900px]:!px-6 max-[900px]:!pb-8"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              fontWeight: 600,
              display: "block",
              marginBottom: "12px",
            }}
          >
            {project.num} &mdash; {project.category}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: "#fff",
            }}
          >
            {project.title.replace(/\n/g, " ")}
          </motion.h1>
          {project.wip && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-[5px] rounded-full border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.12)] px-2.5 py-1 text-[9px] font-bold tracking-[0.06em] uppercase text-[#F59E0B]"
              style={{ marginTop: "16px" }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]"
                style={{ animation: "blink 2.2s ease infinite" }}
              />
              Work in Progress
            </motion.span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 44px 120px",
        }}
        className="max-[900px]:!px-6 max-[900px]:!py-12"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: "80px",
          }}
          className="max-[900px]:!grid-cols-1 max-[900px]:!gap-10"
        >
          {/* ── Left sidebar ── */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          >
            {/* Tech Stack */}
            <div style={{ marginBottom: "40px" }}>
              <h3
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "16px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Tech Stack
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "6px 14px",
                      border: "1px solid var(--border)",
                      borderRadius: "100px",
                      color: "var(--fg)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Category */}
            <div style={{ marginBottom: "40px" }}>
              <h3
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  fontWeight: 600,
                  marginBottom: "12px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Category
              </h3>
              <p style={{ fontSize: "14px", color: "var(--fg)" }}>
                {project.category}
              </p>
            </div>

            {/* Links */}
            {(projectUrl || githubUrl) && (
              <div>
                <h3
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--muted)",
                    fontWeight: 600,
                    marginBottom: "16px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  Links
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {projectUrl && (
                    <a
                      href={projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 24px",
                        fontSize: "13px",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: "#fff",
                        background: "var(--fg)",
                        border: "none",
                        borderRadius: "100px",
                        textDecoration: "none",
                        transition: "opacity 0.3s",
                        width: "100%",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <ArrowUpRight size={16} />
                      Visit Project
                    </a>
                  )}
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 24px",
                        fontSize: "13px",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: "var(--fg)",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: "100px",
                        textDecoration: "none",
                        transition: "all 0.3s",
                        width: "100%",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <ExternalLink size={16} />
                      View on GitHub
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.aside>

          {/* ── Main content ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
          >
            {/* Description */}
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: "20px",
                }}
              >
                About the Project
              </h2>
              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.75,
                  color: "var(--fg)",
                  maxWidth: "620px",
                }}
              >
                {project.description || "No description available yet."}
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "var(--border)",
                margin: "48px 0",
              }}
            />

            {/* Project image if available */}
            {project.image && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <img
                  src={project.image}
                  alt={project.title}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
