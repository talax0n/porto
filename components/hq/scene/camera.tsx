import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Raycaster, Plane, Vector2, Vector3, type Object3D } from "three";
import { STATION_BY_ID, type StationId } from "@/data/stations";
import { ctl, setTarget } from "../game";
import { WORLD } from "./layout";

const OFFSET = new Vector3(14, 14, 14);
const GROUND_FORESHORTEN = Math.sqrt(1 / 3);
const RIGHT = new Vector3(1, 0, -1).normalize();
const DOWN = new Vector3(1, 0, 1).normalize();
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const INSPECT_ZOOM = 1.55;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const aim = new Vector3(ctl.player.x, 0, ctl.player.z);
const desired = new Vector3();

export function CameraRig() {
  const gl = useThree((s) => s.gl);

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
    const narrow = size.width < 768;
    // the whole archipelago fits on a phone; wider screens frame it closer and follow the marble
    const fit = narrow ? 30 : 22;
    const baseZoom = clamp(Math.min(size.width / fit, size.height / (fit * 0.68)), 10, 70);

    let zoom = baseZoom * ctl.zoomMul;
    if (ctl.focus) {
      const [sx, sz] = STATION_BY_ID[ctl.focus].position;
      zoom = Math.max(zoom, baseZoom) * INSPECT_ZOOM;
      desired.set(sx, 0, sz);
      // keep the station visible beside the HUD panel
      if (narrow) desired.addScaledVector(DOWN, (size.height * 0.2) / (zoom * GROUND_FORESHORTEN));
      else desired.addScaledVector(RIGHT, Math.min(260, size.width * 0.17) / zoom);
    } else if (narrow) {
      // the whole room fits a phone screen only when framed from its center
      desired.set(0, 0, 0);
    } else {
      desired.set(ctl.player.x, 0, ctl.player.z);
    }
    desired.x = clamp(desired.x, -8, 8);
    desired.z = clamp(desired.z, -6, 6);

    aim.lerp(desired, k);
    camera.position.copy(aim).add(OFFSET);
    camera.lookAt(aim);
    if (Math.abs(camera.zoom - zoom) > 0.01) {
      camera.zoom += (zoom - camera.zoom) * k;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

const ray = new Raycaster();
const ndc = new Vector2();
const ground = new Plane(new Vector3(0, 1, 0), 0);
const hit = new Vector3();

function stationOf(o: Object3D | null): StationId | null {
  for (let n = o; n; n = n.parent) {
    if (n.userData.stationId) return n.userData.stationId as StationId;
  }
  return null;
}

/** One pointer handler: station furniture first, otherwise the floor point. */
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
        if (o.userData.stationId) tagged.push(o);
      });
      const id = stationOf(ray.intersectObjects(tagged, true)[0]?.object ?? null);
      if (id) return onTravel(id);
      if (ray.ray.intersectPlane(ground, hit)) {
        setTarget(
          clamp(hit.x, -WORLD.halfX + 0.5, WORLD.halfX - 0.5),
          clamp(hit.z, -WORLD.halfZ + 0.5, WORLD.halfZ - 0.5),
          null,
        );
      }
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
