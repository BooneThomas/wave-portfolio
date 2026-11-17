/**
 * GLSL for the scene. Colours are written in linear light and converted
 * once, in finish(). See DESIGN.md for the palette these numbers come from.
 */

export const COMMON = /* glsl */ `
uniform vec3 uSunDir;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < OCTAVES; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}

// First light: a cold indigo sky with one warm band where the sun comes up.
vec3 skyColor(vec3 d) {
  float y = max(d.y, 0.0);
  vec2 az = normalize(d.xz + vec2(1e-5));
  vec2 sunAz = normalize(uSunDir.xz);
  float toward = dot(az, sunAz) * 0.5 + 0.5;
  float warm = pow(toward, 5.0);
  vec3 horizon = mix(vec3(0.030, 0.055, 0.105), vec3(0.95, 0.36, 0.13), warm);
  vec3 middle = mix(vec3(0.012, 0.026, 0.070), vec3(0.105, 0.048, 0.105), warm);
  vec3 top = vec3(0.004, 0.010, 0.034);
  vec3 c = mix(horizon, middle, smoothstep(0.0, 0.15, y));
  c = mix(c, top, smoothstep(0.06, 0.6, y));
  float sd = max(dot(normalize(d), uSunDir), 0.0);
  c += vec3(1.0, 0.50, 0.20) * (pow(sd, 22.0) * 0.32 + pow(sd, 160.0) * 0.7);
  c += vec3(1.0, 0.80, 0.52) * (smoothstep(0.99988, 0.99997, sd) * 5.0 + pow(sd, 1400.0) * 0.9);
  return c;
}

vec3 finish(vec3 c) {
  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
  // A little dither keeps the sky gradient from banding.
  c += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
  return c;
}
`;

export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
  gl_Position = p.xyww;
}
`;

export const SKY_FRAG = /* glsl */ `
${COMMON}
varying vec3 vDir;
uniform float uTime;
void main() {
  vec3 d = normalize(vDir);
  vec3 c = skyColor(d);
  float y = d.y;
  // Thin cloud bands low over the horizon, lit from below.
  float a = atan(d.z, d.x);
  float n = fbm(vec2(a * 5.0 + uTime * 0.004, y * 34.0 + a * 1.5));
  float band = smoothstep(0.52, 0.78, n) * smoothstep(0.015, 0.06, y) * smoothstep(0.34, 0.1, y);
  float toward = pow(max(dot(normalize(d.xz), normalize(uSunDir.xz)), 0.0), 3.0);
  vec3 cloud = mix(vec3(0.05, 0.07, 0.14), vec3(1.0, 0.45, 0.30), toward * smoothstep(0.3, 0.02, y));
  c = mix(c, cloud, band * 0.55);
  // The last stars.
  vec2 g = vec2(a * 90.0, y * 140.0);
  float star = step(0.9965, hash21(floor(g))) * smoothstep(0.25, 0.6, y);
  c += vec3(0.7, 0.8, 1.0) * star * 0.5 * (1.0 - toward);
  gl_FragColor = vec4(finish(c), 1.0);
}
`;

export const WATER_VERT = /* glsl */ `
attribute float aS;
attribute vec4 aData;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vN;
varying float vS;
varying vec4 vData;
void main() {
  vec3 p = position;
  // A slow breathing of the surface; small enough that the lights stay seated.
  float w = sin(p.x * 0.21 + uTime * 0.55 + aS * 0.16) * 0.6
          + sin(p.x * 0.47 - uTime * 0.38 + aS * 0.31) * 0.4;
  p += normal * w * 0.055;
  vWorld = p;
  vN = normal;
  vS = aS;
  vData = aData;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}
`;

export const WATER_FRAG = /* glsl */ `
${COMMON}
uniform float uTime;
uniform float uHeight;
varying vec3 vWorld;
varying vec3 vN;
varying float vS;
varying vec4 vData;

const vec3 DEEP = vec3(0.004, 0.030, 0.052);
const vec3 MID = vec3(0.010, 0.105, 0.135);
const vec3 GLASS = vec3(0.022, 0.215, 0.195);
const vec3 GLASS_HOT = vec3(0.42, 0.62, 0.30);
const vec3 MIST = vec3(0.020, 0.075, 0.095);

