import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
} from "three";
import { PAL } from "./clay";
import { R, flatten, frameAt } from "./planet";
import { LAMPS } from "./props";
import { newLook, skyNow } from "./sky";

const BULB_Y = 1.06;
const POOL = 1.2;
const POOL_LIFT = 0.04;
const POP = 0.3;
/** exp-smoothing rate per second: a lamp covers most of the way to its target in about 0.4s */
const EASE = 2.5;
const WARM = "#ffcf7a";
const OFF = new Color(PAL.bulb);
const ON = new Color("#fff1c4");

const look = newLook();
const reduced = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

/** Lamps the visitor has flipped; each one runs opposite to the sky. */
const flipped = LAMPS.map(() => false);
const pops = LAMPS.map(() => POP);
/** current brightness 0 … 1; negative until the first frame, which starts each lamp at its target */
const glows = LAMPS.map(() => -1);

export function toggleLamp(i: number) {
  flipped[i] = !flipped[i];
  if (!reduced?.matches) pops[i] = 0;
}

const hitGeo = new CylinderGeometry(0.35, 0.35, 1.4, 8);
const hitMat = new MeshBasicMaterial();

/** Invisible volumes around each lamp's post and head; the click handler raycasts these. */
export const lampHits = LAMPS.map((_, i) => {
  const m = new Mesh(hitGeo, hitMat);
  m.visible = false;
  m.userData.lamp = i;
  m.position.set(0, 0.7, 0);
  return m;
});

/** A flat plane bent onto the sphere, so the pool hugs the ground instead of sinking at its edge. */
function poolGeometry() {
  const g = new PlaneGeometry(POOL * 2, POOL * 2, 8, 8).rotateX(-Math.PI / 2);
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    p.setY(i, Math.sqrt(R * R - x * x - z * z) - R + POOL_LIFT);
  }
  g.computeVertexNormals();
  return g;
}

/** White so tinting by material colour works; `blobTexture` is a dark smudge. */
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

interface Rig {
  group: Group;
  bulb: Mesh;
  bulbMat: MeshBasicMaterial;
  haloMat: SpriteMaterial;
  poolMat: MeshBasicMaterial;
}

function shine(r: Rig, glow: number, day: number, bump: number) {
  r.bulb.scale.setScalar(1 + 0.4 * bump);
  // a bulb that is off still reads as glass: dim at night, like the baked clay around it
  r.bulbMat.color.copy(OFF).multiplyScalar(0.35 + 0.65 * day).lerp(ON, glow);
  r.haloMat.opacity = 0.9 * glow;
  r.poolMat.opacity = 0.55 * glow;
}

const map = glowTexture();
const bulbGeo = new SphereGeometry(0.13, 12, 8);
const pool = poolGeometry();
const frame = new Matrix4();
/** Built once at import, like the crowd's materials: a memo would rebuild them and strand `lampHits` in a discarded group. */
const rigs: Rig[] = LAMPS.map(({ n, fwd }, i) => {
  const group = new Group();
  frameAt(n, flatten(fwd.clone(), n), frame).decompose(group.position, group.quaternion, group.scale);
  const bulbMat = new MeshBasicMaterial({ toneMapped: false });
  const haloMat = new SpriteMaterial({ map, color: WARM, blending: AdditiveBlending, transparent: true, depthWrite: false });
  const poolMat = new MeshBasicMaterial({ map, color: WARM, blending: AdditiveBlending, transparent: true, depthWrite: false });
  const bulb = new Mesh(bulbGeo, bulbMat);
  bulb.position.set(0, BULB_Y, 0);
  const halo = new Sprite(haloMat);
  halo.position.set(0, BULB_Y, 0);
  halo.scale.setScalar(1.1);
  const ground = new Mesh(pool, poolMat);
  ground.renderOrder = 1;
  group.add(bulb, halo, ground, lampHits[i]);
  return { group, bulb, bulbMat, haloMat, poolMat };
});

/** A glowing bulb, halo and ground pool per lamp, faked with emissive materials rather than point lights. */
export function Lamps() {
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const k = 1 - Math.exp(-dt * EASE);
    const day = skyNow(look).day;
    for (let i = 0; i < rigs.length; i++) {
      const r = rigs[i];
      const want = flipped[i] ? day : 1 - day;
      const glow = (glows[i] = glows[i] < 0 ? want : glows[i] + (want - glows[i]) * k);
      if (pops[i] < POP) pops[i] += dt;
      const bump = pops[i] < POP ? Math.sin((Math.PI * pops[i]) / POP) : 0;
      shine(r, glow, day, bump);
    }
  });

  return (
    <>
      {rigs.map((r, i) => (
        <primitive key={i} object={r.group} />
      ))}
    </>
  );
}
