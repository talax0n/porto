/** Shared by the watcher, the route and the client. Only enums and numbers ever cross the wire. */
export const PROVIDERS = ["claude", "codex"] as const;
export const PHASES = ["thinking", "tool", "done"] as const;
export const KINDS = ["edit", "run", "read", "search", "web", "other"] as const;

export type Provider = (typeof PROVIDERS)[number];
export type Phase = (typeof PHASES)[number];
export type Kind = (typeof KINDS)[number];
export type Agent = { provider: Provider; phase: Phase; kind: Kind };
/** lastSeen is epoch ms; 0 means the laptop never reported */
export type Pulse = { agents: Agent[]; lastSeen: number; runsToday: number };

export const MAX_AGENTS = 10;

export const KIND_BY_TOOL: Record<string, Kind> = {
  Edit: "edit",
  Write: "edit",
  MultiEdit: "edit",
  NotebookEdit: "edit",
  Bash: "run",
  Read: "read",
  Grep: "search",
  Glob: "search",
  WebFetch: "web",
  WebSearch: "web",
  apply_patch: "edit",
  shell: "run",
  exec: "run",
  exec_command: "run",
  local_shell: "run",
};

export const kindOf = (tool: unknown): Kind =>
  (typeof tool === "string" && Object.hasOwn(KIND_BY_TOOL, tool) ? KIND_BY_TOOL[tool] : "other");

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const isCount = (x: unknown): x is number => typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
const oneOf = <T extends string>(set: readonly T[], x: unknown): x is T => set.includes(x as T);
const exactly = (o: Record<string, unknown>, keys: string[]) =>
  Object.keys(o).length === keys.length && keys.every((k) => Object.hasOwn(o, k));

export function parsePulse(x: unknown): Pulse | null {
  if (!isRecord(x) || !exactly(x, ["agents", "lastSeen", "runsToday"])) return null;
  const { agents, lastSeen, runsToday } = x;
  if (!Array.isArray(agents) || agents.length > MAX_AGENTS || !isCount(lastSeen) || !isCount(runsToday)) return null;
  const out: Agent[] = [];
  for (const a of agents) {
    if (!isRecord(a) || !exactly(a, ["provider", "phase", "kind"])) return null;
    if (!oneOf(PROVIDERS, a.provider) || !oneOf(PHASES, a.phase) || !oneOf(KINDS, a.kind)) return null;
    out.push({ provider: a.provider, phase: a.phase, kind: a.kind });
  }
  return { agents: out, lastSeen, runsToday };
}
