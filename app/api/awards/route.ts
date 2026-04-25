import { db } from "@/lib/db";
import { awards } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(awards).orderBy(awards.id);
  return Response.json(
    rows.map((r) => ({ ...r, id: String(r.id) }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  await db.insert(awards).values({
    title: body.title,
    issuer: body.issuer,
    year: body.year,
  });
  return Response.json({ ok: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const id = Number(body.id);
  const { id: _, ...data } = body;
  const result = await db.update(awards).set(data).where(eq(awards.id, id));
  if (!result.rowCount) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await db.delete(awards).where(eq(awards.id, Number(id)));
  return Response.json({ ok: true });
}
