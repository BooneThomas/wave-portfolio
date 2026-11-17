import { BufferGeometry, Float32BufferAttribute } from 'three';
import { buildSlice, sliceParams, WAVE, type SliceCounts } from './waveProfile';

/** x positions of the cross-sections: dense around the barrel, sparse towards the horizon. */
function sliceXs(detail: number, near: number): number[] {
  const xs: number[] = [];
  const step = 0.34 / detail;
  const outer = 14;
  for (let i = outer; i >= 1; i--) {
    const f = i / outer;
    xs.push(-near - (WAVE.far - near) * (Math.exp(f * 4) - 1) / (Math.exp(4) - 1));
  }
  for (let x = -near; x <= near + 1e-6; x += step) xs.push(x);
  for (let i = 1; i <= outer; i++) {
    const f = i / outer;
    xs.push(near + (WAVE.far - near) * (Math.exp(f * 4) - 1) / (Math.exp(4) - 1));
  }
  return xs;
}

/**
 * Builds the sea and the wave as one continuous sheet.
 * detail 1 = full quality; lower values give a lighter mesh for weak devices
 * and for the invisible proxy used in occlusion tests.
 */
export function buildWaveGeometry(detail: number): BufferGeometry {
  const counts: SliceCounts = {
    front: Math.round(22 * Math.max(detail, 0.5)),
    inner: Math.round(76 * detail),
    outer: Math.round(60 * detail),
    back: 6,
  };
  const xs = sliceXs(detail, Math.max(36, WAVE.barrelEnd + 22));
  const cols = counts.front + counts.inner + counts.outer + counts.back;
  const rows = xs.length;
  const position = new Float32Array(rows * cols * 3);
  const flow = new Float32Array(rows * cols);
  const data = new Float32Array(rows * cols * 4);

  for (let i = 0; i < rows; i++) {
    const x = xs[i];
    const pts = buildSlice(x, counts);
    const { t } = sliceParams(x);
    for (let j = 0; j < cols; j++) {
      const p = pts[j];
      const k = i * cols + j;
      position[k * 3] = x;
      position[k * 3 + 1] = p.y;
      position[k * 3 + 2] = p.z;
      flow[k] = p.s;
      data[k * 4] = p.thin;
      data[k * 4 + 1] = p.occ;
      data[k * 4 + 2] = p.foam;
      data[k * 4 + 3] = t;
    }
  }

  const index: number[] = [];
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      // Winding chosen so the normal points into the air (up on the flat sea).
      index.push(a, c, b, b, c, d);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(position, 3));
  geo.setAttribute('aS', new Float32BufferAttribute(flow, 1));
  geo.setAttribute('aData', new Float32BufferAttribute(data, 4));
  geo.setIndex(index);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
