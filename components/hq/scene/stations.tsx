"use client";

import { useMemo, useRef, type ComponentType } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  type Group,
  InstancedMesh,
  Color,
  MeshStandardMaterial,
  Object3D,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import { STATIONS, type Station, type StationId } from "@/data/stations";
import { Box, COLORS, Chair, Cyl, Monitor, Plant } from "./primitives";
import {
  MEETING_TABLE,
  PHONE_BOOTH,
  PROJECT_DESKS,
  RACKS,
  RECEPTION,
  TROPHY_SHELF,
} from "./layout";

interface FurnitureProps {
  lit: boolean;
}

function Reception({ lit }: FurnitureProps) {
  const { x, z, d } = RECEPTION;
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0, 0]} s={[1.2, 1.0, d]} c={COLORS.wood} />
      <Box p={[0.1, 1.0, 0]} s={[1.0, 0.06, d + 0.1]} c="#c79a6b" />
      <Box p={[-0.45, 0, 0]} s={[0.1, 1.1, d]} c={COLORS.darkWood} />
      <Monitor p={[-0.1, 1.06, -0.9]} rot={Math.PI / 2} color="#f2a93b" lit={lit} />
      <Box p={[0.1, 1.06, 0.5]} s={[0.35, 0.03, 0.25]} c="#dfe3ea" />
      <Cyl p={[0.2, 1.06, 1.1]} s={[0.1, 0.05, 0.1]} c={COLORS.gold} e={COLORS.gold} ei={0.3} />
      <Plant p={[-0.1, 1.06, 1.35]} tall={0.4} />
    </group>
  );
}

const SCREEN_COLORS = ["#4fc3f7", "#7bd88f", "#f2a93b"];

function ProjectDesks({ lit }: FurnitureProps) {
  return (
    <group>
      {PROJECT_DESKS.map((r, i) => (
        <group key={i} position={[r.x, 0, r.z]}>
          <Box p={[0, 0.72, 0]} s={[r.w, 0.06, r.d]} c={COLORS.wood} />
          <Box p={[-r.w / 2 + 0.05, 0, 0]} s={[0.08, 0.72, r.d - 0.1]} c={COLORS.darkWood} />
          <Box p={[r.w / 2 - 0.05, 0, 0]} s={[0.08, 0.72, r.d - 0.1]} c={COLORS.darkWood} />
          <Monitor p={[-0.35, 0.78, -0.15]} color={SCREEN_COLORS[i]} lit={lit} />
          <Monitor p={[0.35, 0.78, -0.15]} color={SCREEN_COLORS[(i + 1) % 3]} lit={lit} />
          <Box p={[0, 0.78, 0.25]} s={[0.4, 0.02, 0.14]} c="#22252b" />
          <Chair p={[0, 0, 0.9]} rot={Math.PI} />
        </group>
      ))}
    </group>
  );
}

function MeetingTable({ lit }: FurnitureProps) {
  const { x, z } = MEETING_TABLE;
  const seats = 6;
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0, 0]} s={[0.35, 0.72, 0.35]} c={COLORS.darkWood} />
      <Cyl p={[0, 0.72, 0]} s={[1.1, 0.07, 1.1]} c="#c9805a" e={lit ? "#ef8a62" : undefined} ei={0.25} />
      {Array.from({ length: seats }, (_, i) => {
        const a = (i / seats) * Math.PI * 2 + 0.3;
        return (
          <Chair
            key={i}
            p={[Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45]}
            rot={Math.atan2(-Math.cos(a), -Math.sin(a))}
            color="#4d5670"
          />
        );
      })}
      <Box p={[0.3, 0.79, 0.2]} s={[0.4, 0.02, 0.28]} c="#e8e2d4" rot={0.4} />
      <Box p={[-0.5, 0.79, -0.3]} s={[0.35, 0.02, 0.25]} c="#dfe3ea" rot={-0.3} />
      <Cyl p={[0, 0.79, 0]} s={[0.08, 0.14, 0.08]} c="#f3e6d0" />
    </group>
  );
}

const LED_COLORS = ["#4cff7a", "#ffb02e", "#4fc3f7"];
const ledMaterials = LED_COLORS.map(
  (c) =>
    new MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1, roughness: 0.4 }),
);

