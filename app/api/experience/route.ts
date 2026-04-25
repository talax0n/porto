import { db } from "@/lib/db";
import { experience } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(experience).orderBy(experience.id);
  return Response.json(
    rows.map((r) => ({ ...r, id: String(r.id) }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  await db.insert(experience).values({
    company: body.company,
    role: body.role,
    years: body.years,
  });
  return Response.json({ ok: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const id = Number(body.id);
  const { id: _, ...data } = body;
  const result = await db
    .update(experience)
    .set(data)
    .where(eq(experience.id, id));
  if (!result.rowCount) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await db.delete(experience).where(eq(experience.id, Number(id)));
  return Response.json({ ok: true });
}
