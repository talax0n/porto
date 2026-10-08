import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { PROJECTS } from "@/data/projects";

const linkClass =
  "inline-flex items-center gap-1 rounded border border-hq-amber/50 px-2.5 py-1 font-mono text-[11px] text-hq-amber hover:bg-hq-amber hover:text-hq-bg";

export function ProjectsPanel() {
  const [i, setI] = useState(0);
  const last = PROJECTS.length - 1;
  const go = (d: number) => setI((n) => (n + d + PROJECTS.length) % PROJECTS.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setI((n) => (n + last) % PROJECTS.length);
      if (e.key === "ArrowRight") setI((n) => (n + 1) % PROJECTS.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  const p = PROJECTS[i];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded border border-hq-line sm:aspect-[16/9]" style={{ background: p.gradient }}>
        <Image key={p.image} src={p.image} alt={p.title} fill sizes="460px" className="object-cover" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <p className="font-mono text-[10px] tracking-wider text-hq-amber">
          {p.num} / {String(PROJECTS.length).padStart(2, "0")}
        </p>
        <h3 className="font-display text-xl font-bold text-hq-cream">{p.title}</h3>
        <p className="mt-1 line-clamp-6 text-[12.5px] font-light leading-relaxed text-hq-cream/75 max-sm:line-clamp-4 max-sm:text-xs">
          {p.description}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1">
          {p.techStack.map((t) => (
            <li key={t} className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-hq-cream/80">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {p.href && (
          <a href={p.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Live <ArrowUpRight className="size-3" />
          </a>
        )}
        {p.github && (
          <a href={p.github} target="_blank" rel="noopener noreferrer" className={linkClass}>
            GitHub <ArrowUpRight className="size-3" />
          </a>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" aria-label="Previous project" onClick={() => go(-1)} className="rounded border border-hq-line p-1.5 text-hq-cream hover:bg-hq-line">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" aria-label="Next project" onClick={() => go(1)} className="rounded border border-hq-line p-1.5 text-hq-cream hover:bg-hq-line">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