void main() {
  vec3 toCam = cameraPosition - vWorld;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float thin = vData.x;
  float occ = vData.y;
  float foamAttr = vData.z;

  // Water runs up the face and over the lip: one flow direction for the whole sheet.
  float flow = uTime * 1.5;
  vec2 fc = vec2(vWorld.x, vS - flow);
  float lod = exp(-dist * 0.02);
  float steep = smoothstep(0.15, 0.9, 1.0 - N.y);
  vec2 sc = mix(vec2(0.62, 0.62), vec2(1.25, 0.2), steep);
  float e = 0.14;
  float h0 = fbm(fc * sc);
  float hx = fbm((fc + vec2(e, 0.0)) * sc);
  float hs = fbm((fc + vec2(0.0, e)) * sc);
  vec3 T = normalize(vec3(1.0, 0.0, 0.0) - N * N.x);
  vec3 B = cross(N, T);
  float bump = mix(0.75, 0.4, steep) * lod;
  N = normalize(N - (T * (hx - h0) + B * (hs - h0)) / e * bump);

  float ndv = max(dot(N, V), 0.0);
  float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 refl = skyColor(R);
  // Inside the barrel the water mirrors more water, not the sky.
  refl = mix(refl, MID * 0.7, occ * 0.92);

  // Body colour: dark in the trough, sea-glass green where the wall is thin and backlit.
  float hN = clamp(vWorld.y / uHeight, 0.0, 1.2);
  float back = pow(max(dot(-V, uSunDir), 0.0), 2.0);
  vec3 body = mix(DEEP, MID, smoothstep(0.0, 0.75, hN) * 0.85 + steep * 0.1);
  float glow = thin * (0.5 + 0.8 * back) + smoothstep(0.25, 1.0, hN) * steep * 0.22;
  body = mix(body, GLASS, clamp(glow, 0.0, 1.0));
  body += GLASS_HOT * pow(thin, 3.0) * (0.08 + 0.55 * back) * (0.6 + 0.4 * h0);
  body *= mix(1.0, 0.62, occ * (1.0 - thin));

  vec3 col = mix(body, refl, fres * mix(1.0, 0.5, occ));

  // Sun glints.
  float spec = pow(max(dot(R, uSunDir), 0.0), 220.0);
  col += vec3(1.0, 0.70, 0.42) * spec * 5.0 * (1.0 - occ) * (0.35 + 0.65 * lod);

  // Foam: on the lip, where it lands, and in the whitewater. Veins of old foam on the face.
  float fn = fbm(vec2(vWorld.x * 1.5, (vS - flow) * mix(0.9, 0.3, steep)));
  float foam = smoothstep(1.0 - foamAttr * 0.9, 1.2 - foamAttr * 0.9, fn + 0.18) * smoothstep(0.03, 0.2, foamAttr);
  float veins = smoothstep(0.6, 0.78, fbm(vec2(vWorld.x * 2.3 + 40.0, (vS - flow) * 0.16))) * steep * 0.22;
  foam = clamp(foam + veins * (1.0 - occ * 0.4), 0.0, 1.0);
  float lit = smoothstep(-0.05, 0.6, dot(N, uSunDir));
  float amb = mix(0.5, 1.0, N.y * 0.5 + 0.5);
  vec3 foamCol = mix(vec3(0.13, 0.20, 0.29) * amb, vec3(0.95, 0.62, 0.42), lit);
  foamCol *= mix(1.0, 0.5, occ) * (0.8 + 0.4 * fn);
  foamCol += vec3(1.0, 0.62, 0.34) * back * thin * 0.22;
  col = mix(col, foamCol, foam * 0.9);

  // Distance haze towards the horizon; dark mist down the barrel.
  float fog = 1.0 - exp(-pow(dist * 0.0085, 1.5));
  vec3 fogCol = skyColor(normalize(vec3(-V.x, 0.012, -V.z)));
  col = mix(col, fogCol, fog * (1.0 - occ));
  col = mix(col, MIST, occ * (1.0 - exp(-dist * 0.045)) * 0.92);

  gl_FragColor = vec4(finish(col), 1.0);
}
`;

export const SPRAY_VERT = /* glsl */ `
attribute vec4 aSeed;   // x: phase, y: size, z: kind (0 spindrift, 1 impact mist), w: random
attribute vec3 aVel;
uniform float uTime;
uniform float uScale;
varying float vAlpha;
varying float vKind;
void main() {
  float life = mix(2.6, 3.6, aSeed.w);
  float age = fract(uTime / life + aSeed.x);
  vec3 p = position + aVel * age * life;
  // Spindrift keeps rising on the wind; impact mist falls back.
  p.y -= mix(0.25, 1.1, aSeed.z) * age * age * life * life * 0.5;
  p.y = max(p.y, 0.05);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float grow = mix(0.5, 1.6, age);
  gl_PointSize = min(aSeed.y * grow * uScale / max(-mv.z, 0.5), uScale * 0.05);
  vAlpha = sin(age * 3.14159) * mix(0.12, 0.08, aSeed.z) * exp(mv.z * 0.012) * smoothstep(2.0, 9.0, -mv.z);
  vKind = aSeed.z;
}
`;

export const SPRAY_FRAG = /* glsl */ `
${COMMON}
varying float vAlpha;
varying float vKind;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c) * 4.0;
  float a = smoothstep(1.0, 0.0, d);
  vec3 col = mix(vec3(1.0, 0.74, 0.52), vec3(0.72, 0.80, 0.86), vKind * 0.7);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), a * a * vAlpha);
}
`;

export const FLOAT_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

// A glass fishing float with a light inside.
export const FLOAT_FRAG = /* glsl */ `
${COMMON}
uniform float uGlow;
uniform float uCap;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(vN);
  float ndv = max(dot(N, V), 0.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 glass = vec3(0.004, 0.045, 0.045);
  vec3 ember = vec3(1.0, 0.36, 0.07);
  float core = pow(ndv, 4.5);
  vec3 col = glass + skyColor(R) * fres * 1.1;
  col += ember * (core * 1.0 + 0.02) * uGlow;
  col += vec3(1.0, 0.75, 0.4) * pow(ndv, 14.0) * 0.5 * uGlow;
  col += vec3(1.0, 0.85, 0.7) * pow(max(dot(R, uSunDir), 0.0), 50.0) * 1.4;
  // Dark seal on top of the float.
  col = mix(col, vec3(0.015, 0.03, 0.035) + skyColor(R) * fres * 0.25, uCap);
  gl_FragColor = vec4(finish(col), 1.0);
}
`;
