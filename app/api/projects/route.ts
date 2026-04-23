import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FILE = join(process.cwd(), "data/projects.json");

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
  const projects = read();
  const id = String(Date.now());
  const num = String(projects.length + 1).padStart(2, "0");
  projects.push({ id, num, ...body });
  write(projects);
  return Response.json({ ok: true });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const projects = read();
  const idx = projects.findIndex((p: { id: string }) => p.id === body.id);
  if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });
  projects[idx] = { ...projects[idx], ...body };
  write(projects);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  let projects = read();
  projects = projects.filter((p: { id: string }) => p.id !== id);
  projects.forEach((p: { num: string }, i: number) => {
    p.num = String(i + 1).padStart(2, "0");
  });
  write(projects);
  return Response.json({ ok: true });
}
