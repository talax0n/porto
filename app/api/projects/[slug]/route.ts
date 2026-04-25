import { db } from "@/lib/db";
import { projects } from "@/lib/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const rows = await db.select().from(projects).orderBy(projects.id);
  const project = rows.find((r) => slugify(r.title) === slug);

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ...project, id: String(project.id) });
}
