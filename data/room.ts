import { SECRETISH, exactly, isRecord, oneOf } from "./pulse.ts";

/** Shared by the room worker and the client. Both parse every frame they receive with the functions below. */
export const ROOM_CAP = 24;
export const SAY_MAX = 120;
/** how many rooms the client walks through before giving up; the worker only serves `room-0` to `room-9` */
export const ROOMS_TRIED = 4;
export const ROOM_NAME = /^room-[0-9]$/;

/** One tap each; `preset` messages carry an index into this. */
export const PRESETS = ["hi!", "nice portfolio", "follow me", "gg", "brb", "👋"] as const;
/** Names match `Gesture` in the scene, which is what plays. */
export const EMOTES = ["wave", "cheer", "hop", "point"] as const;
export type Emote = (typeof EMOTES)[number];

/** Server-assigned, 6 chars of [0-9a-z]. */
export type PeerId = string;
/** A unit vector, rounded to 3 decimals on the wire. */
export type Vec = [number, number, number];
/** `look` is a uint32 seed the client turns into hat, skin and shirt. */
export type Peer = { id: PeerId; look: number; n: Vec; h: Vec };

export type ClientMsg =
  | { t: "move"; n: Vec; h: Vec }
  | { t: "say"; text: string }
  | { t: "emote"; e: Emote }
  | { t: "preset"; p: number };

export type ServerMsg =
  | { t: "hello"; you: PeerId; peers: Peer[] }
  | { t: "join"; peer: Peer }
  | { t: "leave"; id: PeerId }
  | { t: "move"; id: PeerId; n: Vec; h: Vec }
  | { t: "say"; id: PeerId; text: string }
  | { t: "emote"; id: PeerId; e: Emote }
  | { t: "full" };

const ID = /^[0-9a-z]{6}$/;
const FRAME_MAX = 4096;

// a handful of slurs and profanity; a speed bump, not moderation
const BLOCKED = ["fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "retard", "slut", "whore"];
const BLOCK = new RegExp(`(?<![\\p{L}\\p{N}])(?:${BLOCKED.join("|")})[\\p{L}\\p{N}]*`, "giu");

/** What a line may say after the server's guards, or null when nothing is left. Idempotent. */
export function cleanSay(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw
    .slice(0, SAY_MAX * 4)
    .replace(SECRETISH, " ")
    .replace(/[\p{Cc}\p{Cf}\s]+/gu, " ")
    .replace(BLOCK, "***")
    .trim();
  const cut = Array.from(t).slice(0, SAY_MAX).join("").trimEnd();
  return cut || null;
}

const q3 = (x: number) => Math.round(x * 1000) / 1000;

function vec(x: unknown): Vec | null {
  if (!Array.isArray(x) || x.length !== 3) return null;
  if (!x.every((c) => typeof c === "number" && Number.isFinite(c) && Math.abs(c) <= 1)) return null;
  const [a, b, c] = x as Vec;
  if (Math.abs(Math.hypot(a, b, c) - 1) > 0.02) return null;
  return [q3(a), q3(b), q3(c)];
}

const isId = (x: unknown): x is PeerId => typeof x === "string" && ID.test(x);
const isLook = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 0xffffffff;

function peer(x: unknown): Peer | null {
  if (!isRecord(x) || !exactly(x, ["id", "look", "n", "h"])) return null;
  const n = vec(x.n);
  const h = vec(x.h);
  if (!isId(x.id) || !isLook(x.look) || !n || !h) return null;
  return { id: x.id, look: x.look, n, h };
}

function json(text: unknown): Record<string, unknown> | null {
  if (typeof text !== "string" || text.length > FRAME_MAX) return null;
  try {
    const x: unknown = JSON.parse(text);
    return isRecord(x) ? x : null;
  } catch {
    return null;
  }
}

/** Parses one text frame from a visitor. `say` text comes back cleaned, so a client can't skip the guards. */
export function parseClient(text: unknown): ClientMsg | null {
  const x = json(text);
  if (!x) return null;
  switch (x.t) {
    case "move": {
      if (!exactly(x, ["t", "n", "h"])) return null;
      const n = vec(x.n);
      const h = vec(x.h);
      return n && h ? { t: "move", n, h } : null;
    }
    case "say": {
      if (!exactly(x, ["t", "text"])) return null;
      const t = cleanSay(x.text);
      return t ? { t: "say", text: t } : null;
    }
    case "emote":
      return exactly(x, ["t", "e"]) && oneOf(EMOTES, x.e) ? { t: "emote", e: x.e } : null;
    case "preset": {
      const p = x.p;
      return exactly(x, ["t", "p"]) && typeof p === "number" && Number.isInteger(p) && p >= 0 && p < PRESETS.length
        ? { t: "preset", p }
        : null;
    }
    default:
      return null;
  }
}

/** Parses one text frame from the room. Anything but an exact, well-formed message is dropped. */
export function parseServer(text: unknown): ServerMsg | null {
  const x = json(text);
  if (!x) return null;
  switch (x.t) {
    case "hello": {
      if (!exactly(x, ["t", "you", "peers"]) || !isId(x.you) || !Array.isArray(x.peers) || x.peers.length > ROOM_CAP)
        return null;
      const peers = x.peers.map(peer);
      return peers.every((p) => p !== null) ? { t: "hello", you: x.you, peers } : null;
    }
    case "join": {
      const p = exactly(x, ["t", "peer"]) ? peer(x.peer) : null;
      return p ? { t: "join", peer: p } : null;
    }
    case "leave":
      return exactly(x, ["t", "id"]) && isId(x.id) ? { t: "leave", id: x.id } : null;
    case "move": {
      if (!exactly(x, ["t", "id", "n", "h"]) || !isId(x.id)) return null;
      const n = vec(x.n);
      const h = vec(x.h);
      return n && h ? { t: "move", id: x.id, n, h } : null;
    }
    case "say": {
      if (!exactly(x, ["t", "id", "text"]) || !isId(x.id)) return null;
      const t = cleanSay(x.text);
      return t && t === x.text ? { t: "say", id: x.id, text: t } : null;
    }
    case "emote":
      return exactly(x, ["t", "id", "e"]) && isId(x.id) && oneOf(EMOTES, x.e) ? { t: "emote", id: x.id, e: x.e } : null;
    case "full":
      return exactly(x, ["t"]) ? { t: "full" } : null;
    default:
      return null;
  }
}
