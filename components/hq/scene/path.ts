import { ROOM, isBlocked } from "./layout";

const CELL = 0.25;
const W = Math.round((ROOM.halfX * 2) / CELL);
const H = Math.round((ROOM.halfZ * 2) / CELL);

type Pt = [number, number];

const cellCenter = (i: number, j: number): Pt => [-ROOM.halfX + (i + 0.5) * CELL, -ROOM.halfZ + (j + 0.5) * CELL];
const toCell = (x: number, z: number): Pt => [
  Math.min(W - 1, Math.max(0, Math.floor((x + ROOM.halfX) / CELL))),
  Math.min(H - 1, Math.max(0, Math.floor((z + ROOM.halfZ) / CELL))),
];

function clear(a: Pt, b: Pt): boolean {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1);
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    if (isBlocked(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false;
  }
  return true;
}

/** Waypoints from start to goal, excluding start. A straight line when nothing is in the way. */
export function findPath(sx: number, sz: number, gx: number, gz: number): Pt[] {
  const goal: Pt = [gx, gz];
  if (clear([sx, sz], goal)) return [goal];

  const [si, sj] = toCell(sx, sz);
  const [gi, gj] = toCell(gx, gz);
  const id = (i: number, j: number) => j * W + i;
  const g = new Map<number, number>([[id(si, sj), 0]]);
  const from = new Map<number, number>();
  const open: [number, number, number][] = [[0, si, sj]];
  const h = (i: number, j: number) => Math.hypot(i - gi, j - gj);
  const walkable = (i: number, j: number) =>
    (i === gi && j === gj) || !isBlocked(...cellCenter(i, j));

  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k][0] < open[best][0]) best = k;
    const [, i, j] = open.splice(best, 1)[0];
    if (i === gi && j === gj) break;
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const ni = i + di;
        const nj = j + dj;
        if ((!di && !dj) || ni < 0 || nj < 0 || ni >= W || nj >= H || !walkable(ni, nj)) continue;
        // no corner cutting past an obstacle
        if (di && dj && (!walkable(i + di, j) || !walkable(i, j + dj))) continue;
        const cost = g.get(id(i, j))! + Math.hypot(di, dj);
        if (cost < (g.get(id(ni, nj)) ?? Infinity)) {
          g.set(id(ni, nj), cost);
          from.set(id(ni, nj), id(i, j));
          open.push([cost + h(ni, nj), ni, nj]);
        }
      }
    }
  }
  if (!from.has(id(gi, gj))) return [goal];

  const cells: Pt[] = [];
  for (let c: number | undefined = id(gi, gj); c !== undefined && c !== id(si, sj); c = from.get(c)) {
    cells.push(cellCenter(c % W, Math.floor(c / W)));
  }
  cells.reverse();

  const out: Pt[] = [];
  let anchor: Pt = [sx, sz];
  let k = 0;
  while (k < cells.length) {
    let far = k;
    for (let m = cells.length - 1; m > k; m--) {
      if (clear(anchor, cells[m])) {
        far = m;
        break;
      }
    }
    anchor = cells[far];
    out.push(anchor);
    k = far + 1;
  }
  out[out.length - 1] = goal;
  return out;
}
