import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { skills } from "../lib/schema";
import skillsData from "../data/skills.json";

loadEnvConfig(process.cwd());

/* One-off: assign a category to skills that were created before the column existed. */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const db = drizzle(neon(url));

  for (const s of skillsData) {
    await db
      .update(skills)
      .set({ category: s.category })
      .where(eq(skills.name, s.name));
  }
  console.log(`Updated ${skillsData.length} skills`);
}

main();
