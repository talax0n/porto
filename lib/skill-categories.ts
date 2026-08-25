/* Standalone so client components can import it without pulling in drizzle. */
export const SKILL_CATEGORIES = [
  "Languages",
  "Frontend",
  "Backend",
  "Database",
  "Blockchain",
  "DevOps & Deployment",
  "Tools & Other",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
