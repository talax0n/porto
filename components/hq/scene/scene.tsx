"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import type { StationId } from "@/data/stations";
import type { GameState } from "../game";
import { CameraRig, ClickToMove } from "./camera";
import { Confetti } from "./confetti";
import { Crowd } from "./crowd";
import { GithubGrid } from "./github-grid";
import { IntroBubble } from "./intro";
import { World } from "./world";

interface SceneProps {
  state: GameState;
  onTravel: (id: StationId) => void;
  onOpen: (id: StationId) => void;
  onNext: () => void;
  onSkip: () => void;
}

export default function Scene({ state, onTravel, onOpen, onNext, onSkip }: SceneProps) {
  const [dpr, setDpr] = useState(1.5);
  const near = state.mode === "exploring" ? state.near : null;
  return (
    <Canvas
      flat
      dpr={dpr}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.5, far: 80, position: [0, 30, 20] }}
      // clip, not hidden: focusing a button in an <Html> bubble would otherwise scroll the whole canvas away
      style={{ position: "absolute", inset: 0, touchAction: "none", overflow: "clip" }}
    >
      <PerformanceMonitor onChange={({ factor }) => setDpr(1 + 0.5 * factor)} />
      <color attach="background" args={["#ffffff"]} />
      <hemisphereLight args={["#eaf2ff", "#f3e3c8", 1.1]} />
      <World near={near} inspecting={state.mode === "inspecting" ? state.station : null} visited={state.visited} />
      <GithubGrid />
      <Crowd met={state.met} near={near} onOpen={onOpen} />
      {state.mode === "onboarding" && <IntroBubble step={state.step} onNext={onNext} onSkip={onSkip} />}
      <Confetti />
      <CameraRig />
      <ClickToMove onTravel={onTravel} />
    </Canvas>
  );
}
