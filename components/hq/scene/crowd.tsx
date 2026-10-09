import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  type BufferGeometry,
  Euler,
  type Material,
  type Group,
  type InstancedMesh,
  Matrix4,
  type Mesh,
  MeshBasicMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
} from "three";
import { STATION_BY_ID, type StationId } from "@/data/stations";
import { ctl } from "../game";
import { ACCENT, CLAY } from "./clay";
import {
  HATS,
  HOP,
  PARTS,
  RADIUS,
  SCALE,
  SKIN,
  type Folk,
  type Hat,
  animate,
  makeCrowd,
  move,
  stepVillager,
} from "./folk";
import { LANDMARKS, R, arc, flatten, frameAt, steer, toward } from "./planet";
import { blobTexture } from "./props";

const SPEED = 3.2;
const GREET = 0.75;
const TURN = 10;

const folk = makeCrowd(ctl.player);
const N = folk.length;
const hatSlots = Object.fromEntries(HATS.map((h) => [h, folk.filter((f) => f.hat === h)])) as Record<Hat, Folk[]>;

const blobMat = new MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false });
const pipMat = new MeshBasicMaterial({ color: ACCENT });
const haloMat = new MeshBasicMaterial({ color: ACCENT });
const haloGeo = new TorusGeometry(0.42, 0.03, 6, 36).rotateX(Math.PI / 2);

const ONE = new Vector3(1, 1, 1);
const ZERO = new Matrix4().makeScale(0, 0, 0);
const base = new Matrix4();
const torso = new Matrix4();
const local = new Matrix4();
const hang = new Matrix4();
const q = new Quaternion();
const v = new Vector3();
const s = new Vector3();
const dir = new Vector3();
const input = new Vector3();
const right = new Vector3();
const before = new Vector3();
const eul = new Euler();
const rotXZ = (x: number, z: number) => q.setFromEuler(eul.set(x, 0, z));
const slot: Record<Hat, number> = { beanie: 0, cap: 0, ears: 0 };

function readInput(): boolean {
  const k = ctl.keys;
  const ix = +(k.has("KeyD") || k.has("ArrowRight")) - +(k.has("KeyA") || k.has("ArrowLeft"));
  const iy = +(k.has("KeyW") || k.has("ArrowUp")) - +(k.has("KeyS") || k.has("ArrowDown"));
  if (!ix && !iy) return false;
  const { n } = ctl.player;
  right.crossVectors(ctl.north, n);
  input.copy(ctl.north).multiplyScalar(iy).addScaledVector(right, ix);
  flatten(input, n);
  return true;
}

/** Player intent: keys beat a click target; returns the turn rate for leaning. */
function stepPlayer(f: Folk, dt: number, stuck: { t: number }): number {
  const p = ctl.player;
  let want = 0;
  if (!ctl.frozen && readInput()) {
    ctl.target = null;
    dir.copy(input);
    want = SPEED;
  } else if (!ctl.frozen && ctl.target) {
    const left = arc(p.n, ctl.target.n);
    if (left < 0.08) {
      if (!ctl.target.station) ctl.target = null;
    } else {
      toward(p.n, ctl.target.n, dir);
      want = Math.min(SPEED, left * 4 + 0.5);
    }
  }
  if (want > 0) steer(p.n, dir, RADIUS, ctl.target?.n ?? null);
  f.speed += (want - f.speed) * Math.min(1, dt * (want ? 9 : 12));

  const turn = want > 0 ? Math.atan2(v.crossVectors(p.heading, dir).dot(p.n), p.heading.dot(dir)) : 0;
  const lean = Math.max(-1.5, Math.min(1.5, turn * 3));
  if (want > 0) {
    p.heading.lerp(dir, Math.min(1, dt * TURN));
    flatten(p.heading, p.n);
  }
  before.copy(p.n);
  move(f, dt, want > 0 ? dir : p.heading, ctl.north);
  const moved = arc(before, p.n);
  if (ctl.target && want > 0.6 && moved < want * dt * 0.25) {
    stuck.t += dt;
    if (stuck.t > 0.6) ctl.target = null;
  } else {
    stuck.t = 0;
  }
  return lean;
}

function stepKeeper(f: Extract<Folk, { kind: "keeper" }>, dt: number) {
  const close = arc(f.n, ctl.player.n) < 3.2;
  toward(f.n, close ? ctl.player.n : v.copy(f.n).add(f.rest), dir);
  const turn = Math.atan2(v.crossVectors(f.heading, dir).dot(f.n), f.heading.dot(dir));
  f.heading.lerp(dir, Math.min(1, dt * 5));
  flatten(f.heading, f.n);
  return turn * 0.3;
}

