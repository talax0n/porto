"use client";

import { Canvas } from "@react-three/fiber";
import type { StationId } from "@/data/stations";
import type { GameState } from "../game";
import { Avatar } from "./avatar";
import { CameraRig, ClickToMove } from "./camera";
import { Decor } from "./decor";
import { Room } from "./room";
import { StationNodes } from "./stations";

interface SceneProps {
  state: GameState;
  onTravel: (id: StationId) => void;
  onActivate: (id: StationId) => void;
}

export default function Scene({ state, onTravel, onActivate }: SceneProps) {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [14, 14, 14], zoom: 55, near: 0.1, far: 120 }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
    >
      <color attach="background" args={["#1a110b"]} />
      <hemisphereLight args={["#fff1db", "#6b4a32", 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[9, 16, 7]}
        intensity={2.2}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
      />
      <Room />
      <Decor />
      <StationNodes
        near={state.mode === "exploring" ? state.near : null}
        inspecting={state.mode === "inspecting" ? state.station : null}
        visited={state.visited}
        onActivate={onActivate}
      />
      <Avatar />
      <CameraRig />
      <ClickToMove onTravel={onTravel} />
    </Canvas>
  );
}
