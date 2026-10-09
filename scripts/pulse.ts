/**
 * Watches local Claude Code / Codex transcripts and posts a tiny summary to the site.
 * PRIVACY: transcript lines are parsed in memory and reduced to enums; no string from them
 * is stored, logged or sent. Run: npm run pulse
 */
import { closeSync, openSync, readFileSync, readSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { type Agent, MAX_AGENTS, type Provider, type Pulse, cleanTitle, kindOf } from "../data/pulse.ts";

const ENDPOINT = process.env.PULSE_URL;
const SECRET = process.env.PULSE_SECRET;
if (!ENDPOINT || !SECRET) {
  console.error("pulse: set PULSE_URL and PULSE_SECRET");
  process.exit(1);
}

const LIVE_MS = 90_000;
const SCAN_MS = 2_000;
const DEBOUNCE_MS = 5_000;
const HEARTBEAT_MS = 60_000;

interface Session {
  id: string;
  provider: Provider;
  offset: number;
  mtime: number;
  last: Pick<Agent, "phase" | "kind">;
  title: string | null;
  titledAt: number;
  tail: string;
}

const sessions = new Map<string, Session>();
const countedToday = new Set<string>();
let day = new Date().toDateString();
let first = true;

const list = (dir: string) => {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
};

const pad = (n: number) => String(n).padStart(2, "0");
const dayDir = (d: Date) => join(homedir(), ".codex/sessions", String(d.getFullYear()), pad(d.getMonth() + 1), pad(d.getDate()));

function files(): [string, Provider][] {
  const out: [string, Provider][] = [];
  const claude = join(homedir(), ".claude/projects");
  for (const p of list(claude).filter((e) => e.isDirectory()))
    for (const f of list(join(claude, p.name))) if (f.name.endsWith(".jsonl")) out.push([join(claude, p.name, f.name), "claude"]);
  // today and yesterday cover a session that straddles midnight
  const now = Date.now();
  for (const d of [new Date(now), new Date(now - 864e5)])
    for (const f of list(dayDir(d))) if (f.name.endsWith(".jsonl")) out.push([join(dayDir(d), f.name), "codex"]);
  return out;
}

interface Line {
  type?: string;
  message?: { content?: unknown };
  payload?: { type?: string; name?: string };
}
interface Block {
  type?: string;
  name?: string;
}

/** Claude: assistant tool_use -> tool; any other assistant/user line -> thinking. */
function claudeEvent(j: Line): Session["last"] | null {
  if (j.type !== "assistant" && j.type !== "user") return null;
  const content = j.message?.content;
  const use = Array.isArray(content) ? (content as Block[]).findLast((c) => c?.type === "tool_use") : null;
  return j.type === "assistant" && use ? { phase: "tool", kind: kindOf(use.name) } : { phase: "thinking", kind: "other" };
}

function codexEvent(j: Line): Session["last"] | null {
  const t = j.payload?.type;
  if (j.type === "event_msg") return t === "task_complete" ? { phase: "done", kind: "other" } : null;
  if (j.type !== "response_item") return null;
  if (t === "function_call" || t === "custom_tool_call") return { phase: "tool", kind: kindOf(j.payload?.name) };
  return t === "reasoning" || t === "message" ? { phase: "thinking", kind: "other" } : null;
}

const EVENT = { claude: claudeEvent, codex: codexEvent };

/** Claude rewrites `ai-title` as the session goes on; the last one wins. */
function claudeTitle(text: string): string | null {
  let title: string | null = null;
  for (const l of text.split("\n")) {
    if (!l.includes('"ai-title"')) continue;
    try {
      title = cleanTitle(JSON.parse(l).aiTitle) ?? title;
    } catch {}
  }
  return title;
}

const CODEX_DB = join(homedir(), ".codex/state_5.sqlite");
/** Codex keeps the short thread name in its state db (`title` there is the whole first prompt). */
function codexTitle(path: string): string | null {
  const id = basename(path, ".jsonl").slice(-36);
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    return cleanTitle(execFileSync("sqlite3", ["-readonly", CODEX_DB, `select name from threads where id = '${id}'`], { encoding: "utf8", timeout: 2_000 }));
  } catch {
    return null;
  }
}

