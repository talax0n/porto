import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FILE = join(process.cwd(), "data/awards.json");

function read() {
  return JSON.parse(readFileSync(FILE, "utf-8"));
}

function write(data: unknown) {
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  return Response.json(read());
}

export async function POST(req: Request) {
  const body = await req.json();
  const items = read();
  const id = String(Date.now());
  items.push({ id, ...body });
  write(items);
  return Response.json({ ok: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const items = read();
  const idx = items.findIndex((a: { id: string }) => a.id === body.id);
  if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });
  items[idx] = { ...items[idx], ...body };
  write(items);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  let items = read();
  items = items.filter((a: { id: string }) => a.id !== id);
  write(items);
  return Response.json({ ok: true });
}
