import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as nodeModule from "node:module";
import { pathToFileURL } from "node:url";

// the scene imports through the `@/` alias and without extensions, which bare node can't resolve
const root = pathToFileURL(`${process.cwd()}/`);
type Next = (spec: string, ctx: { parentURL?: string }) => unknown;
// @types/node here predates module.registerHooks, which node 23.5+ ships
const { registerHooks } = nodeModule as unknown as {
  registerHooks(hooks: { resolve(spec: string, ctx: { parentURL?: string }, next: Next): unknown }): void;
};
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith("@/")) spec = new URL(spec.slice(2), root).href;
    if (/^(\.|file:)/.test(spec) && !/\.[cm]?[jt]sx?$/.test(spec)) {
      const url = new URL(spec, ctx.parentURL).href;
      if (existsSync(new URL(`${url}.ts`))) return next(`${url}.ts`, ctx);
    }
    return next(spec, ctx);
  },
});
const { Vector3 } = await import("three");
const { LANDMARKS, NORTH_POLE, R, coast, dirAt, walk } = await import("../components/hq/scene/planet.ts");
const { PATHS, PATH_WIDTH, PLAZA, POND } = await import("../components/hq/scene/props.ts");

/** inland of the whole sandy shelf, so nothing built stands on the beach */
const DRY = -0.8;
let worst = -Infinity;

/** Every point within `r` of n, on a few rings, sits on dry land. */
function dry(what: string, n: InstanceType<typeof Vector3>, r: number) {
  const side = new Vector3(1, 0, 0).cross(n).normalize();
  if (side.lengthSq() === 0) side.set(0, 0, 1);
  for (let ring = 0; ring <= 4; ring++)
    for (let a = 0; a < 24; a++) {
      const p = n.clone();
      const dir = side.clone().applyAxisAngle(n, (a / 24) * Math.PI * 2);
      walk(p, dir, (r * ring) / 4);
      const k = coast(p);
      worst = Math.max(worst, k);
      assert.ok(k < DRY, `${what} is ${(k - DRY).toFixed(2)} too close to the sea`);
    }
}

for (const [id, l] of Object.entries(LANDMARKS)) {
  dry(`${id} plinth`, l.n, l.footprint + 0.4);
  dry(`${id} door`, l.door, 1.3);
}
dry("plaza", NORTH_POLE, PLAZA + 0.3);
dry("first-view pond", dirAt(25, 87), POND + 0.3);
for (const [a, b] of PATHS) {
  const p = a.clone();
  const dir = p.clone();
  const steps = 40;
  const len = Math.acos(Math.min(1, a.dot(b))) * R;
  dir.copy(b).addScaledVector(p, -p.dot(b)).normalize();
  for (let i = 0; i <= steps; i++) {
    dry("path", p, PATH_WIDTH / 2 + 0.2);
    walk(p, dir, len / steps, dir);
  }
}
console.log(`seas.check ok, nearest sea ${(DRY - worst).toFixed(2)} past the margin`);
