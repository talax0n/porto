import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(projects).orderBy(projects.id);
  return Response.json(
    rows.map((r) => ({
      ...r,
      id: String(r.id),
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const rows = await db.select().from(projects);
  const num = String(rows.length + 1).padStart(2, "0");
  await db.insert(projects).values({
    num,
    title: body.title,
    category: body.category,
    techStack: body.techStack ?? [],
    gradient:
      body.gradient ??
      "linear-gradient(145deg, #001A0A 0%, #004A20 55%, #00A854 100%)",
    image: body.image ?? "",
    href: body.href ?? "",
    wip: body.wip ?? false,
  });
  return Response.json({ ok: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const id = Number(body.id);
  const { id: _, ...data } = body;
  const result = await db.update(projects).set(data).where(eq(projects.id, id));
  if (!result.rowCount) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await db.delete(projects).where(eq(projects.id, Number(id)));

  // Re-number remaining projects
  const rows = await db.select().from(projects).orderBy(projects.id);
  for (let i = 0; i < rows.length; i++) {
    const num = String(i + 1).padStart(2, "0");
    if (rows[i].num !== num) {
      await db
        .update(projects)
        .set({ num })
        .where(eq(projects.id, rows[i].id));
    }
  }
  return Response.json({ ok: true });
}
