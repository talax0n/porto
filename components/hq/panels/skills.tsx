import { SkillIcon } from "@/components/skill-icon";
import { SKILLS } from "@/data/skills";
import { SKILL_CATEGORIES } from "@/lib/skill-categories";

export function SkillsPanel() {
  return (
    <div className="space-y-2 sm:space-y-4">
      {SKILL_CATEGORIES.map((cat) => (
        <section key={cat}>
          <h3 className="mb-1 text-[9px] sm:mb-1.5 sm:text-[10px] uppercase tracking-[0.18em] text-hq-mute">{cat}</h3>
          <ul className="flex flex-wrap gap-1 sm:gap-1.5">
            {SKILLS.filter((s) => s.category === cat).map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-1.5 rounded-full border border-hq-line px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-[11px] text-hq-ink"
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
