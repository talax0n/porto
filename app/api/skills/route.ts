import { db } from "@/lib/db";
import { skills } from "@/lib/schema";
import { SKILL_CATEGORIES } from "@/lib/skill-categories";
import { eq } from "drizzle-orm";

const isCategory = (v: unknown): v is (typeof SKILL_CATEGORIES)[number] =>
  typeof v === "string" && (SKILL_CATEGORIES as readonly string[]).includes(v);

export async function GET() {
  const rows = await db.select().from(skills).orderBy(skills.id);
  return Response.json(rows.map((r) => ({ name: r.name, category: r.category })));
}

export async function POST(req: Request) {
  const { skill, category } = await req.json();
  if (typeof skill !== "string" || !skill.trim()) {
    return Response.json({ error: "skill is required" }, { status: 400 });
  }
  await db
    .insert(skills)
    .values({
      name: skill.trim(),
      category: isCategory(category) ? category : "Tools & Other",
    })
    .onConflictDoNothing();
  return Response.json({ ok: true });
}

export async function PUT(req: Request) {
  const { skill, category } = await req.json();
  if (typeof skill !== "string" || !isCategory(category)) {
    return Response.json({ error: "skill and a valid category are required" }, { status: 400 });
  }
  await db.update(skills).set({ category }).where(eq(skills.name, skill));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { skill } = await req.json();
  await db.delete(skills).where(eq(skills.name, skill));
  return Response.json({ ok: true });
}
