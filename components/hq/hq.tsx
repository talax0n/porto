"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dock, Hint, Quest, Replay, Toast, Wordmark } from "./hud/hud";
import { EdgeArrows, FullMap, Minimap } from "./hud/map";
import { Today } from "./hud/today";
import { Panel } from "./hud/panel";
import { useHQ } from "./use-hq";

// The DOM shell paints first; three.js loads behind a plain placeholder.
const Scene = dynamic(() => import("./scene/scene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-white" />,
});

export function HQ() {
  const { state, toast, quests, streak, travel, open, close, next, skip, replay, toggleMap } = useHQ();
  const current = state.mode === "inspecting" ? state.station : state.mode === "exploring" ? state.near : null;
  // the intro has the stage to itself; the first render is a drop-in too, so nothing flashes before it
  const intro = state.mode === "onboarding" || state.mode === "landing";
  const visit = quests?.find((q) => q.quest.kind === "visit" && !q.done)?.quest;
  /** today's unfinished visit quest, which the map and the waypoints point at */
  const target = visit?.kind === "visit" ? visit.station : null;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-white">
      <Scene state={state} target={target} onTravel={travel} onOpen={open} onNext={next} onSkip={skip} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-6">
        <div data-hud>
          <Wordmark />
        </div>
        <div
          data-hud
          className={cn("flex flex-col items-end gap-3 transition-opacity duration-500", intro && "opacity-0")}
          aria-hidden={intro}
        >
          <Quest visited={state.visited} met={state.met} />
          {quests && state.mode === "exploring" && <Today quests={quests} streak={streak} onTravel={travel} />}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-3 max-sm:top-44">
        <AnimatePresence>{toast && <Toast key={toast.id} text={toast.text} />}</AnimatePresence>
      </div>

      {!intro && (
        <div data-hud className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 sm:bottom-5">
          <Dock visited={state.visited} current={current} onTravel={travel} />
        </div>
      )}
      {state.mode === "exploring" && (
        <div data-hud className="absolute bottom-5 left-5 z-20 flex items-end gap-1.5 max-sm:bottom-auto max-sm:left-3 max-sm:top-24">
          <Hint />
          <Replay onReplay={replay} />
        </div>
      )}

      {state.mode === "exploring" && <EdgeArrows target={target} onTravel={travel} />}
      {state.mode === "exploring" && (
        <div data-hud className="absolute right-5 bottom-5 z-20 max-sm:right-3 max-sm:bottom-16">
          <Minimap visited={state.visited} met={state.met} target={target} onOpen={toggleMap} />
        </div>
      )}
      <AnimatePresence>
        {state.mode === "map" && (
          <FullMap visited={state.visited} met={state.met} target={target} onTravel={travel} onClose={close} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.mode === "inspecting" && <Panel key={state.station} id={state.station} onClose={close} />}
      </AnimatePresence>
    </main>
  );
}
