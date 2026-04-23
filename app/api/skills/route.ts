import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FILE = join(process.cwd(), "data/skills.json");

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
  const { skill } = await req.json();
  const items = read();
  if (!items.includes(skill)) {
    items.push(skill);
    write(items);
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { skill } = await req.json();
  const items = read().filter((s: string) => s !== skill);
  write(items);
  return Response.json({ ok: true });
}