function ServerRacks({ lit }: FurnitureProps) {
  const { x, z, d } = RACKS;
  const count = 3;
  const pitch = d / count;
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ledMaterials[0].emissiveIntensity = 0.5 + 0.5 * Math.sin(t * 3.1);
    ledMaterials[1].emissiveIntensity = Math.sin(t * 7.3) > 0.2 ? 1.4 : 0.15;
    ledMaterials[2].emissiveIntensity = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.7));
  });
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: count }, (_, i) => {
        const rz = -d / 2 + pitch * (i + 0.5);
        return (
          <group key={i} position={[0, 0, rz]}>
            <Box p={[0, 0, 0]} s={[1.0, 2.0, pitch - 0.15]} c="#232832" />
            <Box p={[0.49, 0.1, 0]} s={[0.04, 1.8, pitch - 0.3]} c={lit ? "#2c3340" : "#1a1e26"} />
            {Array.from({ length: 9 }, (_, row) => (
              <group key={row} position={[0.53, 0.2 + row * 0.19, 0]}>
                <mesh
                  position={[0, 0, -0.18]}
                  material={ledMaterials[(row + i) % 3]}
                  scale={[0.03, 0.05, 0.05]}
                >
                  <boxGeometry />
                </mesh>
                <mesh
                  position={[0, 0, 0.05]}
                  material={ledMaterials[(row + i + 1) % 3]}
                  scale={[0.03, 0.05, 0.05]}
                >
                  <boxGeometry />
                </mesh>
                <Box p={[0, -0.03, 0.2]} s={[0.02, 0.06, 0.12]} c="#0f1115" shadow={false} />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Cup({ p, s = 1 }: { p: [number, number, number]; s?: number }) {
  const g = COLORS.gold;
  return (
    <group position={p} scale={s}>
      <Box p={[0, 0, 0]} s={[0.22, 0.06, 0.22]} c="#4a2f1d" />
      <Cyl p={[0, 0.06, 0]} s={[0.1, 0.03, 0.1]} c={g} e={g} ei={0.25} />
      <Cyl p={[0, 0.09, 0]} s={[0.025, 0.14, 0.025]} c={g} e={g} ei={0.25} />
      <Cyl p={[0, 0.23, 0]} s={[0.12, 0.16, 0.12]} c={g} e={g} ei={0.35} />
      <Box p={[-0.14, 0.27, 0]} s={[0.04, 0.07, 0.03]} c={g} e={g} ei={0.25} />
      <Box p={[0.14, 0.27, 0]} s={[0.04, 0.07, 0.03]} c={g} e={g} ei={0.25} />
    </group>
  );
}

function TrophyShelf({ lit }: FurnitureProps) {
  const { x, z, w, d } = TROPHY_SHELF;
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0, -0.32]} s={[w, 2.2, 0.15]} c={COLORS.darkWood} />
      <Box p={[-w / 2 + 0.05, 0, 0]} s={[0.1, 2.2, d]} c={COLORS.darkWood} />
      <Box p={[w / 2 - 0.05, 0, 0]} s={[0.1, 2.2, d]} c={COLORS.darkWood} />
      {[0.05, 0.75, 1.45, 2.15].map((y) => (
        <Box key={y} p={[0, y, 0]} s={[w, 0.06, d]} c={COLORS.wood} />
      ))}
      {[-0.5, 0.5].map((cx) => (
        <Cup key={cx} p={[cx, 0.11, 0]} s={lit ? 1.12 : 1} />
      ))}
      {[-0.9, 0, 0.9].map((cx) => (
        <Cup key={cx} p={[cx, 0.81, 0]} s={lit ? 1.12 : 1} />
      ))}
      <Cup p={[0, 1.51, 0]} s={lit ? 1.6 : 1.4} />
    </group>
  );
}

const CELL_COLS = 26;
const CELL_ROWS = 7;
const LEVELS = ["#2f2540", "#5b4a8c", "#7d66c0", "#a58ae8", "#d0bcff"];

function ContributionCells() {
  const ref = useRef<InstancedMesh>(null);
  const setup = (mesh: InstancedMesh | null) => {
    ref.current = mesh;
    if (!mesh) return;
    const o = new Object3D();
    const col = new Color();
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let c = 0; c < CELL_COLS; c++) {
      for (let r = 0; r < CELL_ROWS; r++) {
        const i = c * CELL_ROWS + r;
        o.position.set((c - (CELL_COLS - 1) / 2) * 0.15, (CELL_ROWS - 1 - r) * 0.15, 0);
        o.scale.setScalar(0.12);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        const v = rnd();
        mesh.setColorAt(i, col.set(LEVELS[v > 0.85 ? 4 : v > 0.65 ? 3 : v > 0.4 ? 2 : v > 0.2 ? 1 : 0]));
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
  return (
    <instancedMesh ref={setup} args={[undefined, undefined, CELL_COLS * CELL_ROWS]}>
      <boxGeometry args={[1, 1, 0.3]} />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

function WallScreen({ lit }: FurnitureProps) {
  const [x, z] = [-6.5, -6.96];
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.3, 0.2]} s={[4.4, 0.45, 0.5]} c="#2b2f38" />
      <Box p={[0, 0.85, 0]} s={[4.6, 1.85, 0.12]} c="#14161b" />
      <Box p={[0, 0.92, 0.07]} s={[4.4, 1.7, 0.03]} c="#241a3a" e="#6a4fb3" ei={lit ? 0.6 : 0.3} shadow={false} />
      <group position={[0, 1.55, 0.12]}>
        <ContributionCells />
      </group>
      <Box p={[-1.9, 0.9, 0.09]} s={[0.4, 0.08, 0.02]} c="#d0bcff" e="#d0bcff" ei={0.8} shadow={false} />
    </group>
  );
}

function PhoneBooth({ lit }: FurnitureProps) {
  const { x, z } = PHONE_BOOTH;
  const c = "#2b2f38";
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0, 0]} s={[1.3, 0.08, 1.3]} c="#1c1f25" />
      {[
        [-0.6, -0.6],
        [-0.6, 0.6],
        [0.6, -0.6],
        [0.6, 0.6],
      ].map(([px, pz]) => (
        <Box key={`${px}${pz}`} p={[px, 0, pz]} s={[0.1, 2.2, 0.1]} c={c} />
      ))}
      <Box p={[0, 2.2, 0]} s={[1.4, 0.12, 1.4]} c="#ff6f91" e="#ff6f91" ei={lit ? 0.8 : 0.35} />
      <Box p={[0.6, 0.08, 0]} s={[0.06, 2.1, 1.2]} c="#8b4a5e" />
      <Box p={[0, 0.08, -0.6]} s={[1.2, 2.1, 0.04]} c="#9ad8ff" opacity={0.22} shadow={false} />
      <Box p={[0, 0.08, 0.6]} s={[1.2, 2.1, 0.04]} c="#9ad8ff" opacity={0.22} shadow={false} />
      <Box p={[0.5, 1.2, 0]} s={[0.08, 0.3, 0.2]} c="#e8e2d4" />
      <Box p={[0.45, 1.5, 0]} s={[0.06, 0.1, 0.4]} c="#14161b" />
      <Box p={[0.45, 1.05, 0]} s={[0.04, 0.05, 0.18]} c="#4cff7a" e="#4cff7a" ei={0.8} shadow={false} />
    </group>
  );
}

