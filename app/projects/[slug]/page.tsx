"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PROJECTS } from "@/data/projects";
import { slugify } from "@/lib/slugify";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const toUrl = (v?: string) =>
  v ? (v.startsWith("http") ? v : `https://${v}`) : null;

/* ── Shell: back bar shared by every state ── */
function BackBar() {
  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex items-center px-[var(--pad)] py-4 backdrop-blur-md">
      <Link
        href="/#work"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg2)]/70 px-4 py-2 text-[11px] font-medium tracking-[0.08em] text-[var(--fg)] uppercase transition-colors hover:border-[var(--border-hover)]"
      >
        <ArrowLeft size={14} />
        Back
      </Link>
    </div>
  );
}

function MetaBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 border-b border-[var(--border)] pb-2.5 text-[10px] font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const project = PROJECTS.find((p) => slugify(p.title) === slug);

  if (!project) {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-[var(--pad)] text-center">
        <p
          className="text-2xl font-extrabold"
          style={{ fontFamily: "var(--font-syne), sans-serif" }}
        >
          Project not found
        </p>
        <Link
          href="/#work"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)]"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>
      </main>
    );
  }

  const projectUrl = toUrl(project.href);
  const githubUrl = toUrl(project.github);
  const title = project.title.replace(/\n/g, " ");
  const hasActions = Boolean(projectUrl || githubUrl);

  return (
    <main className="min-h-[100svh] pb-[env(safe-area-inset-bottom)]">
      <BackBar />

      {/* ── Hero ── */}
      <section className="px-[var(--pad)] pt-20 min-[901px]:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--border)] min-[601px]:aspect-[21/9]"
        >
          <div className="absolute inset-0" style={{ background: project.gradient }} />
          {project.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={project.image}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute right-5 bottom-5 left-5 min-[901px]:right-9 min-[901px]:bottom-9 min-[901px]:left-9">
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-semibold tracking-[0.14em] text-white/50 uppercase">
                {project.num}
              </span>
            </div>
            <h1
              className="text-[clamp(30px,6vw,72px)] leading-[0.95] font-extrabold tracking-[-0.04em] text-white"
              style={{ fontFamily: "var(--font-syne), sans-serif" }}
            >
              {title}
            </h1>
          </div>
        </motion.div>
      </section>

      {/* ── Body ── */}
      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 px-[var(--pad)] pt-14 pb-24 min-[901px]:grid-cols-[1fr_280px] min-[901px]:gap-20 min-[901px]:pt-20">
        {/* Prose */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
          className="min-[901px]:order-1"
        >
          <h2
            className="mb-5 text-[11px] font-bold tracking-[0.14em] text-[var(--accent)] uppercase"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            About the Project
          </h2>
          <p className="max-w-[62ch] text-[clamp(15px,1.5vw,18px)] leading-[1.75] text-[var(--fg)] whitespace-pre-line">
            {project.description || "No description available yet."}
          </p>

          {project.image && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mt-12 overflow-hidden rounded-xl border border-[var(--border)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image}
                alt={title}
                className="block h-auto w-full"
                onError={(e) => (e.currentTarget.closest("div")?.remove())}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Meta — first on mobile, sticky rail on desktop */}
        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
          className="flex flex-col gap-9 min-[901px]:order-2 min-[901px]:sticky min-[901px]:top-24 min-[901px]:self-start"
        >
          <MetaBlock title="Tech Stack">
            <div className="flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </MetaBlock>

          {/* Desktop links — mobile gets the sticky bar below */}
          {hasActions && (
            <div className="hidden min-[901px]:block">
              <MetaBlock title="Links">
                <div className="flex flex-col gap-2.5">
                  {projectUrl && (
                    <a
                      href={projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--fg)] px-6 py-3 text-[13px] font-semibold tracking-[0.04em] transition-opacity hover:opacity-85"
                      style={{ color: "var(--bg)" }}
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
                      className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-[var(--border)] px-6 py-3 text-[13px] font-semibold tracking-[0.04em] transition-colors hover:border-[var(--border-hover)]"
                    >
                      <ExternalLink size={16} />
                      View on GitHub
                    </a>
                  )}
                </div>
              </MetaBlock>
            </div>
          )}
        </motion.aside>
      </section>

      {/* ── Mobile sticky actions ── */}
      {hasActions && (
        <div className="fixed right-0 bottom-0 left-0 z-40 flex gap-2 border-t border-[var(--border)] bg-[var(--bg)]/85 px-[var(--pad)] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-lg min-[901px]:hidden">
          {projectUrl && (
            <a
              href={projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--fg)] px-5 py-3 text-[13px] font-semibold"
              style={{ color: "var(--bg)" }}
            >
              <ArrowUpRight size={16} />
              Visit
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-5 py-3 text-[13px] font-semibold"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      )}
    </main>
  );
}
