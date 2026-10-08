import { AWARDS } from "@/data/awards";

export function AwardsPanel() {
  return (
    <ol className="space-y-4">
      {AWARDS.map((a, i) => (
        <li key={a.title} className="flex gap-4">
          <span className="w-5 shrink-0 pt-0.5 text-[11px] tabular-nums text-hq-accent">0{i + 1}</span>
          <div>
            <p className="text-[14px] font-semibold leading-snug text-hq-ink">{a.title}</p>
            <p className="text-xs text-hq-mute">{a.issuer}</p>
            <p className="text-[11px] text-hq-mute">{a.year}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