/** Writes the surface frame to `base` and the torso bone (bob, waddle, lean, squash, hop) to `torso`. */
function pose(f: Folk, i: number): number {
  frameAt(f.n, f.heading, base, 0, SCALE);
  const step = Math.sin(f.phase);
  const bob = Math.abs(Math.cos(f.phase)) * 0.05 * f.amp;
  let hop = f.hop < HOP ? Math.sin((Math.PI * f.hop) / HOP) * 0.45 : 0;
  const cel = ctl.celebrate;
  if (cel.active) {
    const t = cel.t - (i % 12) * 0.05;
    if (t > 0 && t < 1.2) hop = Math.max(hop, Math.abs(Math.sin((Math.PI * t) / 0.6)) * 0.55);
  }
  const roll = step * 0.13 * f.amp - f.lean * 0.12;
  const pitch = 0.1 * f.amp;
  const sq = Math.max(-0.25, Math.min(0.25, f.sq));
  local.compose(v.set(0, bob + hop, 0), rotXZ(pitch, roll), s.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5));
  torso.multiplyMatrices(base, local);
  return step;
}

const SHOULDER = 0.18;
const HI_POP: Keyframe[] = [
  { opacity: 0, transform: "translateY(6px) scale(0.6)" },
  { opacity: 1, transform: "translateY(-4px) scale(1.1)", offset: 0.2 },
  { opacity: 1, transform: "translateY(-10px) scale(1)", offset: 0.75 },
  { opacity: 0, transform: "translateY(-16px) scale(0.9)" },
];
const HI_TIMING: KeyframeAnimationOptions = { duration: 1100, easing: "ease-out" };

interface Meshes {
  head: InstancedMesh | null;
  face: InstancedMesh | null;
  body: InstancedMesh | null;
  nub: InstancedMesh | null;
  pip: InstancedMesh | null;
  blob: InstancedMesh | null;
  beanie: InstancedMesh | null;
  cap: InstancedMesh | null;
  ears: InstancedMesh | null;
}

interface CrowdProps {
  met: ReadonlySet<number>;
  near: StationId | null;
  onOpen: (id: StationId) => void;
}

/** Every character, the player included, in nine instanced draw calls and one frame loop. */
const meshes: Meshes = {
  head: null,
  face: null,
  body: null,
  nub: null,
  pip: null,
  blob: null,
  beanie: null,
  cap: null,
  ears: null,
};
/** Stable ref callbacks, so React doesn't detach and reattach each mesh on every render. */
const bind = Object.fromEntries(
  (Object.keys(meshes) as (keyof Meshes)[]).map((k) => [
    k,
    (mesh: InstancedMesh | null) => {
      meshes[k] = mesh;
    },
  ]),
) as Record<keyof Meshes, (mesh: InstancedMesh | null) => void>;

const LAYERS: [keyof Meshes, BufferGeometry, Material, number][] = [
  ["head", PARTS.head, CLAY, N],
  ["face", PARTS.face, CLAY, N],
  ["body", PARTS.body, CLAY, N],
  ["nub", PARTS.nub, CLAY, N * 4],
  ["pip", PARTS.pip, pipMat, N],
  ["blob", PARTS.blob, blobMat, N],
  ...HATS.map((h): [Hat, BufferGeometry, Material, number] => [h, PARTS[h], CLAY, hatSlots[h].length]),
];

