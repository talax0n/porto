import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TOKEN = process.env.ADMIN_TOKEN || "porto-admin-session";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_token", TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return Response.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  if (token?.value === TOKEN) {
    return Response.json({ authenticated: true });
  }
  return Response.json({ authenticated: false }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return Response.json({ ok: true });
}
