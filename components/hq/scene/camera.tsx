import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { DirectionalLight, type Object3D, type PerspectiveCamera, Raycaster, Sphere, Vector2, Vector3 } from "three";
import { STATIONS, type StationId } from "@/data/stations";
import { ctl, setTarget } from "../game";
import { LANDMARKS, R, flatten } from "./planet";

/** Tilt of the view away from straight down; the horizon curves in near the top of the screen. */
const PITCH = 1.0;
const DIST = 18;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 1.6;
const INSPECT = 0.85;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const aim = ctl.player.n.clone();
const desired = new Vector3();
const north = ctl.north.clone();
const side = new Vector3();
const lookAt = new Vector3();
const view = { x: 0, y: 0, dist: DIST };
/** close-up on the hovering player, eye level and front-on, so only white sky sits behind it */
const CLOSE_BACK = 5.2;
/** how far into the intro close-up the camera is; negative until the first frame picks a side */
let close = -1;
const closePos = new Vector3();
const closeAt = new Vector3();
const reduced = typeof window === "undefined" ? null : window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Messenger-style follow cam: it hovers behind the player along the carried `ctl.north`, so the
 * planet turns underneath. The light rides with it, which is why nothing bakes a shadow map.
 */
export function CameraRig() {
  const gl = useThree((s) => s.gl);
  const light = useMemo(() => new DirectionalLight("#fff3e2", 2.1), []);

  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      ctl.zoomMul = clamp(ctl.zoomMul * Math.exp(-e.deltaY * 0.0012), MIN_ZOOM, MAX_ZOOM);
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl]);

  useFrame(({ size, camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const k = 1 - Math.exp(-dt * 4);
    const narrow = size.width < 640;
    const cam = camera as PerspectiveCamera;

    let dist = DIST / ctl.zoomMul;
    let ox = 0;
    let oy = 0;
    if (ctl.focus) {
      const { n, door } = LANDMARKS[ctl.focus];
      // between the landmark and its door, so the diorama and the keeper both fit
      desired.copy(n).lerp(door, 0.35).normalize();
      dist = Math.min(dist, DIST) * (narrow ? 1.25 : INSPECT);
      // shift the projection so the station sits in the space beside the panel
      if (narrow) oy = size.height * 0.25;
      else ox = Math.min(460, size.width * 0.42) / 2 + 12;
    } else {
      desired.copy(ctl.player.n);
    }
    if (narrow) dist *= 1.05;

    aim.lerp(desired, k).normalize();
    // ease toward the carried north; a half-turn needs a sideways nudge or the lerp never leaves home
    if (north.dot(ctl.north) < -0.5) north.addScaledVector(side.crossVectors(aim, north), 0.3);
    north.lerp(ctl.north, k * 0.8);
    if (flatten(north, aim).lengthSq() === 0) north.copy(ctl.north);
    view.dist += (dist - view.dist) * k;

    const want = ctl.intro === "hover" ? 1 : 0;
    close = close < 0 || reduced?.matches ? want : close + (want - close) * k;
    const c = close * close * (3 - 2 * close);

    lookAt.copy(aim).multiplyScalar(R + 0.5);
    camera.position
      .copy(lookAt)
      .addScaledVector(aim, view.dist * Math.cos(PITCH))
      .addScaledVector(north, -view.dist * Math.sin(PITCH));
    camera.up.copy(aim);
    if (c > 0) {
      const p = ctl.player.n;
      closeAt.copy(p).multiplyScalar(R + ctl.alt + 0.45);
      // phones are tall and narrow, so back off further to keep the character and the bubble in frame
      const back = narrow ? 1.45 : 1;
      closePos.copy(closeAt).addScaledVector(north, -CLOSE_BACK * back);
      camera.position.lerp(closePos, c);
      lookAt.lerp(closeAt, c);
      camera.up.lerp(p, c).normalize();
      // the bubble needs room beside the character on wide screens and below it on phones
      if (narrow) oy += (size.height * 0.1 - oy) * c;
      else ox += (Math.min(220, size.width * 0.14) - ox) * c;
    }
    camera.lookAt(lookAt);
    view.x += (ox - view.x) * k;
    view.y += (oy - view.y) * k;
    cam.setViewOffset(size.width, size.height, view.x, view.y, size.width, size.height);

    // key light over the camera's left shoulder, wherever on the planet that is
    light.position.copy(camera.position).addScaledVector(aim, 8).addScaledVector(side.crossVectors(north, aim), -6);
    light.target.position.copy(lookAt);
    light.target.updateMatrixWorld();
  });
  return <primitive object={light} />;
}

const ray = new Raycaster();
const ndc = new Vector2();
const planet = new Sphere(new Vector3(), R);
const hit = new Vector3();

function nearestStation(p: Vector3): StationId {
  let best = STATIONS[0].id;
  let max = -Infinity;
  for (const s of STATIONS) {
    const d = p.dot(LANDMARKS[s.id].n);
    if (d > max) [max, best] = [d, s.id];
  }
  return best;
}

/** One pointer handler: a landmark first, otherwise the clicked point on the planet. */
export function ClickToMove({ onTravel }: { onTravel: (id: StationId) => void }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const el = gl.domElement;
    let down: [number, number] | null = null;
    const onDown = (e: PointerEvent) => {
      down = [e.clientX, e.clientY];
    };
    const onUp = (e: PointerEvent) => {
      if (!down || ctl.frozen || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return;
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const tagged: Object3D[] = [];
      scene.traverse((o) => {
        if (o.userData.landmark) tagged.push(o);
      });
      const ground = ray.ray.intersectSphere(planet, hit) ? ray.ray.origin.distanceTo(hit) : Infinity;
      const first = ray.intersectObjects(tagged, false)[0];
      if (first && first.distance < ground + 0.5) return onTravel(nearestStation(first.point.normalize()));
      if (ground < Infinity) setTarget(hit, null);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [gl, camera, scene, onTravel]);
  return null;
}
