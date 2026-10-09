import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  CircleGeometry,
  Matrix4,
  type Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Shape,
  ShapeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ctl } from "../game";
import { ACCENT } from "./clay";
import { flatten, frameAt } from "./planet";

export const MOVE = ACCENT;
export const DENY = "#ff5a4d";
const MOVE_TIME = 0.42;
const DENY_TIME = 0.26;
/** just clear of the ground: the sphere curves away under a flat marker, so only the edges float */
const LIFT = 0.05;

const reduced = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Shapes are drawn in the XY plane, then laid face-up. Every shape is symmetric under a quarter
 * turn, so the flip this puts on +Y doesn't show, and a single-sided transparent mesh is one draw
 * call where a double-sided one is two.
 */
const flat = (g: BufferGeometry) => g.rotateX(-Math.PI / 2);

/** a chunky V whose tip points at the origin, sitting `gap` out along +Y */
function chevron(gap: number) {
  const v = new Shape()
    .moveTo(0, gap)
    .lineTo(0.3, gap + 0.3)
    .lineTo(0.3, gap + 0.54)
    .lineTo(0, gap + 0.24)
    .lineTo(-0.3, gap + 0.54)
    .lineTo(-0.3, gap + 0.3)
    .closePath();
  return new ShapeGeometry(v);
}

const quarter = new Matrix4();
const chevrons = flat(
  mergeGeometries([0, 1, 2, 3].map((i) => chevron(0.45).applyMatrix4(quarter.makeRotationZ((i * Math.PI) / 2)))),
);

function bar(angle: number) {
  const b = new Shape().moveTo(-0.6, -0.12).lineTo(0.6, -0.12).lineTo(0.6, 0.12).lineTo(-0.6, 0.12).closePath();
  return new ShapeGeometry(b).applyMatrix4(quarter.makeRotationZ(angle));
}
const cross = flat(mergeGeometries([bar(Math.PI / 4), bar(-Math.PI / 4)]));
const dot = flat(new CircleGeometry(0.22, 20));
const halo = flat(new RingGeometry(0.88, 1, 40));

// a decal on the ground: characters and props standing on it hide it, the offset only beats z-fighting
const mat = new MeshBasicMaterial({
  transparent: true,
  depthWrite: false,
  toneMapped: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});
const fwd = new Vector3();

/**
 * The Dota-style move command: four chevrons snap in on the clicked point while a ring shrinks
 * and everything fades. `ctl.ping` is the only state, so rapid clicks just restart it.
 */
export function Ping() {
  const arrows = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);

  useFrame(() => {
    const a = arrows.current;
    const r = ring.current;
    if (!a || !r) return;
    const { n, t, kind, color } = ctl.ping;
    const span = kind === "deny" ? DENY_TIME : MOVE_TIME;
    const k = (performance.now() / 1000 - t) / span;
    const live = k >= 0 && k < 1 && !ctl.frozen && ctl.intro === "ground";
    a.visible = r.visible = live;
    if (!live) return;

    const still = !!reduced?.matches;
    // a still marker is one dot that only fades
    a.geometry = still ? dot : kind === "deny" ? cross : chevrons;
    r.visible = !still && kind === "move";
    mat.color.copy(color);

    flatten(fwd.copy(ctl.north), n);
    frameAt(n, fwd, a.matrix, LIFT);
    r.matrix.copy(a.matrix);

    const out = 1 - k;
    if (still) {
      mat.opacity = out;
    } else if (kind === "deny") {
      // a quick sideways shake that settles as it fades
      a.matrix.multiply(quarter.makeTranslation(Math.sin(k * 28) * 0.12 * out, 0, 0));
      mat.opacity = Math.min(1, out * 1.6);
    } else {
      const snap = 1 - Math.min(1, k / 0.5) ** 2;
      a.matrix.scale(fwd.setScalar(0.5 + snap * 0.6));
      r.matrix.scale(fwd.setScalar(0.2 + out ** 2 * 0.3));
      mat.opacity = Math.min(1, out * 2.2);
    }
  });

  return (
    <>
      <mesh ref={arrows} geometry={chevrons} material={mat} matrixAutoUpdate={false} visible={false} renderOrder={3} frustumCulled={false} />
      <mesh ref={ring} geometry={halo} material={mat} matrixAutoUpdate={false} visible={false} renderOrder={3} frustumCulled={false} />
    </>
  );
}
