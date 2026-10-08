import { Box, COLORS, Chair, Cyl, Plant } from "./primitives";
import { COFFEE_TABLE, LAMP, MEETING_TABLE, PING_PONG, PLANTS, SOFA } from "./layout";

function Sofa() {
  const { x, z } = SOFA;
  const c = "#3d4a6b";
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.1, 0]} s={[3, 0.35, 1.1]} c={c} />
      <Box p={[0, 0.45, 0.4]} s={[3, 0.55, 0.3]} c="#34405d" />
      <Box p={[-1.4, 0.45, 0]} s={[0.2, 0.3, 0.9]} c="#34405d" />
      <Box p={[1.4, 0.45, 0]} s={[0.2, 0.3, 0.9]} c="#34405d" />
      <Box p={[-0.7, 0.45, -0.05]} s={[0.55, 0.4, 0.15]} c="#d9643a" rot={0.2} />
      <Box p={[0.9, 0.45, -0.05]} s={[0.5, 0.35, 0.15]} c="#e8b04a" rot={-0.25} />
    </group>
  );
}

function Lounge() {
  const { x, z } = COFFEE_TABLE;
  return (
    <group>
      <Cyl p={[x, 0.01, z]} s={[2.1, 0.02, 2.1]} c="#c9805a" shadow={false} />
      <Box p={[x, 0.3, z]} s={[1.4, 0.06, 0.8]} c={COLORS.darkWood} />
      <Box p={[x - 0.55, 0, z - 0.3]} s={[0.08, 0.3, 0.08]} c="#222" />
      <Box p={[x + 0.55, 0, z + 0.3]} s={[0.08, 0.3, 0.08]} c="#222" />
      <Box p={[x - 0.55, 0, z + 0.3]} s={[0.08, 0.3, 0.08]} c="#222" />
      <Box p={[x + 0.55, 0, z - 0.3]} s={[0.08, 0.3, 0.08]} c="#222" />
      <Cyl p={[x + 0.2, 0.36, z]} s={[0.07, 0.1, 0.07]} c="#f3e6d0" />
      <Sofa />
      {/* armchair */}
      <group position={[4.2, 0, 3.6]} rotation-y={-0.9}>
        <Box p={[0, 0, 0]} s={[0.9, 0.4, 0.9]} c="#d9643a" />
        <Box p={[0, 0.4, -0.38]} s={[0.9, 0.5, 0.15]} c="#c4552d" />
      </group>
    </group>
  );
}

function PingPong() {
  const { x, z } = PING_PONG;
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.72, 0]} s={[2.7, 0.06, 1.5]} c="#1f7a5c" />
      <Box p={[0, 0.78, 0]} s={[2.7, 0.005, 0.03]} c="#e9efe9" shadow={false} />
      <Box p={[0, 0.78, 0]} s={[0.03, 0.01, 1.5]} c="#e9efe9" shadow={false} />
      <Box p={[0, 0.78, 0]} s={[0.03, 0.18, 1.55]} c="#dfe6e9" />
      {[-1.2, 1.2].flatMap((dx) =>
        [-0.6, 0.6].map((dz) => (
          <Box key={`${dx}${dz}`} p={[dx, 0, dz]} s={[0.08, 0.72, 0.08]} c="#2b2f38" />
        )),
      )}
      <Cyl p={[0.5, 0.78, 0.2]} s={[0.025, 0.03, 0.025]} c="#fff6e0" />
    </group>
  );
}

function Lamp() {
  return (
    <group position={[LAMP.x, 0, LAMP.z]}>
      <Cyl p={[0, 0, 0]} s={[0.18, 0.06, 0.18]} c="#3a3f4a" />
      <Cyl p={[0, 0.06, 0]} s={[0.03, 1.5, 0.03]} c="#3a3f4a" />
      <Cyl p={[0, 1.4, 0]} s={[0.22, 0.28, 0.22]} c="#ffe2a0" e="#ffcf70" ei={1.2} />
      <pointLight position={[0, 1.4, 0]} intensity={4} distance={6} color="#ffcf70" />
    </group>
  );
}

function MeetingRug() {
  const { x, z } = MEETING_TABLE;
  return <Cyl p={[x, 0.01, z]} s={[2.5, 0.02, 2.5]} c="#9aa6b8" shadow={false} />;
}

function Bookcase() {
  return (
    <group position={[-9.55, 0, 6.6]} rotation-y={Math.PI / 2}>
      <Box p={[0, 0, 0]} s={[0.8, 1.5, 0.3]} c={COLORS.darkWood} />
      {[0.5, 1.0].map((y) => (
        <Box key={y} p={[0, y, 0.01]} s={[0.7, 0.18, 0.3]} c="#d9643a" />
      ))}
    </group>
  );
}

export function Decor() {
  return (
    <group>
      <MeetingRug />
      <Lounge />
      <PingPong />
      <Lamp />
      <Bookcase />
      {PLANTS.map((p, i) => (
        <Plant key={i} p={[p.x, 0, p.z]} tall={i % 2 ? 1.4 : 1} />
      ))}
      {/* a couple of loose chairs by the ping-pong table */}
      <Chair p={[-0.2, 0, 3.1]} rot={0.4} color="#6b7a99" />
    </group>
  );
}
