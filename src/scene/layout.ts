import { clamp, lerp, lipTip, maxArc, smooth, surfaceAt, tubeCenter, WAVE, type SurfacePoint } from './waveProfile';

/**
 * Automatic placement of the project lights.
 *
 * The lights follow one path over the water: it starts on the open sea, swings
 * round in front of the wave, slips into the trough at the mouth of the barrel
 * and ends deep inside it. N lights are spread evenly along that path, so any
 * number of projects fits: more projects means smaller lights, closer together.
 *
 * Path points are (x, q): x along the wave, q the surface coordinate from
 * waveProfile.surfaceAt (q < 0 open sea, q > 0 up the inner face).
 */
const PATH: [number, number][] = [
  [10.5, -8.2],
  [4.5, -9.2],
  [-2.0, -7.6],
  [-6.2, -4.0],
  [-5.6, 0.4],
  [-1.6, 2.9],
  [3.0, 3.7],
  [6.8, 4.2],
  [10.2, 4.5],
];

export interface Placement {
  index: number;
  x: number;
  q: number;
  radius: number;
  /** 0 = on the open sea, 1 = inside the barrel. */
  inside: number;
  surface: SurfacePoint;
  /** Centre of the float. */
  position: [number, number, number];
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

type PathPoint = { x: number; q: number; d: number };

/** spread < 1 pulls the open-sea part of the path towards the wave (used on portrait screens). */
function samplePath(spread: number): PathPoint[] {
  const out: PathPoint[] = [];
  const n = PATH.length;
  const pts = PATH.map(([x, q]) => [x, q < 0 ? q * spread : q] as [number, number]);
  let d = 0;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, n - 1)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24;
      const x = catmull(p0[0], p1[0], p2[0], p3[0], t);
      const q = catmull(p0[1], p1[1], p2[1], p3[1], t);
      if (out.length) {
        const prev = out[out.length - 1];
        d += Math.hypot(x - prev.x, q - prev.q);
      }
      out.push({ x, q, d });
    }
  }
  const last = pts[n - 1];
  const prev = out[out.length - 1];
  out.push({ x: last[0], q: last[1], d: d + Math.hypot(last[0] - prev.x, last[1] - prev.q) });
  return out;
}

const paths = new Map<number, PathPoint[]>();
function getPath(spread: number): PathPoint[] {
  let p = paths.get(spread);
  if (!p) paths.set(spread, (p = samplePath(spread)));
  return p;
}

function pathAt(path: PathPoint[], d: number) {
  let i = 0;
  while (i < path.length - 2 && path[i + 1].d < d) i++;
  const a = path[i];
  const b = path[i + 1];
  const f = clamp((d - a.d) / (b.d - a.d || 1), 0, 1);
  const tx = b.x - a.x;
  const tq = b.q - a.q;
  const len = Math.hypot(tx, tq) || 1;
  return { x: lerp(a.x, b.x, f), q: lerp(a.q, b.q, f), nx: -tq / len, nq: tx / len };
}

/** Places n lights. Deterministic: the same n always gives the same layout. */
export function layoutFloats(n: number, spread = 1): Placement[] {
  if (n <= 0) return [];
  const path = getPath(spread);
  const spacing = path[path.length - 1].d / n;
  const radius = clamp(spacing * 0.17, 0.19, 0.46);
  const out: Placement[] = [];
  for (let i = 0; i < n; i++) {
    const p = pathAt(path, (i + 0.5) * spacing);
    // Alternate left and right of the path so the lights read as scattered, not as a queue.
    const onFace = smooth(-0.5, 1.5, p.q);
    const amp = Math.min(spacing * 0.3, lerp(1.2 * spread, 0.45, onFace));
    const side = (i % 2 === 0 ? 1 : -1) * amp * (n > 2 ? 1 : 0);
    const x = p.x + p.nx * side;
    let q = p.q + p.nq * side;
    // Keep lights off the waterline of the falling lip and off the steep part of the face.
    if (q > 0) {
      const closed = smooth(WAVE.xClose - 6, WAVE.xClose, x);
      const landing = -lipTip(x).z;
      const minQ = lerp(0.2, landing + radius + 0.9, closed);
      q = clamp(q, minQ, Math.min(6.2, maxArc(x) * 0.4));
    }
    const s = surfaceAt(x, q);
    const lift = radius * 0.62;
    out.push({
      index: i,
      x,
      q,
      radius,
      inside: q > 0 ? smooth(-4, 2, x) : 0,
      surface: s,
      position: [s.x + s.nx * lift, s.y + s.ny * lift, s.z + s.nz * lift],
    });
  }
  return out;
}

export interface ViewPose {
  position: [number, number, number];
  target: [number, number, number];
  inside: boolean;
}

/** Camera pose for looking at one light: from the open sea, or from within the barrel. */
export function viewFor(p: Placement): ViewPose {
  const [px, py, pz] = p.position;
  const k = 0.75 + p.radius;
  const sea: [number, number, number] = [px - 5.4 * k, py + 1.25 * k, pz + 5.0 * k];
  const camX = px - 6.4;
  const c = tubeCenter(camX);
  const tube: [number, number, number] = [camX, Math.max(c.y * 0.8, py + 1.1), lerp(c.z, pz, 0.35)];
  const w = p.inside;
  return {
    position: [lerp(sea[0], tube[0], w), lerp(sea[1], tube[1], w), lerp(sea[2], tube[2], w)],
    target: [px + w * 0.8, py + lerp(1.0, 0.55, w), pz],
    inside: w > 0.5,
  };
}
