import { BoxGeometry, CylinderGeometry, MeshStandardMaterial } from "three";

const boxGeo = new BoxGeometry(1, 1, 1);
const cylGeo = new CylinderGeometry(1, 1, 1, 20);
const materials = new Map<string, MeshStandardMaterial>();

export function material(color: string, emissive?: string, intensity = 0.9, opacity = 1) {
  const key = `${color}|${emissive}|${intensity}|${opacity}`;
  let m = materials.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.05,
      emissive: emissive ?? "#000000",
      emissiveIntensity: emissive ? intensity : 0,
      transparent: opacity < 1,
      opacity,
    });
    materials.set(key, m);
  }
  return m;
}

type Vec = [number, number, number];

interface PrimitiveProps {
  /** x, base y, z: primitives sit on their base so furniture stacks by adding heights */
  p: Vec;
  s: Vec;
  c: string;
  e?: string;
  ei?: number;
  opacity?: number;
  rot?: number;
  shadow?: boolean;
}

export function Box({ p, s, c, e, ei, opacity, rot = 0, shadow = true }: PrimitiveProps) {
  return (
    <mesh
      geometry={boxGeo}
      material={material(c, e, ei, opacity)}
      position={[p[0], p[1] + s[1] / 2, p[2]]}
      scale={s}
      rotation-y={rot}
      castShadow={shadow}
      receiveShadow
    />
  );
}

/** s = [radius, height, radius] */
export function Cyl({ p, s, c, e, ei, opacity, rot = 0, shadow = true }: PrimitiveProps) {
  return (
    <mesh
      geometry={cylGeo}
      material={material(c, e, ei, opacity)}
      position={[p[0], p[1] + s[1] / 2, p[2]]}
      scale={s}
      rotation-y={rot}
      castShadow={shadow}
      receiveShadow
    />
  );
}

export const COLORS = {
  wood: "#8b5a3c",
  darkWood: "#5a3a27",
  metal: "#3a3f4a",
  screen: "#7fd4ff",
  plant: "#3f8f5a",
  pot: "#c0763c",
  gold: "#ffcc33",
} as const;

export function Monitor({
  p,
  rot = 0,
  color = COLORS.screen,
  lit = false,
}: {
  p: Vec;
  rot?: number;
  color?: string;
  lit?: boolean;
}) {
  return (
    <group position={p} rotation-y={rot}>
      <Box p={[0, 0, 0]} s={[0.3, 0.04, 0.2]} c="#22252b" />
      <Box p={[0, 0.04, 0]} s={[0.06, 0.18, 0.06]} c="#22252b" />
      <Box p={[0, 0.2, 0]} s={[0.62, 0.38, 0.05]} c="#1c1f25" />
      <Box p={[0, 0.22, 0.03]} s={[0.54, 0.3, 0.02]} c={color} e={color} ei={lit ? 1.5 : 0.8} shadow={false} />
    </group>
  );
}

export function Chair({ p, rot = 0, color = "#2e3340" }: { p: Vec; rot?: number; color?: string }) {
  return (
    <group position={p} rotation-y={rot}>
      <Cyl p={[0, 0, 0]} s={[0.04, 0.3, 0.04]} c="#1c1f25" />
      <Box p={[0, 0.3, 0]} s={[0.46, 0.08, 0.46]} c={color} />
      <Box p={[0, 0.38, -0.2]} s={[0.46, 0.5, 0.07]} c={color} />
    </group>
  );
}

export function Plant({ p, tall = 1 }: { p: Vec; tall?: number }) {
  return (
    <group position={p}>
      <Cyl p={[0, 0, 0]} s={[0.24, 0.32, 0.24]} c={COLORS.pot} />
      <Box p={[0, 0.32, 0]} s={[0.1, 0.5 * tall, 0.1]} c="#2d6b43" />
      <Box p={[0, 0.5 * tall + 0.2, 0]} s={[0.5, 0.4, 0.5]} c={COLORS.plant} rot={0.4} />
      <Box p={[0, 0.5 * tall + 0.5, 0]} s={[0.32, 0.3, 0.32]} c="#4aa56b" rot={0.9} />
    </group>
  );
}
