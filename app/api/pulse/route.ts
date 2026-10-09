import { timingSafeEqual } from "node:crypto";
import { type Pulse, parsePulse } from "@/data/pulse";

const KEY = "pulse";
/** a laptop that stopped reporting two minutes ago is asleep, whatever it last said */
const STALE_MS = 120_000;
const EMPTY: Pulse = { agents: [], lastSeen: 0, runsToday: 0 };

const REST_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
/** dev only: serverless instances don't share it; on globalThis so dev recompiles keep it */
const mem = globalThis as { pulseMemory?: string };

async function redis(...cmd: string[]): Promise<string | null> {
  const res = await fetch(REST_URL!, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return ((await res.json()) as { result: string | null }).result;
}

const load = async () => (REST_URL && TOKEN ? redis("GET", KEY) : (mem.pulseMemory ?? null));
const save = async (json: string) => {
  if (REST_URL && TOKEN) await redis("SET", KEY, json);
  else mem.pulseMemory = json;
};

function authorized(req: Request, secret: string) {
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: Request) {
  const secret = process.env.PULSE_SECRET;
  if (!secret) return Response.json({ error: "PULSE_SECRET is not set" }, { status: 503 });
  if (!authorized(req, secret)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const pulse = parsePulse(await req.json().catch(() => null));
  if (!pulse) return Response.json({ error: "bad pulse" }, { status: 400 });
  try {
    await save(JSON.stringify(pulse));
  } catch {
    return Response.json({ error: "store unavailable" }, { status: 502 });
  }
  return Response.json({ ok: true });
}

export async function GET() {
  let pulse = EMPTY;
  try {
    // re-parse so nothing but enums and numbers can leave, even if the store were poisoned
    pulse = parsePulse(JSON.parse((await load()) ?? "null")) ?? EMPTY;
  } catch {}
  if (Date.now() - pulse.lastSeen > STALE_MS) pulse = { ...pulse, agents: [] };
  return Response.json(pulse, { headers: { "cache-control": "public, s-maxage=10, stale-while-revalidate=20" } });
}
