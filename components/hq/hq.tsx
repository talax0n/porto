"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { Dock, Hint, Quest, Toast, Wordmark } from "./hud/hud";
import { Panel } from "./hud/panel";
import { useHQ } from "./use-hq";

// The DOM shell paints first; three.js loads behind a plain placeholder.
const Scene = dynamic(() => import("./scene/scene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-hq-bg" />,
});

export function HQ() {
  const { state, toast, travel, open, close } = useHQ();
  const current = state.mode === "inspecting" ? state.station : state.near;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-hq-bg">
      <Scene state={state} onTravel={travel} onOpen={open} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
        <Wordmark />
        <Quest visited={state.visited} met={state.met} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center max-sm:top-28">
        <AnimatePresence>{toast && <Toast key={toast} kind={toast} />}</AnimatePresence>
      </div>

      <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 sm:bottom-5">
        <Dock visited={state.visited} current={current} onTravel={travel} />
      </div>
      {state.mode === "exploring" && (
        <div className="absolute bottom-5 left-5 z-20">
          <Hint />
        </div>
      )}

      <AnimatePresence>
        {state.mode === "inspecting" && <Panel key={state.station} id={state.station} onClose={close} />}
      </AnimatePresence>
    </main>
  );
}
