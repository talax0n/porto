export interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export const ROOM = { halfX: 10, halfZ: 7, wallH: 2.8, rimH: 0.4 } as const;
export const PLAYER_RADIUS = 0.28;

export const RECEPTION: Rect = { x: -8.3, z: 4.2, w: 1.2, d: 3.2 };
export const PROJECT_DESKS: Rect[] = [3.6, 6.2, 8.8].map((x) => ({ x, z: -4.7, w: 2, d: 1 }));
export const PROJECT_AREA: Rect = { x: 6.2, z: -4.5, w: 6.4, d: 1.9 };
export const MEETING_TABLE: Rect = { x: -3, z: -2.5, w: 3.4, d: 3.4 };
export const RACKS: Rect = { x: -9.2, z: -1.1, w: 1.2, d: 3.7 };
export const TROPHY_SHELF: Rect = { x: 0, z: -6.5, w: 3.2, d: 0.8 };
export const PHONE_BOOTH: Rect = { x: 8.8, z: 0.4, w: 1.3, d: 1.3 };
export const SOFA: Rect = { x: 6.5, z: 5.9, w: 3, d: 1.1 };
export const COFFEE_TABLE: Rect = { x: 6.5, z: 4.5, w: 1.4, d: 0.8 };
export const PING_PONG: Rect = { x: 1.5, z: 4.2, w: 2.9, d: 1.7 };
export const PLANTS: Rect[] = [
  { x: 9.3, z: -6.3, w: 0.6, d: 0.6 },
  { x: -9.3, z: -6.3, w: 0.6, d: 0.6 },
  { x: 9.3, z: 3.3, w: 0.6, d: 0.6 },
  { x: 2.6, z: -0.6, w: 0.6, d: 0.6 },
  { x: -3, z: 6.4, w: 0.6, d: 0.6 },
];
export const LAMP: Rect = { x: 9.3, z: 2.3, w: 0.4, d: 0.4 };

export const COLLIDERS: readonly Rect[] = [
  RECEPTION,
  PROJECT_AREA,
  MEETING_TABLE,
  RACKS,
  TROPHY_SHELF,
  PHONE_BOOTH,
  SOFA,
  COFFEE_TABLE,
  PING_PONG,
  LAMP,
  ...PLANTS,
];

export function isBlocked(x: number, z: number): boolean {
  const lim = PLAYER_RADIUS;
  if (Math.abs(x) > ROOM.halfX - lim - 0.1 || Math.abs(z) > ROOM.halfZ - lim - 0.1) return true;
  return COLLIDERS.some(
    (r) => Math.abs(x - r.x) < r.w / 2 + lim && Math.abs(z - r.z) < r.d / 2 + lim,
  );
}
