import { X } from "lucide-react";
import { motion } from "framer-motion";
import { STATION_BY_ID, type StationId } from "@/data/stations";
import { PANELS } from "../panels";

export function Panel({ id, onClose }: { id: StationId; onClose: () => void }) {
  const station = STATION_BY_ID[id];
  const Content = PANELS[id];
  return (
    <motion.aside
      role="dialog"
      aria-label={station.label}
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="absolute z-30 flex flex-col overflow-hidden rounded-lg border border-hq-line bg-hq-panel/95 shadow-2xl backdrop-blur-md max-sm:inset-x-2 max-sm:bottom-2 max-sm:h-[62dvh] sm:right-6 sm:top-28 sm:max-h-[calc(100dvh-8rem)] sm:w-[min(460px,42vw)]"
      style={{ borderTop: `3px solid ${station.accent}` }}
    >
      <header className="flex items-center gap-2 border-b border-hq-line px-4 py-3 font-mono">
        <span className="size-2.5 rounded-full" style={{ background: station.accent }} />
        <h2 className="flex-1 text-xs tracking-[0.2em] text-hq-amber">{station.label.toUpperCase()}</h2>
        <kbd className="rounded border border-hq-line px-1.5 py-0.5 text-[10px] text-hq-cream/70 max-sm:hidden">Esc</kbd>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded p-1 text-hq-cream/80 hover:bg-hq-line"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <Content />
      </div>
    </motion.aside>
  );
}
