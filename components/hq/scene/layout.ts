import { STATIONS } from "@/data/stations";

export const WORLD = { halfX: 12, halfZ: 10 } as const;
export const PLAYER_RADIUS = 0.35;
export const PLINTH_SIZE = 3.2;
export const PLINTH_HEIGHT = 0.4;

export function isBlocked(x: number, z: number): boolean {
  const lim = PLAYER_RADIUS;
  if (Math.abs(x) > WORLD.halfX - lim || Math.abs(z) > WORLD.halfZ - lim) return true;
  const half = PLINTH_SIZE / 2 + lim;
  return STATIONS.some(({ plinth }) => Math.abs(x - plinth[0]) < half && Math.abs(z - plinth[1]) < half);
}
