import { EXPERIENCE } from "@/data/experience";

export function ExperiencePanel() {
  return (
    <ol className="relative ml-2 space-y-5 border-l border-hq-line pl-5">
      {[...EXPERIENCE].reverse().map((e) => (
        <li key={e.company} className="relative">
          <span className="absolute -left-[26px] top-1 size-2.5 rounded-full border-2 border-hq-panel bg-hq-amber" />
          <p className="font-mono text-[10px] tracking-wider text-hq-amber">{e.years}</p>
          <p className="mt-1 text-sm font-semibold text-hq-cream">{e.company}</p>
          <p className="text-[13px] font-light text-hq-cream/70">{e.role}</p>
        </li>
      ))}
    </ol>
  );
}
