import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, type InstancedMesh, Matrix4, MeshBasicMaterial, type Object3D, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STATIONS, type Station, type StationId } from "@/data/stations";
import { ctl } from "../game";
import { ACCENT, CLAY, TONE, box, paint } from "./clay";
import { PLINTH_HEIGHT, buildStation } from "./dioramas";
import { LANDMARKS, R } from "./planet";
import { blobTexture, buildDecals, buildGround, softSquare } from "./props";

/** Static props never move again, so skip their per-frame matrix work. */
export function freeze(o: Object3D | null) {
  if (!o) return;
  o.matrixAutoUpdate = false;
  o.updateMatrix();
}

const baseTile = new Color("#e9e7e2");
const accent = new Color(ACCENT);
const POP = 0.45;
const tileGeo = paint(box(0.85, 0.06, 0.85, 0.06).clone(), TONE.white);
const tileAt = new Matrix4().makeTranslation(1.05, PLINTH_HEIGHT + 0.03, 1.05);
const m = new Matrix4();
const scale = new Matrix4();
const tint = new Color();
const camDir = new Vector3();

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
  const ground = useMemo(() => buildGround(), []);
  const landmarks = useMemo(
    () => mergeGeometries(STATIONS.map((s) => buildStation(s.id).applyMatrix4(LANDMARKS[s.id].frame)), false),
    [],
  );
  const decals = useMemo(() => buildDecals(), []);
  const squareMat = useMemo(
    () => new MeshBasicMaterial({ map: softSquare(), transparent: true, opacity: 0.45, depthWrite: false, color: "#3a3226" }),
    [],
  );
  const roundMat = useMemo(
    () => new MeshBasicMaterial({ map: blobTexture(), transparent: true, opacity: 0.6, depthWrite: false }),
    [],
  );
  const tiles = useRef<InstancedMesh>(null);
  const tileState = useRef<TileState[]>(STATIONS.map(() => ({ lit: 0, pop: POP })));
  const tags = useRef<(HTMLDivElement | null)[]>([]);
  const seen = useRef(new Set<StationId>());
  const live = useRef({ near, inspecting });

  useEffect(() => {
    live.current = { near, inspecting };
  }, [near, inspecting]);

  useEffect(() => {
    STATIONS.forEach((s, i) => {
      if (visited.has(s.id) && !seen.current.has(s.id)) {
        seen.current.add(s.id);
        tileState.current[i].pop = 0;
      }
    });
  }, [visited]);

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const k = 1 - Math.exp(-dt * 6);
    const { near: nearId, inspecting: focus } = live.current;
    const cel = ctl.celebrate;
    if (cel.active) cel.t += dt;
    camDir.copy(camera.position).normalize();
    const mesh = tiles.current;
    for (let i = 0; i < STATIONS.length; i++) {
      const id = STATIONS[i].id;
      const t = tileState.current[i];
      const on = seen.current.has(id) ? 1 : 0;
      const hot = id === nearId || id === focus ? 1 : 0;
      t.lit += (on - t.lit) * k;
      if (t.pop < POP) t.pop += dt;
      const pulseT = cel.t - i * 0.08;
      const bump = t.pop < POP ? Math.sin((Math.PI * t.pop) / POP) : 0;
      const pulse = pulseT > 0 && pulseT < POP ? Math.sin((Math.PI * pulseT) / POP) : 0;
      const sx = 1 + 0.22 * bump + 0.18 * pulse + hot * 0.06;
      if (mesh) {
        m.multiplyMatrices(LANDMARKS[id].frame, tileAt).multiply(scale.makeScale(sx, 1 + 0.5 * (bump + pulse), sx));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, tint.lerpColors(baseTile, accent, t.lit));
      }
      // hide tags on the far side of the planet
      const el = tags.current[i];
      if (el) el.style.opacity = LANDMARKS[id].n.dot(camDir) > 0.5 ? "1" : "0";
    }
    if (mesh) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
    }
    if (cel.t > 2.6) cel.active = false;
  });

  return (
    <>
      <mesh ref={freeze} geometry={ground} material={CLAY} />
      <mesh ref={freeze} geometry={decals.squares} material={squareMat} renderOrder={1} />
      <mesh ref={freeze} geometry={decals.rounds} material={roundMat} renderOrder={1} />
      <mesh ref={freeze} geometry={landmarks} material={CLAY} userData={{ landmark: true }} />
      <instancedMesh
        ref={tiles}
        args={[tileGeo, CLAY, STATIONS.length]}
        frustumCulled={false}
        userData={{ landmark: true }}
      />
      {STATIONS.map((s, i) => (
        <Tag
          key={s.id}
          station={s}
          near={near === s.id}
          lit={visited.has(s.id)}
          bind={(el) => {
            tags.current[i] = el;
          }}
        />
      ))}
    </>
  );
}

const TAG_Y = 1.9;

interface TagProps {
  station: Station;
  near: boolean;
  lit: boolean;
  bind: (el: HTMLDivElement | null) => void;
}

function Tag({ station, near, lit, bind }: TagProps) {
  const at = useMemo(() => LANDMARKS[station.id].n.clone().multiplyScalar(R + TAG_Y), [station.id]);
  return (
    <Html position={at} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={bind}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium text-black transition-[transform,border-color,opacity] max-sm:px-2 max-sm:text-[10px] ${
          near ? "scale-110 border-hq-accent" : "border-hq-line"
        }`}
      >
        {lit && <span className="size-1.5 rounded-full bg-hq-accent" />}
        {station.label}
      </div>
    </Html>
  );
}
