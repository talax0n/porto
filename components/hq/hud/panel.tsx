import { X } from "lucide-react";
import { motion } from "framer-motion";
import { STATION_BY_ID, type StationId } from "@/data/stations";
import { PANELS } from "../panels";

const OFFSET = { opacity: 0, x: 48, y: 0 };
const OFFSET_MOBILE = { opacity: 0, x: 0, y: 64 };

export function Panel({ id, onClose }: { id: StationId; onClose: () => void }) {
  const station = STATION_BY_ID[id];
  const Content = PANELS[id];
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  const off = mobile ? OFFSET_MOBILE : OFFSET;
  return (
    <motion.aside
      role="dialog"
      aria-label={station.label}
      initial={off}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={off}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="absolute z-30 flex flex-col overflow-hidden rounded-3xl border border-hq-line bg-white text-hq-ink shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] max-sm:inset-x-2 max-sm:bottom-2 max-sm:h-[68dvh] sm:right-6 sm:top-24 sm:max-h-[calc(100dvh-11.5rem)] sm:w-[min(460px,42vw)]"
    >
      <header className="flex items-start gap-3 px-6 pt-5 max-sm:px-5 max-sm:pt-4">
        <div className="flex-1">
          <p className="font-sans text-[11px] tracking-[0.18em] text-hq-mute">0{station.hotkey}</p>
          <h2 className="font-display text-4xl font-extrabold leading-none tracking-tight max-sm:text-3xl">
            {station.label}
          </h2>
        </div>
        <kbd className="mt-1 rounded-md border border-hq-line px-1.5 py-0.5 text-[10px] text-hq-mute max-sm:hidden">Esc</kbd>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-full border border-hq-line p-1.5 text-hq-ink transition-colors hover:bg-hq-bg"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-4 max-sm:px-5 max-sm:pb-4">
        <Content />
      </div>
    </motion.aside>
  );
}
