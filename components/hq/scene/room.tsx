import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { Box, COLORS } from "./primitives";
import { ROOM } from "./layout";

const WALL = "#8d9199";
const WALL_TOP = "#b9bcc4";
const T = 0.4;

function useFloorTexture() {
  return useMemo(() => {
    const ppu = 64;
    const c = document.createElement("canvas");
    c.width = ROOM.halfX * 2 * ppu;
    c.height = ROOM.halfZ * 2 * ppu;
    const g = c.getContext("2d")!;
    const strip = ppu / 2;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < c.height; y += strip) {
      let x = -rnd() * 200;
      while (x < c.width) {
        const w = 160 + rnd() * 260;
        const l = 78 + rnd() * 4;
        g.fillStyle = `hsl(36 52% ${l}%)`;
        g.fillRect(x, y, w, strip);
        g.fillStyle = "rgba(90,60,30,0.28)";
        g.fillRect(x, y, 2, strip);
        x += w;
      }
      g.fillStyle = "rgba(90,60,30,0.28)";
      g.fillRect(0, y, c.width, 2);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }, []);
}

export function Room() {
  const floor = useFloorTexture();
  const { halfX: hx, halfZ: hz, wallH: h, rimH } = ROOM;
  const doorZ = [5.8, 6.8] as const;
  const westA = doorZ[0] + hz;
  const westB = hz - doorZ[1];

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[hx * 2, hz * 2]} />
        <meshStandardMaterial map={floor} roughness={0.9} />
      </mesh>
      <Box p={[0, -0.5, 0]} s={[hx * 2 + 1.2, 0.45, hz * 2 + 1.2]} c="#2a1c12" />

      {/* north wall (z-) */}
      <Box p={[0, 0, -hz - T / 2]} s={[hx * 2 + T * 2, h, T]} c={WALL} />
      <Box p={[0, h, -hz - T / 2]} s={[hx * 2 + T * 2, 0.1, T + 0.1]} c={WALL_TOP} />
      {/* west wall (x-) with door gap */}
      <Box p={[-hx - T / 2, 0, (-hz + doorZ[0]) / 2]} s={[T, h, westA]} c={WALL} />
      <Box p={[-hx - T / 2, 0, (doorZ[1] + hz) / 2]} s={[T, h, westB]} c={WALL} />
      <Box p={[-hx - T / 2, 2.1, (doorZ[0] + doorZ[1]) / 2]} s={[T, h - 2.1, doorZ[1] - doorZ[0]]} c={WALL} />
      <Box p={[-hx - T / 2, h, 0]} s={[T + 0.1, 0.1, hz * 2]} c={WALL_TOP} />
      {/* door frame + leaf */}
      <Box p={[-hx + 0.05, 0, doorZ[0]]} s={[0.12, 2.1, 0.1]} c={COLORS.darkWood} />
      <Box p={[-hx + 0.05, 0, doorZ[1]]} s={[0.12, 2.1, 0.1]} c={COLORS.darkWood} />
      <Box p={[-hx + 0.05, 0, (doorZ[0] + doorZ[1]) / 2]} s={[0.08, 2.0, 0.9]} c="#6d4630" />

      {/* camera-facing sides stay low so the interior reads */}
      <Box p={[hx + T / 2, 0, 0]} s={[T, rimH, hz * 2 + T * 2]} c={WALL} />
      <Box p={[0, 0, hz + T / 2]} s={[hx * 2 + T * 2, rimH, T]} c={WALL} />
      <Box p={[hx + T / 2, rimH, 0]} s={[T + 0.05, 0.06, hz * 2 + T * 2]} c={WALL_TOP} />
      <Box p={[0, rimH, hz + T / 2]} s={[hx * 2 + T * 2, 0.06, T + 0.05]} c={WALL_TOP} />

      {/* wall art */}
      <Box p={[-1.8, 1.4, -hz + 0.04]} s={[0.9, 0.6, 0.06]} c="#2b2f38" />
      <Box p={[-1.8, 1.45, -hz + 0.08]} s={[0.78, 0.46, 0.04]} c="#5fa8a0" />
      <Box p={[3.4, 1.5, -hz + 0.04]} s={[0.7, 0.9, 0.06]} c="#2b2f38" />
      <Box p={[3.4, 1.55, -hz + 0.08]} s={[0.58, 0.76, 0.04]} c="#d98d52" />
      <Box p={[-hx + 0.04, 1.4, -4.8]} s={[0.06, 0.6, 0.9]} c="#2b2f38" />
      <Box p={[-hx + 0.08, 1.45, -4.8]} s={[0.04, 0.46, 0.78]} c="#8f7bc4" />
    </group>
  );
}
