import type { WebGLRenderer } from "three";

/** Static casters only: render the shadow map once now and again when a caster changes. */
export function bakeShadows(gl: WebGLRenderer) {
  gl.shadowMap.autoUpdate = false;
  gl.shadowMap.needsUpdate = true;
}
