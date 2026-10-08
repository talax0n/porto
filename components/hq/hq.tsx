"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { Panel } from "./hud/panel";
import { useHQ } from "./use-hq";

const Scene = dynamic(() => import("./scene/scene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-hq-bg" />,
});

export function HQ() {
  const { state, travel, activate, close } = useHQ();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-hq-bg">
      <Scene state={state} onTravel={travel} onActivate={activate} />
      <AnimatePresence>
        {state.mode === "inspecting" && <Panel key={state.station} id={state.station} onClose={close} />}
      </AnimatePresence>
    </main>
  );
}
