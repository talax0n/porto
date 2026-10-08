"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { Chips, Controls, Quest, Title } from "./hud/hud";
import { Panel } from "./hud/panel";
import { useHQ } from "./use-hq";

const Scene = dynamic(() => import("./scene/scene"), { ssr: false });

export function HQ() {
  const { state, travel, activate, close } = useHQ();
  const current = state.mode === "inspecting" ? state.station : state.near;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-hq-bg">
      <Scene state={state} onTravel={travel} onActivate={activate} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2.5 px-2 pt-3 sm:pt-4 [&>*]:pointer-events-auto">
        <Title />
        <Chips visited={state.visited} current={current} onTravel={travel} />
      </div>

      <div className="absolute right-3 top-3 z-20 max-sm:hidden sm:right-4 sm:top-4">
        <Quest visited={state.visited} />
      </div>
      <div className="absolute bottom-3 right-3 z-20 sm:hidden">
        <Quest visited={state.visited} />
      </div>

      <div className="absolute bottom-3 left-3 z-20">
        <Controls />
      </div>

      <AnimatePresence>
        {state.mode === "inspecting" && <Panel key={state.station} id={state.station} onClose={close} />}
      </AnimatePresence>
    </main>
  );
}
