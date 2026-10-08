import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, type InstancedMesh } from "three";
import { ctl } from "../game";
import { ACCENT, CLAY, TONE, box, paint } from "./clay";

const COUNT = 140;
const GRAVITY = 9;
const geo = paint(box(0.1, 0.1, 0.1, 0.03).clone(), "#ffffff");
const dummy = new Object3D();
const palette = [new Color("#ffffff"), new Color(ACCENT), new Color(TONE.light), new Color(ACCENT)];

interface Bit {
  v: [number, number, number];
  spin: [number, number, number];
}

/** One burst of clay cubes from the marble. Idle outside the burst, so zero per-frame cost. */
export function Confetti() {
  const mesh = useRef<InstancedMesh>(null);
  const bits = useRef<Bit[]>([]);
  const origin = useRef({ x: 0, z: 0 });
  const seen = useRef(false);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < COUNT; i++) m.setColorAt(i, palette[i % palette.length]);
    m.instanceColor!.needsUpdate = true;
  }, []);

  useFrame(() => {
    const m = mesh.current;
    const cel = ctl.celebrate;
    if (!m) return;
    if (cel.active && !seen.current) {
      seen.current = true;
      origin.current = { x: ctl.player.x, z: ctl.player.z };
      bits.current = Array.from({ length: COUNT }, () => {
        const a = Math.random() * Math.PI * 2;
        const out = 1 + Math.random() * 3.2;
        return {
          v: [Math.cos(a) * out, 5 + Math.random() * 4, Math.sin(a) * out],
          spin: [Math.random() * 8, Math.random() * 8, Math.random() * 8],
        };
      });
      m.visible = true;
    }
    if (!seen.current) return;
    const t = cel.t;
    if (!cel.active) {
      m.visible = false;
      seen.current = false;
      return;
    }
    bits.current.forEach((b, i) => {
      dummy.position.set(
        origin.current.x + b.v[0] * t,
        0.8 + b.v[1] * t - 0.5 * GRAVITY * t * t,
        origin.current.z + b.v[2] * t,
      );
      dummy.rotation.set(b.spin[0] * t, b.spin[1] * t, b.spin[2] * t);
      const s = Math.max(0, 1 - Math.max(0, t - 1.8) / 0.8);
      dummy.scale.setScalar(dummy.position.y < 0 ? 0 : s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geo, CLAY, COUNT]} visible={false} frustumCulled={false} />;
}