export function Crowd({ met, near, onOpen }: CrowdProps) {
  const halo = useRef<Mesh>(null);
  const hiGroup = useRef<Group>(null);
  const hiEl = useRef<HTMLDivElement>(null);
  const hiFolk = useRef<Folk | null>(null);
  const metRef = useRef(met);
  const stuck = useMemo(() => ({ t: 0 }), []);

  useEffect(() => {
    metRef.current = met;
  }, [met]);

  useEffect(() => {
    const { head, face, body, nub, pip } = meshes;
    folk.forEach((f, i) => {
      head?.setColorAt(i, SKIN);
      face?.setColorAt(i, SKIN);
      body?.setColorAt(i, f.shirt);
      nub?.setColorAt(i * 4, f.foot);
      nub?.setColorAt(i * 4 + 1, f.foot);
      nub?.setColorAt(i * 4 + 2, f.shirt);
      nub?.setColorAt(i * 4 + 3, f.shirt);
      pip?.setColorAt(i, SKIN);
    });
    for (const h of HATS) hatSlots[h].forEach((f, j) => meshes[h]?.setColorAt(j, f.hatColor));
    for (const mesh of Object.values(meshes)) if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const { head, face, body, nub, pip, blob, beanie, cap, ears } = meshes;
    if (!head || !face || !body || !nub || !pip || !blob || !beanie || !cap || !ears) return;
    slot.beanie = slot.cap = slot.ears = 0;
    const met = metRef.current;

    for (let i = 0; i < N; i++) {
      const f = folk[i];
      let turn = 0;
      if (f.kind === "player") turn = stepPlayer(f, dt, stuck);
      else if (f.kind === "keeper") turn = stepKeeper(f, dt);
      else {
        stepVillager(f, folk, dt, Math.random);
        turn = f.turn;
        if (!ctl.frozen && arc(f.n, ctl.player.n) < GREET && !met.has(f.id) && !ctl.greeted.includes(f.id)) {
          ctl.greeted.push(f.id);
          f.hop = 0;
          hiFolk.current = f;
          hiEl.current?.animate(HI_POP, HI_TIMING);
        }
      }
      animate(f, dt, turn);
      const step = pose(f, i);

      head.setMatrixAt(i, torso);
      face.setMatrixAt(i, torso);
      body.setMatrixAt(i, torso);
      if (f.hat === "beanie") beanie.setMatrixAt(slot.beanie++, torso);
      else if (f.hat === "cap") cap.setMatrixAt(slot.cap++, torso);
      else if (f.hat === "ears") ears.setMatrixAt(slot.ears++, torso);
      const known = f.kind === "villager" && (met.has(f.id) || ctl.greeted.includes(f.id));
      pip.setMatrixAt(i, known ? torso : ZERO);

      for (let k = 0; k < 2; k++) {
        const side = k ? 1 : -1;
        const swing = step * side * f.amp;
        // feet hang off the ground frame, not the torso, so the waddle never lifts them through the floor
        local.compose(
          v.set(side * 0.1, 0.06 + Math.max(0, swing) * 0.06, 0.03 + swing * 0.1),
          q.identity(),
          s.set(0.09, 0.065, 0.125),
        );
        nub.setMatrixAt(i * 4 + k, local.premultiply(base));
        local.compose(v.set(side * SHOULDER, 0.42, 0), rotXZ(-swing * 0.6, side * 0.55), ONE);
        hang.compose(v.set(0, -0.09, 0), q.identity(), s.set(0.065, 0.12, 0.07));
        nub.setMatrixAt(i * 4 + 2 + k, local.multiply(hang).premultiply(torso));
      }
      local.compose(v.set(0, 0.02, 0), q.identity(), s.set(1.15, 1, 1.15));
      blob.setMatrixAt(i, local.premultiply(base));
      if (f.kind === "player" && halo.current) frameAt(f.n, f.heading, halo.current.matrix, 0.04);
    }

    const hi = hiFolk.current;
    if (hi && hiGroup.current) hiGroup.current.position.copy(hi.n).multiplyScalar(R + 1.05);

    head.instanceMatrix.needsUpdate = true;
    face.instanceMatrix.needsUpdate = true;
    body.instanceMatrix.needsUpdate = true;
    nub.instanceMatrix.needsUpdate = true;
    pip.instanceMatrix.needsUpdate = true;
    blob.instanceMatrix.needsUpdate = true;
    beanie.instanceMatrix.needsUpdate = true;
    cap.instanceMatrix.needsUpdate = true;
    ears.instanceMatrix.needsUpdate = true;
  });

  const keeperHead = near && LANDMARKS[near].keeper.clone().multiplyScalar(R + 1.15);

  return (
    <>
      {LAYERS.map(([k, geo, mat, count]) => (
        <instancedMesh
          key={k}
          ref={bind[k]}
          args={[geo, mat, count]}
          frustumCulled={false}
          renderOrder={k === "blob" ? 1 : 0}
        />
      ))}
      <mesh ref={halo} geometry={haloGeo} material={haloMat} matrixAutoUpdate={false} renderOrder={2} />
      <group ref={hiGroup}>
        <Html center zIndexRange={[12, 0]} style={{ pointerEvents: "none" }}>
          <div
            ref={hiEl}
            className="rounded-full bg-hq-accent px-2 py-0.5 text-[11px] font-semibold text-white opacity-0"
          >
            hi!
          </div>
        </Html>
      </group>
      {keeperHead && (
        <Html key={near} position={keeperHead} center zIndexRange={[14, 0]}>
          <button
            type="button"
            onClick={() => onOpen(near)}
            className="hq-bubble relative w-max max-w-[220px] rounded-2xl border border-hq-line bg-white px-3 py-2 text-left text-[12px] leading-snug text-hq-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] max-sm:max-w-[180px] max-sm:text-[11px]"
          >
            {STATION_BY_ID[near].line}{" "}
            <span className="font-semibold text-hq-accent pointer-coarse:hidden">Press E</span>
            <span className="hidden font-semibold text-hq-accent pointer-coarse:inline">Tap to open</span>
          </button>
        </Html>
      )}
    </>
  );
}
