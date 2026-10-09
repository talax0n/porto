var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.ts
import { DurableObject } from "cloudflare:workers";

// ../data/pulse.ts
var SECRETISH = /https?:\/\/\S+|\S+@\S+\.\S+|[\w-]{24,}/g;
var isRecord = /* @__PURE__ */ __name((x) => typeof x === "object" && x !== null && !Array.isArray(x), "isRecord");
var oneOf = /* @__PURE__ */ __name((set, x) => set.includes(x), "oneOf");
var exactly = /* @__PURE__ */ __name((o, keys) => Object.keys(o).length === keys.length && keys.every((k) => Object.hasOwn(o, k)), "exactly");

// ../data/room.ts
var ROOM_CAP = 24;
var SAY_MAX = 120;
var ROOM_NAME = /^room-[0-9]$/;
var PRESETS = ["hi!", "nice portfolio", "follow me", "gg", "brb", "\u{1F44B}"];
var EMOTES = ["wave", "cheer", "hop", "point"];
var FRAME_MAX = 4096;
var BLOCKED = ["fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "retard", "slut", "whore"];
var BLOCK = new RegExp(`(?<![\\p{L}\\p{N}])(?:${BLOCKED.join("|")})[\\p{L}\\p{N}]*`, "giu");
function cleanSay(raw) {
  if (typeof raw !== "string") return null;
  const t = raw.slice(0, SAY_MAX * 4).replace(SECRETISH, " ").replace(/[\p{Cc}\p{Cf}\s]+/gu, " ").replace(BLOCK, "***").trim();
  const cut = Array.from(t).slice(0, SAY_MAX).join("").trimEnd();
  return cut || null;
}
__name(cleanSay, "cleanSay");
var q3 = /* @__PURE__ */ __name((x) => Math.round(x * 1e3) / 1e3, "q3");
function vec(x) {
  if (!Array.isArray(x) || x.length !== 3) return null;
  if (!x.every((c2) => typeof c2 === "number" && Number.isFinite(c2) && Math.abs(c2) <= 1)) return null;
  const [a, b, c] = x;
  if (Math.abs(Math.hypot(a, b, c) - 1) > 0.02) return null;
  return [q3(a), q3(b), q3(c)];
}
__name(vec, "vec");
function json(text) {
  if (typeof text !== "string" || text.length > FRAME_MAX) return null;
  try {
    const x = JSON.parse(text);
    return isRecord(x) ? x : null;
  } catch {
    return null;
  }
}
__name(json, "json");
function parseClient(text) {
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
      return exactly(x, ["t", "p"]) && typeof p === "number" && Number.isInteger(p) && p >= 0 && p < PRESETS.length ? { t: "preset", p } : null;
    }
    default:
      return null;
  }
}
__name(parseClient, "parseClient");

// worker.ts
var BURST = 4;
var REFILL = 2e3;
var MOVE_GAP = 60;
var same = /* @__PURE__ */ __name((a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2], "same");
var worker_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    const name = url.pathname.match(/^\/room\/([^/]+)$/)?.[1];
    if (!name || !ROOM_NAME.test(name)) return new Response("not found", { status: 404 });
    if (req.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const origin = req.headers.get("Origin");
    const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
    if (!origin || !allowed.includes(origin)) return new Response("forbidden", { status: 403 });
    return env.ROOM.get(env.ROOM.idFromName(name)).fetch(req);
  }
};
var Room = class extends DurableObject {
  static {
    __name(this, "Room");
  }
  /** lost when the object hibernates, which only happens once every socket has been idle for a while */
  limits = /* @__PURE__ */ new WeakMap();
  seats(except) {
    const out = [];
    for (const ws of this.ctx.getWebSockets()) {
      const seat = ws.deserializeAttachment();
      if (seat && ws !== except) out.push({ ws, seat });
    }
    return out;
  }
  send(ws, msg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
    }
  }
  broadcast(msg, except) {
    const text = JSON.stringify(msg);
    for (const { ws } of this.seats(except)) {
      try {
        ws.send(text);
      } catch {
      }
    }
  }
  async fetch() {
    const { 0: client, 1: server } = new WebSocketPair();
    const seated = this.seats();
    this.ctx.acceptWebSocket(server);
    if (seated.length >= ROOM_CAP) {
      this.send(server, { t: "full" });
      server.close(1013, "full");
      return new Response(null, { status: 101, webSocket: client });
    }
    const taken = new Set(seated.map((s) => s.seat.id));
    let id;
    do
      id = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => (b % 36).toString(36)).join("");
    while (taken.has(id));
    const seat = { id, look: crypto.getRandomValues(new Uint32Array(1))[0], n: null, h: null };
    server.serializeAttachment(seat);
    const peers = seated.flatMap(({ seat: s }) => s.n && s.h ? [{ id: s.id, look: s.look, n: s.n, h: s.h }] : []);
    this.send(server, { t: "hello", you: id, peers });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, data) {
    const seat = ws.deserializeAttachment();
    const msg = typeof data === "string" ? parseClient(data) : null;
    if (!seat || !msg) return;
    const now = Date.now();
    const lim = this.limits.get(ws) ?? { tokens: BURST, at: now, move: 0 };
    this.limits.set(ws, lim);
    if (msg.t === "move") {
      if (now - lim.move < MOVE_GAP) return;
      lim.move = now;
      if (seat.n && seat.h && same(seat.n, msg.n) && same(seat.h, msg.h)) return;
      const joining = !seat.n;
      seat.n = msg.n;
      seat.h = msg.h;
      ws.serializeAttachment(seat);
      const peer = { id: seat.id, look: seat.look, n: msg.n, h: msg.h };
      this.broadcast(joining ? { t: "join", peer } : { t: "move", id: seat.id, n: msg.n, h: msg.h }, ws);
      return;
    }
    if (!seat.n) return;
    lim.tokens = Math.min(BURST, lim.tokens + (now - lim.at) / REFILL);
    lim.at = now;
    if (lim.tokens < 1) return;
    lim.tokens -= 1;
    if (msg.t === "emote") this.broadcast({ t: "emote", id: seat.id, e: msg.e });
    else this.broadcast({ t: "say", id: seat.id, text: msg.t === "preset" ? PRESETS[msg.p] : msg.text });
  }
  async webSocketClose(ws) {
    this.leave(ws);
    try {
      ws.close();
    } catch {
    }
  }
  async webSocketError(ws) {
    this.leave(ws);
  }
  leave(ws) {
    const seat = ws.deserializeAttachment();
    if (seat?.n) this.broadcast({ t: "leave", id: seat.id }, ws);
  }
};

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-jw2XKL/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-jw2XKL/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Room,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
