export type StationId =
  | "about"
  | "projects"
  | "experience"
  | "skills"
  | "awards"
  | "github"
  | "contact";

export interface Station {
  id: StationId;
  /** name tag and HUD chip text */
  label: string;
  hotkey: string;
  /** x,z floor coordinates of the interaction spot */
  position: [number, number];
  accent: string;
}

export const STATIONS: readonly Station[] = [
  { id: "about", label: "About", hotkey: "1", position: [-6.9, 4.2], accent: "#f2a93b" },
  { id: "projects", label: "Projects", hotkey: "2", position: [6.5, -2.8], accent: "#4fc3f7" },
  { id: "experience", label: "Experience", hotkey: "3", position: [-3, 0], accent: "#ef8a62" },
  { id: "skills", label: "Skills", hotkey: "4", position: [-7.6, -0.9], accent: "#7bd88f" },
  { id: "awards", label: "Awards", hotkey: "5", position: [0, -5], accent: "#ffd23f" },
  { id: "github", label: "GitHub", hotkey: "6", position: [-6.5, -5.4], accent: "#b39ddb" },
  { id: "contact", label: "Contact", hotkey: "7", position: [7.4, 0.4], accent: "#ff6f91" },
];

export const STATION_BY_ID = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
) as Record<StationId, Station>;
