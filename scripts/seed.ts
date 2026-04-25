import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { projects, experience, awards, skills } from "../lib/schema";
import projectsData from "../data/projects.json";
import experienceData from "../data/experience.json";
import awardsData from "../data/awards.json";
import skillsData from "../data/skills.json";

loadEnvConfig(process.cwd());

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("Seeding projects...");
  for (const p of projectsData) {
    await db.insert(projects).values({
      num: p.num,
      title: p.title,
      category: p.category,
      techStack: p.techStack,
      gradient: p.gradient,
      image: p.image,
      href: p.href,
      wip: p.wip,
    });
  }
  console.log(`  Inserted ${projectsData.length} projects`);

  console.log("Seeding experience...");
  for (const e of experienceData) {
    await db.insert(experience).values({
      company: e.company,
      role: e.role,
      years: e.years,
    });
  }
  console.log(`  Inserted ${experienceData.length} experience entries`);

  console.log("Seeding awards...");
  for (const a of awardsData) {
    await db.insert(awards).values({
      title: a.title,
      issuer: a.issuer,
      year: a.year,
    });
  }
  console.log(`  Inserted ${awardsData.length} awards`);

  console.log("Seeding skills...");
  for (const s of skillsData) {
    await db.insert(skills).values({ name: s });
  }
  console.log(`  Inserted ${skillsData.length} skills`);

  console.log("Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
