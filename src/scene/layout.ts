import { ENTRY_COUNT } from './constants';
import { clamp, lerp, lipTip, maxArc, smooth, surfaceAt, tubeCenter, WAVE, type SurfacePoint } from './waveProfile';

/**
 * Automatic placement of the project lights.
 *
 * The order of the projects is a short journey into the wave:
 *   1  on the open sea, in front of the wave
 *   2  in the trough, at the mouth of the barrel
 *   3  just inside the mouth, under the lip
 *   4+ in a line down the barrel, one after the other, as deep as needed
 *
 * The first three have fixed places. Every project after that is added to the
 * line inside the barrel; the barrel itself grows longer when the line needs
 * more room (see barrelEndFor), so any number of projects fits.
 *
 * Positions are (x, q): x along the wave, q the surface coordinate from
 * waveProfile.surfaceAt (q < 0 open sea, q > 0 up the inner face).
 */
const ENTRY: [number, number][] = [
  [-5.9, -6.4],
  [-4.85, 0.2],
  [0.3, 3.8],
];
/** The same three places on portrait screens, pulled closer to the wave. */
const ENTRY_NARROW: [number, number][] = [
  [-4.9, -3.9],
  [-4.35, 0.9],
  [1.0, 3.9],
];

if (ENTRY.length !== ENTRY_COUNT || ENTRY_NARROW.length !== ENTRY_COUNT) throw new Error('layout: entry places out of sync');

const BARREL_START = 5.4;
const BARREL_Q = 3.9;
const ENTRY_RADIUS = 0.46;

/** Distance between two lights in the barrel, for a total of n projects. */
function barrelSpacing(n: number): number {
  return clamp(15 / Math.max(n - ENTRY.length, 1), 1.05, 2.3);
}

/** How far the intact barrel has to reach (in x) to hold n projects. */
export function barrelEndFor(n: number): number {
  const inBarrel = Math.max(n - ENTRY.length, 0);
  const last = BARREL_START + Math.max(inBarrel - 1, 0) * barrelSpacing(n);
  return Math.max(WAVE.xClose + 14, last + 5);
}

export interface Placement {
  index: number;
  x: number;
  q: number;
  radius: number;
  /** Distance to the neighbouring light. */
  gap: number;
  /** 0 = on the open sea, 1 = inside the barrel. */
  inside: number;
  surface: SurfacePoint;
  /** Centre of the float. */
  position: [number, number, number];
}

/**
 * Places n lights. Deterministic: the same n always gives the same layout.
 * narrow = portrait screens. Call setBarrelEnd(barrelEndFor(n)) first, so the
 * wave is long enough.
 */
export function layoutFloats(n: number, narrow = false): Placement[] {
  const out: Placement[] = [];
  const entry = narrow ? ENTRY_NARROW : ENTRY;
  const spacing = barrelSpacing(n);
  for (let i = 0; i < n; i++) {
    let x: number;
    let q: number;
    let radius: number;
    if (i < entry.length) {
      [x, q] = entry[i];
      radius = ENTRY_RADIUS;
    } else {
      const k = i - entry.length;
      x = BARREL_START + k * spacing;
      // Slight left-right stagger, so the line reads as lights adrift and not as a row of lamps.
      q = BARREL_Q + (k % 2 === 0 ? -1 : 1) * 0.5 * Math.min(1, spacing / 1.6);
      radius = clamp(spacing * 0.28, 0.3, 0.42);
    }
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
      gap: i < entry.length ? 2.3 : spacing,
      inside: i >= entry.length ? 1 : q > 0 ? smooth(-4, 2, x) : 0,
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
  // With many projects the lights sit closer together; step in, so the view is not full of neighbours.
  const camX = px - clamp(p.gap * 2.4 + 1, 3.6, 6.4);
  const c = tubeCenter(camX);
  const tube: [number, number, number] = [camX, Math.max(c.y * 0.8, py + 1.1), lerp(c.z, pz, 0.35)];
  const w = p.inside;
  return {
    position: [lerp(sea[0], tube[0], w), lerp(sea[1], tube[1], w), lerp(sea[2], tube[2], w)],
    target: [px + w * 0.8, py + lerp(1.0, 0.55, w), pz],
    inside: w > 0.5,
  };
}
