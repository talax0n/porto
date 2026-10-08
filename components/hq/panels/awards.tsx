import { Trophy } from "lucide-react";
import { AWARDS } from "@/data/awards";

export function AwardsPanel() {
  return (
    <ul className="space-y-3">
      {AWARDS.map((a) => (
        <li key={a.title} className="flex gap-3">
          <Trophy className="mt-0.5 size-4 shrink-0 text-[#ffd23f]" />
          <div>
            <p className="text-[13px] font-semibold leading-snug text-hq-cream">{a.title}</p>
            <p className="text-xs font-light text-hq-cream/65">{a.issuer}</p>
            <p className="font-mono text-[10px] text-hq-amber">{a.year}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
