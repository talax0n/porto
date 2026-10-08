import { EXPERIENCE } from "@/data/experience";

export function ExperiencePanel() {
  return (
    <ol className="relative ml-1.5 space-y-6 border-l border-hq-line pl-6">
      {[...EXPERIENCE].reverse().map((e) => (
        <li key={e.company} className="relative">
          <span className="absolute -left-[31px] top-1 size-2.5 rounded-full border-2 border-white bg-hq-accent" />
          <p className="text-[11px] tracking-wider text-hq-mute">{e.years}</p>
          <p className="mt-1 text-[15px] font-semibold text-hq-ink">{e.company}</p>
          <p className="text-[13px] text-hq-mute">{e.role}</p>
        </li>
      ))}
    </ol>
  );
}