function read(path: string, s: Session, size: number) {
  const fd = openSync(path, "r");
  try {
    const buf = Buffer.alloc(size - s.offset);
    const n = readSync(fd, buf, 0, buf.length, s.offset);
    s.offset += n;
    const lines = (s.tail + buf.toString("utf8", 0, n)).split("\n");
    s.tail = lines.pop()!;
    for (const l of lines) {
      try {
        const e = EVENT[s.provider](JSON.parse(l));
        if (e) s.last = e;
      } catch {}
    }
    if (s.provider === "claude") s.title = claudeTitle(lines.join("\n")) ?? s.title;
  } finally {
    closeSync(fd);
  }
}

function scan(): Pulse {
  const now = Date.now();
  if (new Date(now).toDateString() !== day) {
    day = new Date(now).toDateString();
    countedToday.clear();
  }
  const agents: Agent[] = [];
  for (const [path, provider] of files()) {
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    let s = sessions.get(path);
    if (!s) {
      // files that predate the watcher start at EOF; a fresh session is read from its first line
      const fresh = !first && now - st.birthtimeMs < LIVE_MS;
      s = { id: createHash("sha256").update(path).digest("hex").slice(0, 8), provider, offset: fresh ? 0 : st.size, mtime: st.mtimeMs, last: { phase: "thinking", kind: "other" }, title: null, titledAt: 0, tail: "" };
      sessions.set(path, s);
    }
    if (st.size < s.offset) s.offset = s.tail.length ? 0 : st.size;
    if (st.size > s.offset) read(path, s, st.size);
    s.mtime = st.mtimeMs;
    if (now - s.mtime < LIVE_MS) {
      countedToday.add(path);
      // a running Claude session's title sits behind the offset; Codex renames threads, so recheck it each minute
      if (!s.titledAt || (provider === "codex" && now - s.titledAt > HEARTBEAT_MS)) {
        s.titledAt = now;
        s.title = provider === "claude" ? (claudeTitle(readFileSync(path, "utf8")) ?? s.title) : codexTitle(path);
      }
      agents.push({ id: s.id, provider, ...s.last, title: s.title });
    }
  }
  first = false;
  const lastSeen = Math.round(Math.max(0, ...[...sessions.values()].map((s) => s.mtime)));
  return { agents: agents.slice(0, MAX_AGENTS), lastSeen, runsToday: countedToday.size };
}

let sent = "";
let sentAt = 0;
let down = false;
let latest = "{}";

async function tick() {
  const body = (latest = JSON.stringify(scan()));
  const now = Date.now();
  if (now - sentAt < DEBOUNCE_MS || (body === sent && now - sentAt < HEARTBEAT_MS)) return;
  sentAt = now;
  try {
    const res = await fetch(ENDPOINT!, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) sent = body;
    down = false;
    const p: Pulse = JSON.parse(body);
    console.log(`${new Date().toISOString()} post ${res.status} agents=${p.agents.length} runs=${p.runsToday}`);
  } catch {
    // the site is often just not running locally; say so once, not every 5s
    if (!down) console.log(`${new Date().toISOString()} post failed (network), retrying quietly`);
    down = true;
  }
}

await tick();
setInterval(tick, SCAN_MS);

// a listening port is what makes the watcher show up in port-based tools like Portside
createServer((_, res) => res.setHeader("content-type", "application/json").end(`{"site":"${down ? "down" : "up"}","pulse":${latest}}`)).listen(
  Number(process.env.PULSE_PORT ?? 4317),
  "127.0.0.1",
);
// launchd only restarts on a failed exit, so a Stop from Portside (SIGTERM) stays stopped
process.on("SIGTERM", () => process.exit(0));
