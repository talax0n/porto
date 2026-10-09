import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import type { PeerId } from "@/data/room";
import { cn } from "@/lib/utils";
import { ctl } from "../game";
import type { Line } from "../use-room";
import { R, arc } from "./planet";

const HEAD = R + 1.1;
/** names and bubbles only show for people within this walking distance of the player, as in `agents.tsx` */
const NEAR = 3;
/** a bubble lasts this long; the line stays in the log a good while longer */
const SHOWN = 6_000;

interface TagProps {
  id: PeerId;
  name: string;
  mine: boolean;
  line: Line | undefined;
  onMute: (id: PeerId) => void;
}

function Tag({ id, name, mine, line, onMute }: TagProps) {
  const head = useRef<Group>(null);
  const label = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLButtonElement>(null);

  useFrame(({ camera }) => {
    if (!head.current || !label.current) return;
    const visitor = mine ? undefined : ctl.visitors.find((v) => v.peer === id);
    const at = mine ? ctl.player : visitor;
    const visible = !!at && at.n.dot(camera.position) > 0 && (mine || arc(at.n, ctl.player.n) < NEAR);
    if (at) head.current.position.copy(at.n).multiplyScalar(HEAD + (mine ? ctl.alt : (visitor?.lift ?? 0)));
    // Html ignores group.visible and would paint through the planet, so fade the DOM itself
    label.current.style.opacity = visible ? "1" : "0";
    if (!bubble.current || !line) return;
    const age = performance.now() - line.at;
    const speaking = visible && age < SHOWN;
    bubble.current.style.opacity = speaking ? "1" : "0";
    bubble.current.style.pointerEvents = speaking && !mine ? "auto" : "none";
    // an expired bubble gives its room back, so the name settles onto the head
    bubble.current.style.display = age < SHOWN + 400 ? "" : "none";
  });

  return (
    <group ref={head}>
      <Html center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
        <div className="relative h-0 w-0">
          <div ref={label} className="absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1" style={{ opacity: 0 }}>
            {line && (
              <button
                type="button"
                ref={bubble}
                onClick={() => onMute(id)}
                disabled={mine}
                aria-label={mine ? `You said: ${line.text}` : `Mute ${name}. They said: ${line.text}`}
                title={mine ? undefined : "Tap to mute"}
                style={{ opacity: 0, pointerEvents: "none" }}
                className="hq-bubble relative w-max max-w-[220px] rounded-2xl border border-hq-line bg-white px-3 py-2 text-left text-[12px] leading-snug break-words text-hq-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] transition-opacity duration-300 max-sm:max-w-[180px] max-sm:text-[11px]"
              >
                {line.text}
              </button>
            )}
            <span
              className={cn(
                "w-max max-w-[140px] truncate rounded-full border border-hq-line bg-white/90 px-2 py-0.5 text-[10px] leading-none font-semibold backdrop-blur",
                mine ? "text-hq-accent" : "text-hq-ink",
              )}
            >
              {name}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

interface SpeechProps {
  lines: readonly Line[];
  names: Readonly<Record<PeerId, string>>;
  me: PeerId | null;
  onMute: (id: PeerId) => void;
}

/** Everyone's name over their head, with what they just said stacked above it. Tapping someone else's bubble mutes them. */
export function Speech({ lines, names, me, onMute }: SpeechProps) {
  // one bubble per speaker: the newest line replaces the one before it
  const latest = new Map(lines.map((l) => [l.id, l]));
  return Object.entries(names).map(([id, name]) => (
    <Tag key={id} id={id} name={name} mine={id === me} line={latest.get(id)} onMute={onMute} />
  ));
}
