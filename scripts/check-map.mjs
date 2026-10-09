import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// planet.ts uses the "@/" alias and extensionless imports, which plain Node can't resolve
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith("@/")) spec = pathToFileURL(`${process.cwd()}/${spec.slice(2)}`).href;
    if (/^(\.|file:)/.test(spec) && !/\.[cm]?[jt]sx?$/.test(spec)) {
      const url = new URL(spec, ctx.parentURL);
      if (existsSync(`${fileURLToPath(url)}.ts`)) spec = `${url.href}.ts`;
    }
    return next(spec, ctx);
  },
});

const { Vector3 } = await import("three");
const { mapXY, dirAt, flatten } = await import("../components/hq/scene/planet.ts");

const near = (got, x, y, what) =>
  assert.ok(Math.abs(got.x - x) < 1e-6 && Math.abs(got.y - y) < 1e-6, `${what}: got (${got.x}, ${got.y})`);
const center = dirAt(30, 40);
const up = flatten(new Vector3(0, 1, 0), center);
const right = new Vector3().crossVectors(up, center);
const out = { x: 0, y: 0 };
const along = (dir, angle) =>
  center.clone().multiplyScalar(Math.cos(angle)).addScaledVector(dir, Math.sin(angle));

near(mapXY(center, up, center, out), 0, 0, "center maps to the origin");
near(mapXY(center, up, along(up, 0.5), out), 0, 0.5, "0.5 rad toward up");
near(mapXY(center, up, along(right, 1.2), out), 1.2, 0, "1.2 rad toward right");
near(mapXY(center, up, along(up.clone().add(right).normalize(), 2), out), Math.SQRT2, Math.SQRT2, "diagonal at 2 rad");
mapXY(center, up, center.clone().negate(), out);
assert.ok(Math.abs(Math.hypot(out.x, out.y) - Math.PI) < 1e-6, "antipode sits on the rim at radius pi");
console.log("mapXY ok");
