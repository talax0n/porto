import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Keyboard, MessageCircle, SendHorizontal } from "lucide-react";
import { EMOTES, type Emote, PRESETS, SAY_MAX } from "@/data/room";
import { cn } from "@/lib/utils";
import { ctl } from "../game";
import type { Room } from "../use-room";

const EMOJI: Record<Emote, string> = { wave: "👋", cheer: "🎉", hop: "⬆️", point: "👉" };
const CHIP =
  "rounded-full border border-hq-line bg-white px-3 py-1.5 text-[12px] text-hq-ink transition-colors hover:bg-hq-bg active:bg-hq-bg pointer-coarse:min-h-11 pointer-coarse:px-3.5";

/** The online count, a tap-to-talk row of presets and emotes, and free text behind the keyboard button. Enter opens it. */
export function Chat({ room }: { room: Room }) {
  const still = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const show = (withKeyboard: boolean) => {
    ctl.keys.clear();
    setOpen(true);
    setTyping(withKeyboard);
  };
  const close = () => {
    setOpen(false);
    setTyping(false);
    setDraft("");
  };

  useEffect(() => {
    if (typing) input.current?.focus();
  }, [typing]);

  // capture phase, so Enter opens the chat before the game's own Enter shortcut sees it
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Enter" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
      e.preventDefault();
      e.stopPropagation();
      ctl.keys.clear();
      setOpen(true);
      setTyping(true);
    };
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", down, true);
    document.addEventListener("pointerdown", away);
    return () => {
      window.removeEventListener("keydown", down, true);
      document.removeEventListener("pointerdown", away);
    };
  }, []);

  if (room.online === null) return null;

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.trim()) room.say(draft);
    close();
  };

  return (
    <div
      ref={box}
      className="pointer-events-none absolute bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex w-[min(92vw,21rem)] -translate-x-1/2 flex-col items-center gap-2 sm:bottom-[4.75rem]"
    >
      <ul
        aria-live="polite"
        aria-label="Recent chat"
        className="flex flex-col items-center gap-0.5 text-center text-[11px] text-hq-ink [text-shadow:0_0_4px_#fff,0_0_8px_#fff]"
      >
        {!open &&
          room.lines.slice(-3).map((l) => (
            <li key={l.key} className="max-w-full break-words">
              <span className="font-semibold">{l.id === room.me ? "you" : l.id.slice(0, 4)}</span> {l.text}
            </li>
          ))}
      </ul>
      <AnimatePresence>
        {open && (
          <motion.div
            role="group"
            aria-label="Chat"
            initial={{ opacity: 0, y: still ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: still ? 0 : 8 }}
            transition={{ duration: still ? 0 : 0.18 }}
            onKeyDown={(e) => e.key === "Escape" && close()}
            className="pointer-events-auto flex w-full flex-col gap-2 rounded-2xl border border-hq-line bg-white/95 p-2.5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur"
          >
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  className={CHIP}
                  onClick={() => {
                    room.preset(i);
                    close();
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {EMOTES.map((e) => (
                <button
                  key={e}
                  type="button"
                  aria-label={`Emote: ${e}`}
                  title={e}
                  className={CHIP}
                  onClick={() => {
                    room.emote(e);
                    close();
                  }}
                >
                  {EMOJI[e]}
                </button>
              ))}
              <button
                type="button"
                aria-label="Type a message"
                aria-pressed={typing}
                onClick={() => setTyping((t) => !t)}
                className={cn(CHIP, "ml-auto grid place-items-center px-2.5", typing && "bg-hq-bg")}
              >
                <Keyboard className="size-4" />
              </button>
            </div>
            {typing && (
              <form onSubmit={send} className="flex items-center gap-1.5">
                <input
                  ref={input}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={SAY_MAX}
                  enterKeyHint="send"
                  autoComplete="off"
                  aria-label="Say something"
                  placeholder="Say something…"
                  className="min-w-0 flex-1 rounded-full border border-hq-line bg-white px-3 py-1.5 text-base text-hq-ink outline-none placeholder:text-hq-mute focus-visible:border-hq-accent sm:text-[12px]"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-hq-accent text-white pointer-coarse:size-11"
                >
                  <SendHorizontal className="size-4" />
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        data-hud
        type="button"
        onClick={() => (open ? close() : show(false))}
        aria-expanded={open}
        aria-label={`Chat, ${room.online} ${room.online === 1 ? "person" : "people"} here`}
        className="pointer-events-auto flex min-h-8 items-center gap-1.5 rounded-full border border-hq-line bg-white/90 px-3 text-[11px] font-semibold text-hq-ink backdrop-blur transition-colors hover:bg-white pointer-coarse:min-h-11"
      >
        <MessageCircle className="size-3.5" aria-hidden />
        <span className="tabular-nums">{room.online}</span> here
      </button>
    </div>
  );
}
