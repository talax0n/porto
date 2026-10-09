import assert from "node:assert/strict";
import { parsePulse } from "../data/pulse.ts";

const agent = { provider: "claude", phase: "tool", kind: "edit" };
const ok = { agents: [agent], lastSeen: Date.now(), runsToday: 3 };

assert.deepEqual(parsePulse(ok), ok);
assert.equal(parsePulse({ ...ok, project: "secret" }), null, "extra top-level field");
assert.equal(parsePulse({ ...ok, agents: [{ ...agent, path: "/etc/passwd" }] }), null, "extra agent field");
assert.equal(parsePulse({ ...ok, agents: [{ ...agent, kind: "rm" }] }), null, "unknown kind");
assert.equal(parsePulse({ ...ok, agents: Array(11).fill(agent) }), null, "11 agents");
assert.notEqual(parsePulse({ ...ok, agents: Array(10).fill(agent) }), null, "10 agents");
assert.equal(parsePulse({ ...ok, runsToday: -1 }), null, "negative");
assert.equal(parsePulse({ ...ok, lastSeen: 1.5 }), null, "fraction");
assert.equal(parsePulse({ ...ok, lastSeen: "1" }), null, "string number");
assert.equal(parsePulse({ ...ok, runsToday: Infinity }), null, "infinite");
assert.equal(parsePulse(null), null);
console.log("pulse.check ok");
