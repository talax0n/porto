import type { BufferGeometry } from "three";
import type { StationId } from "@/data/stations";
import { EXPERIENCE } from "@/data/experience";
import { AWARDS } from "@/data/awards";
import { TONE, ball, box, cone, cyl, merge, part, pill, ring, type Part } from "./clay";

const { white, light, mid, dark } = TONE;

export const PLINTH_SIZE = 3.2;
export const PLINTH_HEIGHT = 0.4;
/** The plinth runs this far below the ground so its corners stay buried where the planet curves away. */
const SKIRT = 0.5;
const H = Math.PI / 2;

/** Dioramas leave the plinth's front-right corner (x,z > 0.55) free for the progress tile. */

function about(): Part[] {
  return [
    part(box(2.7, 0.1, 2.7, 0.04), [-0.1, 0.05, -0.1], { tone: light }),
    part(box(2.7, 1.6, 0.14, 0.05), [-0.1, 0.8, -1.4]),
    part(box(0.14, 1.6, 2.7, 0.05), [-1.4, 0.8, -0.1]),
    part(box(0.5, 0.4, 0.04, 0.02), [-0.3, 1.05, -1.32], { tone: light }),
    // desk
    part(box(1.1, 0.08, 0.55, 0.03), [0, 0.55, -1.0]),
    part(box(0.08, 0.5, 0.5, 0.02), [-0.5, 0.28, -1.0]),
    part(box(0.08, 0.5, 0.5, 0.02), [0.5, 0.28, -1.0]),
    part(box(0.55, 0.36, 0.05, 0.03), [-0.1, 0.84, -1.12], { tone: dark }),
    part(cyl(0.04, 0.05, 0.18), [-0.1, 0.65, -1.1], { tone: mid }),
    // lamp
    part(cyl(0.1, 0.12, 0.04), [0.4, 0.61, -1.1], { tone: mid }),
    part(cyl(0.015, 0.015, 0.4), [0.4, 0.8, -1.1], { tone: mid }),
    part(cone(0.14, 0.18), [0.4, 1.05, -1.1], { rot: [Math.PI, 0, 0] }),
    // chair
    part(cyl(0.2, 0.2, 0.07), [-0.1, 0.34, -0.45]),
    part(cyl(0.03, 0.03, 0.3), [-0.1, 0.17, -0.45], { tone: mid }),
    part(box(0.38, 0.34, 0.06, 0.03), [-0.1, 0.58, -0.25]),
    // plant
    part(cyl(0.16, 0.12, 0.26), [-1.05, 0.13, -0.9], { tone: mid }),
    part(ball(0.2), [-1.05, 0.42, -0.9]),
    part(ball(0.15), [-0.92, 0.62, -0.84]),
    part(ball(0.13), [-1.15, 0.58, -0.98]),
  ];
}

function projects(): Part[] {
  const parts: Part[] = [
    part(box(2.7, 0.1, 0.95, 0.04), [0, 0.55, -0.45]),
    part(box(0.1, 0.5, 0.8, 0.03), [-1.2, 0.25, -0.45], { tone: light }),
    part(box(0.1, 0.5, 0.8, 0.03), [1.2, 0.25, -0.45], { tone: light }),
  ];
  [-0.85, 0, 0.85].forEach((x, i) => {
    const h = [0.5, 0.62, 0.5][i];
    parts.push(
      part(cyl(0.05, 0.1, 0.2), [x, 0.7, -0.7], { tone: mid }),
      part(box(0.7, h, 0.07, 0.05), [x, 0.6 + h / 2, -0.7], { rot: [-0.08, 0, 0] }),
      part(box(0.6, h - 0.1, 0.02, 0.03), [x, 0.6 + h / 2, -0.655], { rot: [-0.08, 0, 0], tone: dark }),
    );
  });
  // laptop
  parts.push(
    part(box(0.6, 0.035, 0.42, 0.02), [0.55, 0.62, 0.0], { tone: light }),
    part(box(0.6, 0.4, 0.03, 0.02), [0.55, 0.82, -0.2], { rot: [-0.25, 0, 0] }),
    part(box(0.52, 0.32, 0.01, 0.01), [0.55, 0.82, -0.18], { rot: [-0.25, 0, 0], tone: dark }),
    part(ball(0.12), [-0.5, 0.72, 0.05]),
  );
  return parts;
}

