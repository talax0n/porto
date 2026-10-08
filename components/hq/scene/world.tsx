import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  CanvasTexture,
  Color,
  Euler,
  type BufferGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STATIONS, type Station, type StationId } from "@/data/stations";
import { ctl } from "../game";
import { ACCENT, CLAY, box, cyl, merge, part, type Part } from "./clay";
import { buildStation } from "./dioramas";
import { PLINTH_HEIGHT, PLINTH_SIZE } from "./layout";

/** Static props never move again, so skip their per-frame matrix work. */
export function freeze(o: Object3D | null) {
  if (!o) return;
  o.matrixAutoUpdate = false;
  o.updateMatrix();
}

function pathGeometry(): BufferGeometry {
  const parts: Part[] = [part(cyl(1.3, 1.3, 0.06), [0, 0.03, 0])];
  for (const { position: [x, z] } of STATIONS) {
    const len = Math.hypot(x, z);
    parts.push(
      part(box(len, 0.06, 0.7, 0.03), [x / 2, 0.03, z / 2], { rot: [0, -Math.atan2(z, x), 0] }),
      part(cyl(0.75, 0.75, 0.06), [x, 0.03, z]),
    );
  }
  return merge(parts);
}

function softSquare(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.shadowColor = "#000";
  g.shadowBlur = 22;
  g.shadowOffsetX = 1000;
  g.fillStyle = "#000";
  g.beginPath();
  g.roundRect(32 - 1000, 32, 64, 64, 10);
  g.fill();
  return new CanvasTexture(c);
}

/** One draw call of soft footprints under every plinth, standing in for baked contact shadows. */
function footprintGeometry(): BufferGeometry {
  const size = PLINTH_SIZE * 2;
  const flat = new Matrix4();
  const planes = STATIONS.map(({ plinth: [x, z] }) => {
    const g = new PlaneGeometry(size, size);
    flat.compose(
      new Vector3(x - 0.25, 0.012, z - 0.25),
      new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)),
      new Vector3(1, 1, 1),
    );
    return g.applyMatrix4(flat);
  });
  return mergeGeometries(planes, false);
}

const baseTile = new Color("#e9e7e2");
const accent = new Color(ACCENT);
const POP = 0.45;
const tileGeo = box(0.85, 0.06, 0.85, 0.06);

interface TileState {
  lit: number;
  pop: number;
}

interface WorldProps {
  near: StationId | null;
  inspecting: StationId | null;
  visited: ReadonlySet<StationId>;
}

export function World({ near, inspecting, visited }: WorldProps) {
  const stationGeos = useMemo(() => STATIONS.map((s) => buildStation(s.id)), []);
  const tagY = useMemo(
    () => stationGeos.map((g) => (g.computeBoundingBox(), g.boundingBox!.max.y + 1)),
    [stationGeos],
  );
  const paths = useMemo(() => pathGeometry(), []);
  const footprints = useMemo(() => footprintGeometry(), []);
  const footMat = useMemo(
    () => new MeshBasicMaterial({ map: softSquare(), transparent: true, opacity: 0.5, depthWrite: false, color: "#3a3226" }),
    [],
  );
  const tileMats = useMemo(
    () => STATIONS.map(() => new MeshStandardMaterial({ color: baseTile, roughness: 0.85, metalness: 0 })),
    [],
  );
  const tileMeshes = useRef<(Mesh | null)[]>([]);
  const tiles = useRef<TileState[]>(STATIONS.map(() => ({ lit: 0, pop: POP })));
  const seen = useRef(new Set<StationId>());
  const live = useRef({ near, inspecting });

  useEffect(() => {
    live.current = { near, inspecting };
  }, [near, inspecting]);

  useEffect(() => {
    STATIONS.forEach((s, i) => {
      if (visited.has(s.id) && !seen.current.has(s.id)) {
        seen.current.add(s.id);
        tiles.current[i].pop = 0;
      }
    });
  }, [visited]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const k = 1 - Math.exp(-dt * 6);
    const { near: nearId, inspecting: focus } = live.current;
    const cel = ctl.celebrate;
    if (cel.active) cel.t += dt;
    tiles.current.forEach((t, i) => {
      const id = STATIONS[i].id;
      const on = seen.current.has(id) ? 1 : 0;
      const hot = id === nearId || id === focus ? 1 : 0;
      t.lit += (on - t.lit) * k;
      tileMats[i].color.lerpColors(baseTile, accent, t.lit);
      tileMats[i].emissive.copy(accent).multiplyScalar(t.lit * 0.35 + hot * 0.12);
      if (t.pop < POP) t.pop += dt;
      const pulseT = cel.t - i * 0.08;
      const bump = Math.sin(Math.PI * Math.min(1, Math.max(0, t.pop / POP))) * (t.pop < POP ? 1 : 0);
      const pulse = pulseT > 0 && pulseT < POP ? Math.sin((Math.PI * pulseT) / POP) : 0;
      const s = 1 + 0.22 * bump + 0.18 * pulse + hot * 0.04;
      tileMeshes.current[i]?.scale.set(s, 1 + 0.5 * (bump + pulse), s);
    });
    if (cel.t > 2.6) cel.active = false;
  });

  return (
    <>
      <mesh ref={freeze} geometry={footprints} material={footMat} renderOrder={1} />
      <mesh ref={freeze} geometry={paths} material={CLAY} receiveShadow />
      {STATIONS.map((s, i) => (
        <group key={s.id}>
          <mesh
            ref={freeze}
            geometry={stationGeos[i]}
            material={CLAY}
            position={[s.plinth[0], 0, s.plinth[1]]}
            castShadow
            receiveShadow
            userData={{ stationId: s.id }}
          />
          <mesh
            ref={(m) => {
              tileMeshes.current[i] = m;
            }}
            geometry={tileGeo}
            material={tileMats[i]}
            position={[s.plinth[0] + 1.05, PLINTH_HEIGHT + 0.03, s.plinth[1] + 1.05]}
            userData={{ stationId: s.id }}
          />
          <Tag station={s} y={tagY[i]} near={near === s.id} lit={visited.has(s.id)} />
        </group>
      ))}
    </>
  );
}

function Tag({ station, y, near, lit }: { station: Station; y: number; near: boolean; lit: boolean }) {
  return (
    <Html
      position={[station.plinth[0], y, station.plinth[1]]}
      center
      zIndexRange={[10, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-2.5 py-1 text-[11px] max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[9px] font-medium text-black transition-[transform,border-color] ${
          near ? "scale-110 border-hq-accent" : "border-hq-line"
        }`}
      >
        {lit && <span className="size-1.5 rounded-full bg-hq-accent" />}
        {station.label}
        {near && (
          <kbd className="rounded border border-hq-line px-1 text-[9px] leading-4 text-hq-mute pointer-coarse:hidden">E</kbd>
        )}
      </div>
    </Html>
  );
}