export const STATION_PROPS: Record<StationId, ComponentType<FurnitureProps>> = {
  about: Reception,
  projects: ProjectDesks,
  experience: MeetingTable,
  skills: ServerRacks,
  awards: TrophyShelf,
  github: WallScreen,
  contact: PhoneBooth,
};

function Ring({ station, active }: { station: Station; active: boolean }) {
  const mesh = useRef<Mesh>(null);
  const mat = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 3) * 0.06;
    mesh.current?.scale.setScalar(active ? pulse * 1.12 : pulse);
    if (mat.current) mat.current.opacity = active ? 0.95 : 0.5;
  });
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[station.position[0], 0.03, station.position[1]]}>
      <ringGeometry args={[0.42, 0.58, 40]} />
      <meshBasicMaterial ref={mat} color={station.accent} transparent opacity={0.5} />
    </mesh>
  );
}

function Tag({
  station,
  near,
  visited,
  onActivate,
}: {
  station: Station;
  near: boolean;
  visited: boolean;
  onActivate: (id: StationId) => void;
}) {
  return (
    <Html
      position={[station.position[0], 2.9, station.position[1]]}
      center
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
    >
      <button
        type="button"
        onClick={() => onActivate(station.id)}
        className="pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-[3px] border border-[#4a3320] bg-[#17100b]/90 px-2.5 py-1 font-mono text-[11px] tracking-wide text-[#f3e6d0] shadow-lg backdrop-blur-sm"
        style={{ borderLeft: `3px solid ${station.accent}` }}
      >
        {station.label}
        {visited && <span className="text-[#7bd88f]">✓</span>}
        {near && (
          <span className="rounded-[2px] bg-[#f2a93b] px-1.5 py-px text-[10px] font-semibold text-[#1a110b]">
            <span className="[@media(hover:none)]:hidden">Press E</span>
            <span className="hidden [@media(hover:none)]:inline">Tap</span>
          </span>
        )}
      </button>
    </Html>
  );
}

interface StationNodesProps {
  near: StationId | null;
  inspecting: StationId | null;
  visited: ReadonlySet<StationId>;
  onActivate: (id: StationId) => void;
}

export function StationNodes({ near, inspecting, visited, onActivate }: StationNodesProps) {
  return (
    <>
      {STATIONS.map((s) => {
        const Furniture = STATION_PROPS[s.id];
        const active = near === s.id || inspecting === s.id;
        return <StationNode key={s.id} station={s} Furniture={Furniture} active={active} near={near === s.id} visited={visited.has(s.id)} onActivate={onActivate} />;
      })}
    </>
  );
}

function StationNode({
  station,
  Furniture,
  active,
  near,
  visited,
  onActivate,
}: {
  station: Station;
  Furniture: ComponentType<FurnitureProps>;
  active: boolean;
  near: boolean;
  visited: boolean;
  onActivate: (id: StationId) => void;
}) {
  const group = useRef<Group>(null);
  const userData = useMemo(() => ({ stationId: station.id }), [station.id]);
  return (
    <>
      <group ref={group} userData={userData}>
        <Furniture lit={active} />
      </group>
      <Ring station={station} active={active} />
      <Tag station={station} near={near} visited={visited} onActivate={onActivate} />
    </>
  );
}
