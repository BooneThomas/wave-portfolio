/**
 * The shape of the wave, as pure math (no Three.js), so the same functions
 * drive the mesh, the placement of the project lights and the camera.
 *
 * Coordinates: x runs along the crest line (the barrel axis), y is up,
 * the wave travels towards +z. The open sea in front of the wave is z > 0.
 *
 * A cross-section (a "slice" at a given x) is one continuous curve:
 *   front sea -> trough -> face -> roof -> lip tip -> back of the lip -> crest -> back slope -> sea behind
 * The inner part is a master curve defined by its tangent angle phi; a slice at
 * break progress t simply uses more or less of that curve. So along x the lip
 * "grows out" of the swell, the way a peeling wave does.
 */

export const PI = Math.PI;
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** World-space dimensions of the wave. */
export const WAVE = {
  /** Crest height where the wave is fully curled. */
  height: 7,
  /** Lip touches the sea at this x. Left of it the barrel is open. */
  xClose: 7,
  /** Start of the unbroken shoulder. */
  xOpen: -30,
  /** Extent of the sea plane. */
  far: 420,
};

/** Break progress along the crest line: 0 = unbroken swell, 1 = lip has landed. */
export function breakAt(x: number): number {
  return smooth(WAVE.xOpen, WAVE.xClose, x);
}

/** How far the barrel has collapsed into whitewater: 0 = intact tube, 1 = foam pile. */
export function collapseAt(x: number): number {
  return smooth(WAVE.xClose + 5, WAVE.xClose + 22, x);
}

/** Cheap deterministic 1D noise, used for small irregularities along the crest. */
function wobble(x: number): number {
  return Math.sin(x * 0.61 + 1.3) * 0.5 + Math.sin(x * 1.37 + 4.1) * 0.3 + Math.sin(x * 2.9) * 0.2;
}

/** Radius of curvature of the inner face (in units of wave height) at tangent angle phi. */
function radiusAt(phi: number): number {
  if (phi < PI / 2) return lerp(2.7, 0.56, Math.pow(smooth(0, PI / 2, phi), 0.85));
  if (phi < PI) return lerp(0.56, 0.47, smooth(PI / 2, PI, phi));
  return lerp(0.47, 1.9, Math.pow(clamp((phi - PI) / (PI / 2), 0, 1), 1.5));
}

interface Master {
  n: number;
  w: Float32Array; // monotonic sampling parameter
  z: Float32Array;
  y: Float32Array;
  s: Float32Array; // arc length
  phi: Float32Array;
  wTotal: number;
  wSwell: number; // parameter where the unbroken swell ends
}

const PHI_SWELL = 0.13 * PI;
const PHI_END = 1.46 * PI;

function buildMaster(): Master {
  const w: number[] = [0];
  const z: number[] = [0];
  const y: number[] = [0];
  const s: number[] = [0];
  const ph: number[] = [0];
  const dPhi = 0.004;
  let phi = 0;
  let cz = 0;
  let cy = 0;
  let cs = 0;
  let cw = 0;
  let wSwell = 0;
  // Height of the early (trough) part of the curve at a given z, to detect where the lip lands.
  const troughY = (zz: number) => {
    if (zz >= 0) return 0;
    for (let i = 1; i < z.length; i++) {
      if (ph[i] > PI / 2) break;
      if (z[i] <= zz) {
        const f = (zz - z[i - 1]) / (z[i] - z[i - 1] || 1);
        return lerp(y[i - 1], y[i], f);
      }
    }
    return 1e9;
  };
  const push = (ds: number, dp: number) => {
    cs += ds;
    cw += ds * 0.45 + dp * 0.55;
    w.push(cw);
    z.push(cz);
    y.push(cy);
    s.push(cs);
    ph.push(phi);
  };
  while (phi < PHI_END) {
    const r = radiusAt(phi + dPhi / 2);
    const ds = r * dPhi;
    const mid = phi + dPhi / 2;
    cz -= Math.cos(mid) * ds;
    cy += Math.sin(mid) * ds;
    phi += dPhi;
    push(ds, dPhi);
    if (wSwell === 0 && phi >= PHI_SWELL) wSwell = cw;
  }
  // The curtain: the lip keeps falling in a straight line until it meets the water.
  const ds = 0.006;
  let guard = 0;
  while (cy > troughY(cz) + 0.012 && guard++ < 2000) {
    cz -= Math.cos(phi) * ds;
    cy += Math.sin(phi) * ds;
    push(ds, 0);
  }
  // Normalise so the roof of the tube sits at 0.9 (the crest adds the rest).
  let top = 0;
  for (const v of y) top = Math.max(top, v);
  const k = 0.9 / top;
  const n = w.length;
  const scale = (a: number[]) => Float32Array.from(a, (v) => v * k);
  return {
    n,
    w: Float32Array.from(w),
    z: scale(z),
    y: scale(y),
    s: scale(s),
    phi: Float32Array.from(ph),
    wTotal: cw,
    wSwell,
  };
}

