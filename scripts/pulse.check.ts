import assert from "node:assert/strict";
import { cleanTitle, parsePulse } from "../data/pulse.ts";

const agent = { provider: "claude", phase: "tool", kind: "edit", title: "Agent pulse villagers" };
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
assert.notEqual(parsePulse({ ...ok, agents: [{ ...agent, title: null }] }), null, "untitled");
assert.equal(parsePulse({ ...ok, agents: [{ ...agent, title: "x".repeat(61) }] }), null, "long title");
assert.equal(parsePulse({ ...ok, agents: [{ ...agent, title: "see https://x.io/a" }] }), null, "raw url in title");
assert.equal(parsePulse({ ...ok, agents: [{ ...agent, title: 5 }] }), null, "non-string title");
assert.equal(cleanTitle("Fix  login\nfor bob@corp.com"), "Fix login for …");
assert.equal(cleanTitle("rotate sk-ant-api03-abcdefghijklmnopqrstuvwxyz key"), "rotate … key");
assert.equal(cleanTitle("see https://example.com/x?y=1 now"), "see … now");
assert.equal(cleanTitle("a".repeat(80)), "…");
assert.equal(cleanTitle("word ".repeat(20)), `${"word ".repeat(12).trimEnd()}…`);
assert.equal(cleanTitle("   "), null);
assert.equal(cleanTitle(undefined), null);
assert.equal(parsePulse(null), null);
console.log("pulse.check ok");