function experience(): Part[] {
  const n = EXPERIENCE.length;
  const parts: Part[] = [];
  for (let i = 0; i < n; i++) {
    const h = 0.32 * (i + 1);
    // steps climb away from the camera so every riser stays visible
    parts.push(part(box(0.85, h, 1.25, 0.07), [0.55 - i * 0.85, h / 2, -0.35], { tone: i % 2 ? light : white }));
  }
  const top = 0.32 * n;
  const x = 0.55 - (n - 1) * 0.85;
  parts.push(
    part(cyl(0.025, 0.025, 0.7), [x, top + 0.35, -0.5], { tone: mid }),
    part(box(0.4, 0.24, 0.03, 0.02), [x + 0.2, top + 0.58, -0.5]),
    part(ball(0.17), [x, top + 0.17, 0.05]),
  );
  return parts;
}

function skills(): Part[] {
  return [
    part(box(0.85, 0.85, 0.85, 0.16), [-0.75, 0.43, -0.35]),
    part(box(0.6, 0.6, 0.6, 0.13), [-0.75, 1.15, -0.35], { rot: [0, 0.4, 0], tone: light }),
    part(ball(0.32), [-0.75, 1.75, -0.35]),
    part(ball(0.5), [0.35, 0.5, -0.75]),
    part(cyl(0.34, 0.34, 0.7), [0.4, 0.35, 0.0], { tone: light }),
    part(ring(0.3, 0.14), [-0.45, 0.14, 0.7], { rot: [H, 0, 0] }),
    part(pill(0.17, 0.5), [-1.15, 0.43, 0.6], { rot: [0, 0, H], tone: mid }),
    part(cone(0.3, 0.6), [1.0, 0.3, -0.7], { tone: mid }),
  ];
}

function awards(): Part[] {
  const wins = Math.min(3, AWARDS.length);
  const steps: [number, number, number][] = [
    [0, 0.95, 1],
    [-0.9, 0.65, 2],
    [0.9, 0.45, 3],
  ];
  const parts: Part[] = [];
  steps.slice(0, wins).forEach(([x, h, place]) => {
    parts.push(
      part(box(0.8, h, 0.8, 0.07), [x, h / 2, -0.4], { tone: place === 1 ? white : light }),
      part(cyl(0.1, 0.06, 0.2), [x, h + 0.13, -0.4]),
      part(ball(0.1), [x, h + 0.33, -0.4]),
      part(ring(0.08, 0.02), [x - 0.12, h + 0.2, -0.4], { rot: [0, 0, H] }),
      part(ring(0.08, 0.02), [x + 0.12, h + 0.2, -0.4], { rot: [0, 0, H] }),
      part(cyl(0.12, 0.14, 0.04), [x, h + 0.02, -0.4], { tone: mid }),
    );
  });
  return parts;
}

function github(): Part[] {
  return [part(box(2.7, 0.12, 1.5, 0.05), [0, 0.06, -0.4], { tone: light })];
}

function contact(): Part[] {
  return [
    part(cyl(0.07, 0.09, 0.9), [-0.4, 0.45, -0.6], { tone: mid }),
    part(box(0.75, 0.42, 0.5, 0.12), [-0.4, 1.05, -0.6]),
    part(cyl(0.25, 0.25, 0.75), [-0.4, 1.26, -0.6], { rot: [0, 0, H] }),
    part(box(0.04, 0.3, 0.12, 0.02), [-0.02, 1.05, -0.6], { tone: mid }),
    part(box(0.5, 0.05, 0.36, 0.025), [0.25, 0.08, -0.2], { rot: [0, 0.35, 0], tone: white }),
    part(ball(0.06), [0.25, 0.14, -0.2], { tone: mid }),
    part(box(0.5, 0.05, 0.36, 0.025), [0.1, 0.3, 0.1], { rot: [0.5, 0.9, 0.2], tone: light }),
  ];
}

const BUILDERS: Record<StationId, () => Part[]> = {
  about,
  projects,
  experience,
  skills,
  awards,
  github,
  contact,
};

export function buildStation(id: StationId): BufferGeometry {
  const h = PLINTH_HEIGHT + SKIRT;
  const plinth = part(box(PLINTH_SIZE, h, PLINTH_SIZE, 0.14), [0, -PLINTH_HEIGHT - SKIRT + h / 2, 0]);
  return merge([plinth, ...BUILDERS[id]()], [0, PLINTH_HEIGHT, 0]);
}
