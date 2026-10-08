import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  type Group,
  type Mesh,
  MeshBasicMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { ctl } from "../game";
import { ACCENT, CLAY, TONE, ball, paint } from "./clay";
import { isBlocked } from "./layout";

const RADIUS = 0.35;
const SPEED = 4.2;
const SQ = Math.SQRT1_2;
const UP = new Vector3(0, 1, 0);

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Screen-relative input mapped to the isometric ground plane. */
function readInput(keys: Set<string>): [number, number] {
  const ix = +(keys.has("KeyD") || keys.has("ArrowRight")) - +(keys.has("KeyA") || keys.has("ArrowLeft"));
  const iy = +(keys.has("KeyW") || keys.has("ArrowUp")) - +(keys.has("KeyS") || keys.has("ArrowDown"));
  return [(ix - iy) * SQ, (-ix - iy) * SQ];
}

/** Soft thumbprints in the vertex colours, so the roll is visible on an all-white ball. */
function marbleGeometry() {
  const g = new SphereGeometry(RADIUS, 32, 24);
  const base = new Color(TONE.white);
  const shade = new Color(TONE.mid);
  const n = g.getAttribute("normal");
  const col = new Float32Array(n.count * 3);
  const c = new Color();
  for (let i = 0; i < n.count; i++) {
    const v = Math.sin(n.getX(i) * 4.2 + 1) * Math.sin(n.getY(i) * 4.2 + 2) * Math.sin(n.getZ(i) * 4.2);
    c.copy(base).lerp(shade, Math.min(1, Math.max(0, (v - 0.25) * 2.2)) * 0.7);
    c.toArray(col, i * 3);
  }
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  return g;
}

function blobTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(40,34,24,0.55)");
  grad.addColorStop(1, "rgba(40,34,24,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

const eyeGeo = paint(ball(0.05).clone(), "#1c1c1e");
const sphere = marbleGeometry();
const blobMat = new MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false });
const ringMat = new MeshBasicMaterial({ color: ACCENT });

export function Marble() {
  const root = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const face = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const blob = useRef<Mesh>(null);
  const anim = useRef({ sq: 0, sqv: 0, moving: false, stuck: 0, vx: 0, vz: 0, t: 0 });
  const roll = useMemo(() => new Quaternion(), []);
  const dq = useMemo(() => new Quaternion(), []);
  const axis = useMemo(() => new Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const p = ctl.player;
    const a = anim.current;
    let ix = 0;
    let iz = 0;
    let aimDist = Infinity;

    if (!ctl.frozen) {
      [ix, iz] = readInput(ctl.keys);
      if (ix || iz) {
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
          ix = dx / dist;
          iz = dz / dist;
          aimDist = dist;
        }
      }
    }

    const len = Math.hypot(ix, iz);
    const wantMove = len > 0;
    if (wantMove) {
      ix /= len;
      iz /= len;
    }
    // ease the velocity so the marble has weight; slow into a clicked target
    const cap = Math.min(SPEED, aimDist * 5 + 0.6);
    const ease = 1 - Math.exp(-dt * (wantMove ? 9 : 12));
    a.vx += (ix * cap - a.vx) * ease;
    a.vz += (iz * cap - a.vz) * ease;

    const ox = p.x;
    const oz = p.z;
    const nx = p.x + a.vx * dt;
    const nz = p.z + a.vz * dt;
    if (!isBlocked(nx, p.z)) p.x = nx;
    if (!isBlocked(p.x, nz)) p.z = nz;
    const moved = Math.hypot(p.x - ox, p.z - oz);

    if (ctl.target && wantMove && moved < SPEED * dt * 0.2) {
      a.stuck += dt;
      if (a.stuck > 0.4) ctl.target = null;
    } else {
      a.stuck = 0;
    }

    const speed = moved / Math.max(dt, 1e-4);
    const rolling = speed > 0.6;
    if (rolling !== a.moving) {
      a.moving = rolling;
      a.sqv += rolling ? 4 : -3.5;
    }
    // damped spring: squash on start/stop, overshoot reads as stretch
    a.sqv += (-170 * a.sq - 15 * a.sqv) * dt;
    a.sq += a.sqv * dt;

    if (moved > 1e-5) {
      const dx = (p.x - ox) / moved;
      const dz = (p.z - oz) / moved;
      axis.set(dz, 0, -dx);
      roll.premultiply(dq.setFromAxisAngle(axis, moved / RADIUS));
      p.heading += wrapAngle(Math.atan2(dx, dz) - p.heading) * Math.min(1, dt * 10);
    }

    a.t += dt;
    const y = RADIUS * (1 - a.sq);
    const r = root.current;
    if (r) {
      r.position.set(p.x, y, p.z);
      r.scale.set(1 + a.sq * 0.5, 1 - a.sq, 1 + a.sq * 0.5);
    }
    body.current?.quaternion.copy(roll);
    face.current?.setRotationFromAxisAngle(UP, p.heading);
    if (halo.current) {
      const s = 1 + 0.06 * Math.sin(a.t * 3);
      halo.current.position.set(p.x, 0.04, p.z);
      halo.current.scale.set(s, s, s);
    }
    blob.current?.position.set(p.x - 0.05, 0.015, p.z - 0.05);
  });

  return (
    <>
      <group ref={root} position={[ctl.player.x, RADIUS, ctl.player.z]}>
        <mesh ref={body} geometry={sphere} material={CLAY} />
        <group ref={face}>
          <mesh geometry={eyeGeo} material={CLAY} position={[-0.11, 0.12, 0.31]} />
          <mesh geometry={eyeGeo} material={CLAY} position={[0.11, 0.12, 0.31]} />
        </group>
      </group>
      <mesh ref={halo} rotation-x={-Math.PI / 2} material={ringMat} renderOrder={2}>
        <torusGeometry args={[0.62, 0.035, 8, 40]} />
      </mesh>
      <mesh ref={blob} rotation-x={-Math.PI / 2} material={blobMat} renderOrder={2}>
        <planeGeometry args={[1.3, 1.3]} />
      </mesh>
    </>
  );
}