const master = buildMaster();
const RK = (() => {
  // Same normalisation factor, needed to scale radiusAt() for the outer surface.
  let i = 1;
  while (master.phi[i] < 0.5) i++;
  let raw = 0;
  let phi = 0;
  const dPhi = 0.004;
  for (let j = 0; j < i; j++) {
    raw += radiusAt(phi + dPhi / 2) * dPhi;
    phi += dPhi;
  }
  return master.s[i] / raw;
})();

function masterIndex(arr: Float32Array, v: number): number {
  let lo = 0;
  let hi = master.n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (arr[m] <= v) lo = m;
    else hi = m;
  }
  return lo;
}

function sampleMaster(arr: Float32Array, v: number) {
  const i = masterIndex(arr, v);
  const j = Math.min(i + 1, master.n - 1);
  const f = clamp((v - arr[i]) / (arr[j] - arr[i] || 1), 0, 1);
  return {
    z: lerp(master.z[i], master.z[j], f),
    y: lerp(master.y[i], master.y[j], f),
    s: lerp(master.s[i], master.s[j], f),
    phi: lerp(master.phi[i], master.phi[j], f),
  };
}

/** Shape parameters of the slice at x. */
export function sliceParams(x: number) {
  const t = breakAt(x);
  const c = collapseAt(x);
  const irregular = wobble(x);
  // Overall size: the shoulder is lower, the collapsed section sinks into foam.
  const g = WAVE.height * lerp(0.72, 1, smooth(0, 0.7, t)) * lerp(1, 0.5, c) * (1 + irregular * 0.018);
  const tt = clamp(t + irregular * 0.012 * smooth(0.2, 0.6, t) * (1 - smooth(0.9, 1, t)), 0, 1);
  const wMax = lerp(master.wSwell, master.wTotal, tt);
  return { t, c, g, wMax };
}

export interface ProfilePoint {
  z: number;
  y: number;
  /** Flow coordinate: arc length from the trough, negative on the front sea. */
  s: number;
  /** 0..1: how thin the water is here (light shines through). */
  thin: number;
  /** 0..1: how enclosed this point is by the barrel (less sky light). */
  occ: number;
  /** 0..1: foam. */
  foam: number;
}

export interface SliceCounts {
  front: number;
  inner: number;
  outer: number;
  back: number;
}

