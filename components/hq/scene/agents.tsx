import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import type { Agent, Kind, Provider } from "@/data/pulse";
import type { StationId } from "@/data/stations";
import { ctl } from "../game";
import { usePulse } from "../use-pulse";
import { LANDMARKS, R } from "./planet";

const STATION_BY_KIND: Record<Kind, StationId> = {
  edit: "projects",
  run: "github",
  read: "about",
  search: "skills",
  web: "contact",
  other: "experience",
};
const PROVIDER: Record<Provider, string> = { claude: "Claude", codex: "Codex" };
const VERB: Record<Kind, string> = {
  edit: "editing",
  run: "running",
  read: "reading",
  search: "searching",
  web: "browsing",
  other: "working",
};
/** idle sleeper: the first villager naps at the about house */
const BED = LANDMARKS.about.door;
const HEAD = R + 1.1;

const say = (a: Agent) => `${PROVIDER[a.provider]} · ${a.phase === "tool" ? VERB[a.kind] : a.phase}`;

const AGO: [number, string][] = [
  [86_400_000, "d"],
  [3_600_000, "h"],
  [60_000, "m"],
];
function ago(ms: number) {
  const [unit, label] = AGO.find(([u]) => ms >= u) ?? [1, ""];
  return label ? `${Math.floor(ms / unit)}${label} ago` : "just now";
}

/** Sends one villager per live agent to the station its tool belongs to; with none live, the first one naps. */
export function Agents() {
  const { pulse, at } = usePulse();
  const idle = !pulse.agents.length && pulse.lastSeen > 0;
  const lines: { title: string | null; status: string }[] = idle
    ? [{ title: null, status: `zzz · last active ${ago(at - pulse.lastSeen)} · ${pulse.runsToday} runs today` }]
    : pulse.agents.map((a) => ({ title: a.title, status: say(a) }));
  const heads = useRef<(Group | null)[]>([]);

  useFrame(({ camera }) => {
    const { agents, lastSeen } = ctl.pulse;
    ctl.villagers.forEach((v, i) => {
      const a = agents[i];
      v.goal = a ? LANDMARKS[STATION_BY_KIND[a.kind]].door : !agents.length && lastSeen > 0 && i === 0 ? BED : null;
      const head = heads.current[i];
      if (!head) return;
      head.position.copy(v.n).multiplyScalar(HEAD);
      // Html would paint through the planet, so hide bubbles on the far side
      head.visible = v.n.dot(camera.position) > 0;
    });
  });

  useEffect(
    () => () => {
      for (const v of ctl.villagers) v.goal = null;
    },
    [],
  );

  return lines.map((line, i) => (
    <group key={i} ref={(g) => void (heads.current[i] = g)}>
      <Html center zIndexRange={[13, 0]} style={{ pointerEvents: "none" }}>
        <div className="hq-bubble relative w-max max-w-[220px] rounded-2xl border border-hq-line bg-white px-3 py-2 text-left text-[12px] leading-snug text-hq-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)] max-sm:max-w-[180px] max-sm:text-[11px]">
          {line.title && <div className="font-medium">{line.title}</div>}
          <div className={line.title ? "text-[11px] text-hq-ink/60" : undefined}>{line.status}</div>
        </div>
      </Html>
    </group>
  ));
}
