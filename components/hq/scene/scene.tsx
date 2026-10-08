"use client";

import { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import type { StationId } from "@/data/stations";
import type { GameState } from "../game";
import { CameraRig, ClickToMove } from "./camera";
import { Confetti } from "./confetti";
import { GithubGrid } from "./github-grid";
import { Marble } from "./marble";
import { bakeShadows } from "./shadows";
import { World } from "./world";

interface SceneProps {
  state: GameState;
  onTravel: (id: StationId) => void;
}

/** Only static props cast shadows, so the map is rendered once and then left alone. */
function BakeShadows() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    bakeShadows(gl);
  }, [gl]);
  return null;
}

export default function Scene({ state, onTravel }: SceneProps) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      orthographic
      flat
      shadows
      dpr={dpr}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [14, 14, 14], zoom: 55, near: 0.1, far: 120 }}
      style={{ position: "absolute", inset: 0, touchAction: "none" }}
    >
      <PerformanceMonitor onChange={({ factor }) => setDpr(1 + 0.5 * factor)} />
      <color attach="background" args={["#f3f2ef"]} />
      <hemisphereLight args={["#ffffff", "#e4dfd5", 0.75]} />
      <directionalLight
        position={[7, 14, 5]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
      />
      <Environment frames={1} resolution={64} environmentIntensity={0.5}>
        <Lightformer form="rect" intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 3, 4]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[5, 2, -5]} rotation-y={-Math.PI / 4} scale={[8, 3, 1]} />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
      <World
        near={state.mode === "exploring" ? state.near : null}
        inspecting={state.mode === "inspecting" ? state.station : null}
        visited={state.visited}
      />
      <GithubGrid />
      <Marble />
      <Confetti />
      <BakeShadows />
      <CameraRig />
      <ClickToMove onTravel={onTravel} />
    </Canvas>
  );
}