/** Builds the full cross-section at x, from the far front sea to the far sea behind. */
export function buildSlice(x: number, counts: SliceCounts): ProfilePoint[] {
  const { t, c, g, wMax } = sliceParams(x);
  const pts: ProfilePoint[] = [];
  const tip = sampleMaster(master.w, wMax);
  const phiMax = tip.phi;
  const pitched = smooth(0.55 * PI, 1.0 * PI, phiMax);
  const closure = smooth(1.05 * PI, PHI_END, phiMax) * smooth(0.8, 1, t);
  const lipFoam = smooth(0.7 * PI, 1.15 * PI, phiMax);
  const tipZ = tip.z * g;
  const tipY = tip.y * g;
  const tipS = tip.s * g;

  // Front sea, far to near, denser towards the wave.
  for (let j = counts.front; j >= 1; j--) {
    const f = j / counts.front;
    const d = WAVE.far * (Math.exp(f * 5.2) - 1) / (Math.exp(5.2) - 1);
    // Foam where the lip lands, and a wash of whitewater in front of the collapsed section.
    const dz = d - tipZ;
    const impact = closure * Math.exp(-(dz * dz) / (0.5 + 2.5 * c));
    const wash = c * smooth(g * 1.6, 0, d);
    pts.push({ z: d, y: 0, s: -d, thin: 0, occ: 0, foam: clamp(impact + wash, 0, 1) });
  }

  // Inner curve: trough, face, roof, lip.
  for (let j = 0; j < counts.inner; j++) {
    const p = sampleMaster(master.w, (wMax * j) / (counts.inner - 1));
    const dTip = tipS - p.s * g;
    const thin = pitched * (0.3 * smooth(0.35 * PI, 0.9 * PI, p.phi) + 0.7 * Math.exp(-dTip / (0.45 * g)));
    const occ = Math.max(pitched * smooth(0.2 * PI, 0.8 * PI, p.phi) * 0.9, closure * 0.75);
    const dzI = p.z * g - tipZ;
    const impact = closure * Math.exp(-(dzI * dzI) / 0.5) * smooth(0.3 * PI, 0, p.phi);
    const foam = lipFoam * Math.exp(-dTip / (0.045 * g)) + impact + c * smooth(0.1, 1.0, p.phi / PI) * 0.8;
    pts.push({ z: p.z * g, y: p.y * g, s: p.s * g, thin, occ, foam: clamp(foam, 0, 1) });
  }

  // Outer surface: round the tip, run back along the lip, over the crest, down the back.
  const beta = lerp(0.2, 0.44, smooth(0, 0.6, t));
  const rTip = g * lerp(1.15, 0.03, smooth(0.2 * PI, 0.95 * PI, phiMax));
  // Length of the straight falling part of the lip at this slice.
  const curtainUsed = g * Math.max(0, tip.s - sampleMaster(master.phi, PHI_END - 1e-4).s);
  const fine: { z: number; y: number; s: number; m: number; phi: number; turned: number }[] = [];
  let z = tipZ;
  let y = tipY;
  let s = tipS;
  let m = 0;
  let phi = phiMax;
  let turned = 0;
  const step = (ds: number, dp: number) => {
    const mid = phi - dp / 2;
    z -= Math.cos(mid) * ds;
    y += Math.sin(mid) * ds;
    phi -= dp;
    turned += dp;
    s += ds;
    m += ds / g + dp * 0.5;
    fine.push({ z, y, s, m, phi, turned });
  };
  const dp = 0.03;
  let straightDone = curtainUsed <= 0;
  while (phi > -beta + 1e-6) {
    if (!straightDone && turned >= PI) {
      // Back of the curtain, parallel to the falling lip.
      const nSeg = 8;
      for (let i = 0; i < nSeg; i++) step(curtainUsed / nSeg, 0);
      straightDone = true;
    }
    const d = Math.min(dp, phi + beta);
    const thick = g * (0.012 + 0.1 * smooth(0.5 * PI, 0, phi));
    const rOuter = phi > 0 ? radiusAt(phi + PI) * RK * g + thick : g * 0.95;
    const r = lerp(rTip, rOuter, smooth(0.72 * PI, 1.0 * PI, turned));
    step(r * d, d);
  }
  // Back slope: a straight run, then flatten out exactly at sea level.
  let rFlat = g * 1.9;
  const drop = 1 - Math.cos(beta);
  if (y < rFlat * drop) rFlat = Math.max(y, 0) / drop;
  const straight = Math.max(0, (y - rFlat * drop) / Math.sin(beta));
  for (let i = 0; i < 6; i++) step(straight / 6, 0);
  const nFlat = 10;
  for (let i = 0; i < nFlat; i++) step(rFlat * (beta / nFlat), beta / nFlat);
  const mTotal = fine[fine.length - 1].m;
  let fi = 0;
  for (let j = 1; j <= counts.outer; j++) {
    const target = (mTotal * j) / counts.outer;
    while (fi < fine.length - 2 && fine[fi + 1].m < target) fi++;
    const a = fine[fi];
    const b = fine[Math.min(fi + 1, fine.length - 1)];
    const f = clamp((target - a.m) / (b.m - a.m || 1), 0, 1);
    const pz = lerp(a.z, b.z, f);
    const py = j === counts.outer ? 0 : lerp(a.y, b.y, f);
    const ps = lerp(a.s, b.s, f);
    const pPhi = lerp(a.phi, b.phi, f);
    const thin = pitched * smooth(-0.4, 0.3, pPhi) * (0.25 + 0.75 * Math.exp(-(ps - tipS) / (0.45 * g)));
    const foam =
      lipFoam * Math.exp(-(ps - tipS) / (0.09 * g)) +
      pitched * 0.2 * smooth(0.1 * PI, 0.5 * PI, pPhi) +
      c * 0.85 * smooth(-beta, 0.3, pPhi);
    pts.push({ z: pz, y: py, s: ps, thin: clamp(thin, 0, 1), occ: 0, foam: clamp(foam, 0, 1) });
  }

  // Sea behind the wave.
  const last = pts[pts.length - 1];
  for (let j = 1; j <= counts.back; j++) {
    const f = j / counts.back;
    const d = WAVE.far * (Math.exp(f * 4) - 1) / (Math.exp(4) - 1);
    pts.push({ z: last.z - d, y: 0, s: last.s + d, thin: 0, occ: 0, foam: 0 });
  }
  return pts;
}

