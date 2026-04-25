import { put, del, list, get } from "@vercel/blob";

const CV_PREFIX = "cv/";

async function getCurrentCv() {
  const { blobs } = await list({ prefix: CV_PREFIX });
  return blobs[0] ?? null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download");

  const blob = await getCurrentCv();

  // If ?download is present, proxy the actual file
  if (download !== null && blob) {
    const result = await get(blob.url, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `inline; filename="cv.pdf"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  // Otherwise return metadata
  return Response.json({ exists: !!blob, url: blob ? `/api/cv?download` : null });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  // Delete existing CV first
  const existing = await getCurrentCv();
  if (existing) await del(existing.url);

  await put(`cv/${file.name}`, file, {
    access: "private",
    addRandomSuffix: true,
  });

  return Response.json({ ok: true, url: `/api/cv?download` });
}

export async function DELETE() {
  const existing = await getCurrentCv();
  if (existing) await del(existing.url);
  return Response.json({ ok: true });
}
