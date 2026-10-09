import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Hud, OrthographicCamera, useFBO } from "@react-three/drei";
import { Color, type Mesh, OrthographicCamera as Ortho } from "three";
import { ctl } from "../game";
import { MINIMAP_VIEW, R } from "./planet";
import { newLook, skyNow } from "./sky";

/** Markers, arrows and confetti live on this layer, which only the main camera renders. */
export const OVERLAY = 1;
const SIZE = 256;
/** the planet below is redrawn every this many frames; the disc showing it costs one draw call */
const EVERY = 4;
const look = newLook();
const clear = new Color();

/**
 * The live minimap: the scene seen straight down over the player, camera-forward up, rendered
 * into a small target and shown as a disc exactly under the DOM minimap button.
 */
export function MinimapView() {
  const camera = useThree((s) => s.camera);
  const fbo = useFBO(SIZE, SIZE, { samples: 4 });
  const eye = useMemo(() => new Ortho(-MINIMAP_VIEW, MINIMAP_VIEW, MINIMAP_VIEW, -MINIMAP_VIEW, 1, R * 3), []);
  const disc = useRef<Mesh>(null);
  const frame = useRef(0);

  useEffect(() => {
    camera.layers.enable(OVERLAY);
  }, [camera]);

  useFrame(({ gl, scene, size }) => {
    const d = disc.current;
    const el = ctl.minimap;
    if (!d) return;
    d.visible = !!el;
    if (!el) {
      frame.current = 0;
      return;
    }
    if (frame.current++ % EVERY) return;
    const r = el.getBoundingClientRect();
    const c = gl.domElement.getBoundingClientRect();
    d.position.set(r.left - c.left + r.width / 2 - size.width / 2, size.height / 2 - (r.top - c.top + r.height / 2), 0);
    // inside the button's 1px border
    d.scale.setScalar(r.width / 2 - 1);
    eye.position.copy(ctl.player.n).multiplyScalar(R * 2);
    eye.up.copy(ctl.north);
    eye.lookAt(0, 0, 0);
    eye.updateMatrixWorld();
    // the canvas is transparent over the DOM sky, so the target needs a backdrop of its own
    const alpha = gl.getClearAlpha();
    gl.getClearColor(clear);
    gl.setClearColor(skyNow(look).bottom, 1);
    gl.setRenderTarget(fbo);
    gl.render(scene, eye);
    gl.setRenderTarget(null);
    gl.setClearColor(clear, alpha);
  });

  return (
    <Hud>
      <OrthographicCamera makeDefault position={[0, 0, 10]} />
      <mesh ref={disc} visible={false}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial map={fbo.texture} toneMapped={false} />
      </mesh>
    </Hud>
  );
}