export interface SurfacePoint {
  x: number;
  y: number;
  z: number;
  /** Unit normal pointing into the air. */
  nx: number;
  ny: number;
  nz: number;
}

/** Longest arc coordinate q that still lies on the inner face at x (trough to lip tip). */
export function maxArc(x: number): number {
  const { g, wMax } = sliceParams(x);
  return sampleMaster(master.w, wMax).s * g;
}

/**
 * A point on the water surface.
 * q < 0: on the open sea, |q| units in front of the trough.
 * q >= 0: q units of arc up the inner face of the wave.
 */
export function surfaceAt(x: number, q: number): SurfacePoint {
  if (q <= 0) return { x, y: 0, z: -q, nx: 0, ny: 1, nz: 0 };
  const { g } = sliceParams(x);
  const p = sampleMaster(master.s, Math.min(q, maxArc(x)) / g);
  return { x, y: p.y * g, z: p.z * g, nx: 0, ny: Math.cos(p.phi), nz: Math.sin(p.phi) };
}

/** Where the falling lip meets the water at x (only meaningful once the barrel is closed). */
export function lipTip(x: number) {
  const { g, wMax } = sliceParams(x);
  const p = sampleMaster(master.w, wMax);
  return { z: p.z * g, y: p.y * g, phi: p.phi };
}

/** Rough centre of the air inside the barrel at x. */
export function tubeCenter(x: number) {
  const { g } = sliceParams(x);
  const face = sampleMaster(master.phi, PI / 2);
  const roof = sampleMaster(master.phi, PI);
  const tip = lipTip(x);
  const front = Math.max(tip.z, roof.z * g);
  return { z: lerp(face.z * g, front, 0.5), y: roof.y * g * 0.5 };
}
