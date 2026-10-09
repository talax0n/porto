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
import { DROP_IN, HOVER, ctl } from "../game";
import { ACCENT, CLAY } from "./clay";
import {
  HATS,
  HEAD_Y,
  HOP,
  PARTS,
  RADIUS,
  PLAIN,
  SCALE,
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
const pipMat = new MeshBasicMaterial({ vertexColors: true });
const haloMat = new MeshBasicMaterial({ color: ACCENT });
const haloGeo = new TorusGeometry(0.42, 0.03, 6, 36).rotateX(Math.PI / 2);
const puffMat = new MeshBasicMaterial({ color: "#fbf6ec", transparent: true, depthWrite: false });
const puffGeo = new TorusGeometry(0.5, 0.11, 6, 28).rotateX(Math.PI / 2).scale(1, 0.55, 1);

const GRAVITY = 16;
/** the little jump off the hover spot before gravity takes over */
const LEAP = 2.6;
const PUFF = 0.55;
const STARTLE = 3.5;
const reduced = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");
/** the player's intro clocks: vertical speed, a free-running hover clock, wave and flail blends, puff age */
const drop = { vy: 0, t: 0, wave: 0, flail: 0, puff: Infinity, last: ctl.intro };

const ONE = new Vector3(1, 1, 1);
const base = new Matrix4();
const torso = new Matrix4();
const local = new Matrix4();
const hang = new Matrix4();
const q = new Quaternion();
const v = new Vector3();
const s = new Vector3();
const dir = new Vector3();
const input = new Vector3();
const camDir = new Vector3();
const right = new Vector3();
const before = new Vector3();
const eul = new Euler();
const rotXZ = (x: number, z: number) => q.setFromEuler(eul.set(x, 0, z));
const slot: Record<Hat | "pip", number> = { beanie: 0, cap: 0, ears: 0, pip: 0 };

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

/** Hover, fall and touchdown for the player; the reducer only learns about it through `ctl.intro`. */
function stepDrop(f: Folk, dt: number) {
  const still = !!reduced?.matches;
  const p = ctl.player;
  drop.t += dt;
  if (ctl.intro !== drop.last) {
    if (ctl.intro === "fall") drop.vy = ctl.alt > DROP_IN + 0.5 ? LEAP : 0;
    drop.last = ctl.intro;
  }
  if (ctl.intro === "hover") {
    ctl.alt += (HOVER - ctl.alt) * Math.min(1, dt * 3);
    // face the close-up camera behind the carried north; rotate, since a lerp from the opposite heading passes through zero
    dir.copy(ctl.north).negate();
    const off = Math.atan2(v.crossVectors(p.heading, dir).dot(p.n), p.heading.dot(dir));
    p.heading.applyAxisAngle(p.n, off * Math.min(1, dt * 6));
    flatten(p.heading, p.n);
    drop.wave += (1 - drop.wave) * Math.min(1, dt * 5);
  } else {
    drop.wave += (0 - drop.wave) * Math.min(1, dt * 8);
  }
  if (ctl.intro === "fall") {
    drop.vy -= GRAVITY * dt;
    ctl.alt += drop.vy * dt;
    if (drop.vy < 0) drop.flail = Math.min(1, drop.flail + dt * 6);
    // stretch along the fall, squash on impact
    f.sq = Math.max(-0.2, Math.min(0, drop.vy * 0.015));
    f.sqv = 0;
    if (still || ctl.alt <= 0) {
      const impact = -drop.vy;
      ctl.alt = 0;
      drop.vy = 0;
      ctl.intro = drop.last = "ground";
      if (still) return;
      f.sqv = Math.min(7, impact * 0.6);
      drop.puff = 0;
      // nearby villagers jump in surprise, the closest first
      for (const o of folk) {
        const d = arc(o.n, p.n);
        if (o.kind === "villager" && d < STARTLE) o.hop = -d * 0.05;
      }
    }
  } else {
    drop.flail += (0 - drop.flail) * Math.min(1, dt * 8);
  }
  if (drop.puff !== Infinity) drop.puff += dt;
}

/** Writes the surface frame to `base` and the torso bone (bob, waddle, lean, squash, hop) to `torso`. */
function pose(f: Folk, i: number, lift: number): number {
  frameAt(f.n, f.heading, base, lift, SCALE);
  const step = Math.sin(f.phase);
  const bob = Math.abs(Math.cos(f.phase)) * 0.05 * f.amp;
  let hop = f.hop > 0 && f.hop < HOP ? Math.sin((Math.PI * f.hop) / HOP) * 0.45 : 0;
  const cel = ctl.celebrate;
  if (cel.active) {
    const t = cel.t - (i % 12) * 0.05;
    if (t > 0 && t < 1.2) hop = Math.max(hop, Math.abs(Math.sin((Math.PI * t) / 0.6)) * 0.55);
  }
  let roll = step * 0.13 * f.amp - f.lean * 0.12;
  if (f.kind === "player" && !reduced?.matches) roll += Math.sin(drop.t * 10) * 0.06 * drop.wave;
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
  const puff = useRef<Mesh>(null);
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
      head?.setColorAt(i, f.skin);
      face?.setColorAt(i, PLAIN);
      body?.setColorAt(i, f.shirt);
      nub?.setColorAt(i * 4, f.foot);
      nub?.setColorAt(i * 4 + 1, f.foot);
      nub?.setColorAt(i * 4 + 2, f.skin);
      nub?.setColorAt(i * 4 + 3, f.skin);
      pip?.setColorAt(i, PLAIN);
    });
    for (const h of HATS) hatSlots[h].forEach((f, j) => meshes[h]?.setColorAt(j, f.hatColor));
    for (const mesh of Object.values(meshes)) if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const { head, face, body, nub, pip, blob, beanie, cap, ears } = meshes;
    if (!head || !face || !body || !nub || !pip || !blob || !beanie || !cap || !ears) return;
    slot.beanie = slot.cap = slot.ears = slot.pip = 0;
    camDir.copy(camera.position).normalize();
    const met = metRef.current;

    for (let i = 0; i < N; i++) {
      const f = folk[i];
      let turn = 0;
      let lift = 0;
      if (f.kind === "player") {
        turn = stepPlayer(f, dt, stuck);
        stepDrop(f, dt);
        lift = ctl.alt + (ctl.intro === "hover" && !reduced?.matches ? Math.sin(drop.t * 2.2) * 0.07 : 0);
      } else if (f.kind === "keeper") turn = stepKeeper(f, dt);
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
      const step = pose(f, i, lift);

      head.setMatrixAt(i, torso);
      face.setMatrixAt(i, torso);
      body.setMatrixAt(i, torso);
      if (f.hat === "beanie") beanie.setMatrixAt(slot.beanie++, torso);
      else if (f.hat === "cap") cap.setMatrixAt(slot.cap++, torso);
      else if (f.hat === "ears") ears.setMatrixAt(slot.ears++, torso);
      const known = f.kind === "villager" && (met.has(f.id) || ctl.greeted.includes(f.id));
      if (known) {
        // a pin keeps about the same size on screen, then fades out toward the horizon instead of becoming a speck
        const d = camera.position.distanceTo(v.copy(f.n).multiplyScalar(R));
        const facing = f.n.dot(camDir);
        const k = Math.min(1.3, d / 16) * Math.min(1, Math.max(0, (facing - 0.55) / 0.15));
        local.compose(v.set(0, HEAD_Y + 0.4, 0), q.identity(), s.setScalar(k));
        if (k > 0) pip.setMatrixAt(slot.pip++, local.premultiply(torso));
      }

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
        let raise = side * 0.55;
        let grow = 0;
        if (f.kind === "player") {
          // the near-side arm waves so the bubble on the other side never hides it
          const wave = k === 0 ? drop.wave : 0;
          const still = reduced?.matches;
          raise += (side * (2.4 + (still ? 0 : Math.sin(drop.t * 10) * 0.38)) - raise) * wave;
          raise += (side * (2.3 + Math.sin(drop.t * 26 + k * 2) * 0.35) - raise) * drop.flail;
          grow = Math.max(wave, drop.flail);
        }
        // a raised arm steps out from the shoulder and grows, so the hand clears the head and reads at close range
        local.compose(v.set(side * (SHOULDER + 0.06 * grow), 0.42, 0), rotXZ(-swing * 0.6, raise), ONE);
        hang.compose(
          v.set(0, -0.09 - 0.07 * grow, 0),
          q.identity(),
          s.set(0.065 + 0.02 * grow, 0.12 + 0.07 * grow, 0.07 + 0.02 * grow),
        );
        nub.setMatrixAt(i * 4 + 2 + k, local.multiply(hang).premultiply(torso));
      }
      // shadows stay on the ground and tighten as the player comes down to meet them
      if (lift) frameAt(f.n, f.heading, base, 0, SCALE);
      const shade = 1.15 * (1 - Math.min(0.45, lift * 0.13));
      local.compose(v.set(0, 0.02, 0), q.identity(), s.set(shade, 1, shade));
      blob.setMatrixAt(i, local.premultiply(base));
      if (f.kind === "player" && halo.current) {
        halo.current.visible = ctl.intro === "ground";
        frameAt(f.n, f.heading, halo.current.matrix, 0.04);
      }
      if (f.kind === "player" && puff.current) {
        const m = puff.current;
        const t = drop.puff / PUFF;
        m.visible = t < 1;
        if (m.visible) {
          const e = 1 - (1 - t) ** 3;
          frameAt(f.n, f.heading, m.matrix, 0.03, 0.5 + 1.6 * e);
          puffMat.opacity = 0.9 * (1 - t);
        }
      }
    }

    const hi = hiFolk.current;
    if (hi && hiGroup.current) hiGroup.current.position.copy(hi.n).multiplyScalar(R + 1.05);

    head.instanceMatrix.needsUpdate = true;
    face.instanceMatrix.needsUpdate = true;
    body.instanceMatrix.needsUpdate = true;
    nub.instanceMatrix.needsUpdate = true;
    // only met villagers draw a pin, so strangers cost no triangles
    pip.count = slot.pip;
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
      <mesh
        ref={puff}
        geometry={puffGeo}
        material={puffMat}
        matrixAutoUpdate={false}
        visible={false}
        frustumCulled={false}
        renderOrder={2}
      />
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
