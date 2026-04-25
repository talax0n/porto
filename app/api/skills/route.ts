import { db } from "@/lib/db";
import { skills } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(skills).orderBy(skills.id);
  return Response.json(rows.map((r) => r.name));
}

export async function POST(req: Request) {
  const { skill } = await req.json();
  await db.insert(skills).values({ name: skill }).onConflictDoNothing();
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { skill } = await req.json();
  await db.delete(skills).where(eq(skills.name, skill));
  return Response.json({ ok: true });
}
