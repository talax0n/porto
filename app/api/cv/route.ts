import { writeFileSync, existsSync } from "fs";
import { join } from "path";

const CV_PATH = join(process.cwd(), "public/cv.pdf");

export async function GET() {
  return Response.json({ exists: existsSync(CV_PATH) });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(CV_PATH, buffer);
  return Response.json({ ok: true });
}
