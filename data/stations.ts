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
  /** name tag and dock text */
  label: string;
  hotkey: string;
  /** x,z of the plinth centre */
  plinth: [number, number];
  /** x,z floor coordinates of the interaction spot, on the plinth side that faces the hub */
  position: [number, number];
}

/** Plinth edge-to-centre distance plus room for the marble. */
const REACH = 2.35;

function make(
  id: StationId,
  label: string,
  hotkey: string,
  plinth: [number, number],
): Station {
  const [x, z] = plinth;
  const position: [number, number] =
    Math.abs(x) > Math.abs(z) ? [x - Math.sign(x) * REACH, z] : [x, z - Math.sign(z) * REACH];
  return { id, label, hotkey, plinth, position };
}

export const STATIONS: readonly Station[] = [
  make("about", "About", "1", [-7.5, 2]),
  make("projects", "Projects", "2", [-4.5, -5]),
  make("experience", "Experience", "3", [2.5, -6.5]),
  make("skills", "Skills", "4", [8, -2.5]),
  make("awards", "Awards", "5", [7, 4]),
  make("github", "GitHub", "6", [1.5, 6.5]),
  make("contact", "Contact", "7", [-4.5, 6.5]),
];

export const STATION_BY_ID = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
) as Record<StationId, Station>;
