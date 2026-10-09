import { useEffect, useRef } from "react";
import { BoxGeometry, Object3D, type InstancedMesh } from "three";
import { useContributions } from "../contributions";
import { CLAY, TONE, paint } from "./clay";
import { PLINTH_HEIGHT } from "./dioramas";
import { LANDMARKS } from "./planet";

const WEEKS = 16;
const DAYS = 7;
const PITCH = 0.165;
const CELL = 0.14;
// plain boxes: rounded ones cost 160 triangles a cell, 112 cells, for corners too small to see
const geo = paint(new BoxGeometry(CELL, 1, CELL), TONE.white);

/** The last 16 weeks as extruded clay cells, one instanced draw call. */
export function GithubGrid() {
  const load = useContributions();
  const ref = useRef<InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const weeks = load.status === "ok" ? load.data.weeks.slice(-WEEKS) : [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < DAYS; d++) {
        const level = weeks[w]?.[d]?.level ?? 0;
        const h = 0.05 + level * 0.14;
        dummy.position.set((w - (WEEKS - 1) / 2) * PITCH, PLINTH_HEIGHT + 0.12 + h / 2, (d - (DAYS - 1) / 2) * PITCH - 0.4);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(w * DAYS + d, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [load]);

  return (
    <instancedMesh
      ref={ref}
      args={[geo, CLAY, WEEKS * DAYS]}
      matrix={LANDMARKS.github.frame}
      matrixAutoUpdate={false}
      frustumCulled={false}
      userData={{ landmark: true }}
    />
  );
}
