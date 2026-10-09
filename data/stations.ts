import { AWARDS } from "./awards";
import { CHANGELOG } from "./changelog";
import { PROJECTS } from "./projects";

export type StationId =
  | "about"
  | "projects"
  | "experience"
  | "skills"
  | "awards"
  | "github"
  | "contact"
  | "updates";

export interface Station {
  id: StationId;
  /** name tag and dock text */
  label: string;
  hotkey: string;
  /** landmark spot on the planet in degrees: polar angle from the hub at the north pole, then azimuth */
  at: [number, number];
  /** what the keeper at the door says when you walk up */
  line: string;
}

export const STATIONS: readonly Station[] = [
  { id: "about", label: "About", hotkey: "1", at: [38, 200], line: "Hi! This is Theo's house. He plans the architecture before the code." },
  { id: "projects", label: "Projects", hotkey: "2", at: [40, 290], line: `Psst. Theo shipped ${PROJECTS.length} projects. SolHedge is my favourite.` },
  { id: "experience", label: "Experience", hotkey: "3", at: [42, 20], line: "Two years of fintech, e-commerce and healthcare. Climb the steps." },
  { id: "skills", label: "Skills", hotkey: "4", at: [40, 110], line: "React, Next.js, Unity, Docker. Theo keeps them all in here." },
  { id: "awards", label: "Awards", hotkey: "5", at: [98, 335], line: `${AWARDS.length} awards on the podium. Go on, have a look.` },
  { id: "github", label: "GitHub", hotkey: "6", at: [102, 65], line: "Every cube is a day of commits. It's getting tall." },
  { id: "contact", label: "Contact", hotkey: "7", at: [98, 155], line: "Want to build something together? Leave Theo a letter." },
  { id: "updates", label: "Updates", hotkey: "8", at: [24, 65], line: `Fresh off the press: v${CHANGELOG[0].version}. Read the board.` },
];

export const STATION_BY_ID = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
) as Record<StationId, Station>;
