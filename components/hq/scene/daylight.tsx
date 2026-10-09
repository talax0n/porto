import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DirectionalLight, type HemisphereLight } from "three";
import { newLook, skyNow } from "./sky";

/** The key light is parked by `CameraRig` so it rides with the camera; this only sets its colour. */
export const keyLight = new DirectionalLight("#fff3e2", 2.1);
const look = newLook();

/** Lights the planet for the hour in Jakarta. */
export function Daylight() {
  const hemi = useRef<HemisphereLight>(null);

  useFrame(() => {
    skyNow(look);
    const h = hemi.current;
    if (h) {
      h.color.setHex(look.hemiSky);
      h.groundColor.setHex(look.hemiGround);
      h.intensity = look.hemi;
    }
    keyLight.color.setHex(look.key);
    keyLight.intensity = look.keyI;
  });

  return <hemisphereLight ref={hemi} args={["#eaf2ff", "#f3e3c8", 1.1]} />;
}
