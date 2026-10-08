import { SkillIcon } from "@/components/skill-icon";
import { SKILLS } from "@/data/skills";
import { SKILL_CATEGORIES } from "@/lib/skill-categories";

export function SkillsPanel() {
  return (
    <div className="space-y-2.5 sm:space-y-3">
      {SKILL_CATEGORIES.map((cat) => (
        <section key={cat}>
          <h3 className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-hq-amber/80">{cat}</h3>
          <ul className="flex flex-wrap gap-1">
            {SKILLS.filter((s) => s.category === cat).map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-1.5 rounded border border-hq-line bg-black/20 px-1.5 py-0.5 text-[11px] text-hq-cream"
              >
                <SkillIcon name={s.name} icon={s.icon} />
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
