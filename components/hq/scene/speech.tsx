import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import type { PeerId } from "@/data/room";
import { ctl } from "../game";
import type { Line } from "../use-room";
import { R, arc } from "./planet";

const HEAD = R + 1.1;
/** bubbles only show for people within this walking distance of the player, as in `agents.tsx` */
const NEAR = 3;
/** a bubble lasts this long; the line stays in the log a little longer */
const SHOWN = 6_000;

interface BubbleProps {
  line: Line;
  mine: boolean;
  onMute: (id: PeerId) => void;
}

function Bubble({ line, mine, onMute }: BubbleProps) {
  const head = useRef<Group>(null);
  const bubble = useRef<HTMLButtonElement>(null);

  useFrame(({ camera }) => {
    if (!head.current || !bubble.current) return;
    const visitor = mine ? undefined : ctl.visitors.find((v) => v.peer === line.id);
    const at = mine ? ctl.player : visitor;
    const visible =
      !!at &&
      performance.now() - line.at < SHOWN &&
      at.n.dot(camera.position) > 0 &&
      (mine || arc(at.n, ctl.player.n) < NEAR);
    if (at) head.current.position.copy(at.n).multiplyScalar(HEAD + (mine ? ctl.alt : (visitor?.lift ?? 0)));
    // Html ignores group.visible and would paint through the planet, so fade the DOM itself
    bubble.current.style.opacity = visible ? "1" : "0";
    bubble.current.style.pointerEvents = visible && !mine ? "auto" : "none";
  });

  return (
    <group ref={head}>
      <Html center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
        <button
          type="button"
          ref={bubble}
          onClick={() => onMute(line.id)}
          disabled={mine}
          aria-label={mine ? `You said: ${line.text}` : `Mute this visitor. They said: ${line.text}`}
          title={mine ? undefined : "Tap to mute"}
          style={{ opacity: 0, pointerEvents: "none" }}
          className="hq-bubble relative w-max max-w-[220px] rounded-2xl border border-hq-line bg-white px-3 py-2 text-left text-[12px] leading-snug break-words text-hq-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] transition-opacity duration-300 max-sm:max-w-[180px] max-sm:text-[11px]"
        >
          {line.text}
        </button>
      </Html>
    </group>
  );
}

interface SpeechProps {
  lines: readonly Line[];
  me: PeerId | null;
  onMute: (id: PeerId) => void;
}

/** What people nearby just said, as a bubble over their head. Tapping someone else's bubble mutes them. */
export function Speech({ lines, me, onMute }: SpeechProps) {
  // one bubble per speaker: the newest line replaces the one before it
  return [...new Map(lines.map((l) => [l.id, l])).values()].map((line) => (
    <Bubble key={line.key} line={line} mine={line.id === me} onMute={onMute} />
  ));
}
