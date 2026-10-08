import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { ctl } from "../game";
import { Box } from "./primitives";
import { isBlocked } from "./layout";

const SPEED = 4.2;
const SQ = Math.SQRT1_2;

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Screen-relative input mapped to the isometric ground plane. */
function readInput(keys: Set<string>): [number, number] {
  const ix = +(keys.has("KeyD") || keys.has("ArrowRight")) - +(keys.has("KeyA") || keys.has("ArrowLeft"));
  const iy = +(keys.has("KeyW") || keys.has("ArrowUp")) - +(keys.has("KeyS") || keys.has("ArrowDown"));
  return [(ix - iy) * SQ, (-ix - iy) * SQ];
}

export function Avatar() {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const anim = useRef({ phase: 0, amp: 0, stuck: 0 });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const p = ctl.player;
    const a = anim.current;
    let vx = 0;
    let vz = 0;
    let aimDist = Infinity;

    if (!ctl.frozen) {
      [vx, vz] = readInput(ctl.keys);
      if (vx || vz) {
        ctl.target = null;
      } else if (ctl.target) {
        const [ax, az] = ctl.path[0] ?? [ctl.target.x, ctl.target.z];
        const dx = ax - p.x;
        const dz = az - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.12) {
          if (ctl.path.length) ctl.path.shift();
          else if (!ctl.target.station) ctl.target = null;
        } else {
          vx = dx / dist;
          vz = dz / dist;
          aimDist = dist;
        }
      }
    }

    const len = Math.hypot(vx, vz);
    let moved = 0;
    if (len > 0) {
      vx /= len;
      vz /= len;
      let step = SPEED * dt;
      step = Math.min(step, aimDist);
      const nx = p.x + vx * step;
      const nz = p.z + vz * step;
      const ox = p.x;
      const oz = p.z;
      if (!isBlocked(nx, p.z)) p.x = nx;
      if (!isBlocked(p.x, nz)) p.z = nz;
      moved = Math.hypot(p.x - ox, p.z - oz);
      p.heading += wrapAngle(Math.atan2(vx, vz) - p.heading) * Math.min(1, dt * 14);
    }

    if (ctl.target && len > 0 && moved < SPEED * dt * 0.25) {
      a.stuck += dt;
      if (a.stuck > 0.4) ctl.target = null;
    } else {
      a.stuck = 0;
    }

    const walking = moved > 0;
    a.amp += ((walking ? 1 : 0) - a.amp) * Math.min(1, dt * 12);
    if (walking) a.phase += dt * 10;
    const swing = Math.sin(a.phase) * 0.8 * a.amp;

    if (root.current) {
      root.current.position.set(p.x, 0, p.z);
      root.current.rotation.y = p.heading;
    }
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(a.phase)) * 0.06 * a.amp;
    }
    if (armL.current) armL.current.rotation.x = swing;
    if (armR.current) armR.current.rotation.x = -swing;
    if (legL.current) legL.current.rotation.x = -swing;
    if (legR.current) legR.current.rotation.x = swing;
  });

  const skin = "#e0a878";
  return (
    <group ref={root} position={[ctl.player.x, 0, ctl.player.z]}>
      <group ref={body}>
        <group ref={legL} position={[-0.12, 0.5, 0]}>
          <Box p={[0, -0.5, 0]} s={[0.2, 0.5, 0.22]} c="#2b3a5c" />
        </group>
        <group ref={legR} position={[0.12, 0.5, 0]}>
          <Box p={[0, -0.5, 0]} s={[0.2, 0.5, 0.22]} c="#2b3a5c" />
        </group>
        <Box p={[0, 0.5, 0]} s={[0.46, 0.55, 0.28]} c="#e8a03a" />
        <group ref={armL} position={[-0.31, 1.0, 0]}>
          <Box p={[0, -0.5, 0]} s={[0.16, 0.5, 0.18]} c="#e8a03a" />
          <Box p={[0, -0.58, 0]} s={[0.15, 0.1, 0.17]} c={skin} />
        </group>
        <group ref={armR} position={[0.31, 1.0, 0]}>
          <Box p={[0, -0.5, 0]} s={[0.16, 0.5, 0.18]} c="#e8a03a" />
          <Box p={[0, -0.58, 0]} s={[0.15, 0.1, 0.17]} c={skin} />
        </group>
        <Box p={[0, 1.05, 0]} s={[0.4, 0.4, 0.38]} c={skin} />
        <Box p={[0, 1.38, 0]} s={[0.44, 0.14, 0.42]} c="#2a1a12" />
        <Box p={[0, 1.05, -0.2]} s={[0.44, 0.38, 0.06]} c="#2a1a12" />
        <Box p={[-0.1, 1.2, 0.19]} s={[0.06, 0.07, 0.02]} c="#1a1210" shadow={false} />
        <Box p={[0.1, 1.2, 0.19]} s={[0.06, 0.07, 0.02]} c="#1a1210" shadow={false} />
      </group>
      <Html position={[0, 1.95, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-[3px] border-l-[3px] border-[#f2a93b] bg-[#17100b]/90 px-2 py-0.5 font-mono text-[10px] tracking-wider text-[#f3e6d0]">
          Theo
        </div>
      </Html>
    </group>
  );
}
