import { put, get } from "@vercel/blob";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const blob = await put(`projects/${file.name}`, file, {
    access: "private",
    addRandomSuffix: true,
  });

  // Return a proxy URL instead of the raw blob URL
  const proxyUrl = `/api/upload?url=${encodeURIComponent(blob.url)}`;
  return Response.json({ url: proxyUrl });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const blobUrl = searchParams.get("url");

  if (!blobUrl) {
    return new Response("Missing url param", { status: 400 });
  }

  const result = await get(blobUrl, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
