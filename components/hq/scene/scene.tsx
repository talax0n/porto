"use client";

import { Canvas } from "@react-three/fiber";
import type { StationId } from "@/data/stations";
import type { GameState } from "../game";
import { CameraRig, ClickToMove } from "./camera";

interface SceneProps {
  state: GameState;
  onTravel: (id: StationId) => void;
  onActivate: (id: StationId) => void;
}

export default function Scene({ onTravel }: SceneProps) {
  return (
    <Canvas
      orthographic
      dpr={[1, 1.5]}
      camera={{ position: [14, 14, 14], zoom: 55, near: 0.1, far: 120 }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
    >
      <color attach="background" args={["#f3f2ef"]} />
      <CameraRig />
      <ClickToMove onTravel={onTravel} />
    </Canvas>
  );
}
