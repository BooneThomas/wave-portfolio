export interface Quality {
  tier: 'high' | 'low';
  /** Upper limit for the device pixel ratio. */
  maxDpr: number;
  /** Mesh density, 1 = full. */
  detail: number;
  /** Noise octaves in the water shader. */
  octaves: number;
  sprayCount: number;
  antialias: boolean;
}

interface NavigatorHints {
  deviceMemory?: number;
}

/** Picks a lighter scene for phones and weak or software-rendered GPUs. */
export function detectQuality(gl: WebGLRenderingContext | WebGL2RenderingContext | null): Quality {
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & NavigatorHints).deviceMemory ?? 8;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  // Firefox reports the real renderer through RENDERER and warns when the debug extension is used.
  let rendererName = gl ? String(gl.getParameter(gl.RENDERER) ?? '') : '';
  if (gl && (!rendererName || /^(webkit|mozilla)/i.test(rendererName))) {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    if (info) rendererName = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '');
  }
  const software = /swiftshader|llvmpipe|software|basic render/i.test(rendererName);
  const forced = new URLSearchParams(window.location.search).get('quality');
  const low = forced ? forced === 'low' : software || cores < 4 || memory < 4 || (coarse && cores < 8);
  return low
    ? // Phones have few pixels to fill and dense screens, so they keep a sharper image than weak laptops.
      { tier: 'low', maxDpr: coarse && !software ? 2 : 1.25, detail: 0.6, octaves: 2, sprayCount: 420, antialias: false }
    : { tier: 'high', maxDpr: 2, detail: 1, octaves: 3, sprayCount: 1300, antialias: true };
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
