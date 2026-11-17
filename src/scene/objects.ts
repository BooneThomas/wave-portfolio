import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  type IUniform,
} from 'three';
import type { Placement } from './layout';
import { FLOAT_FRAG, FLOAT_VERT, SKY_FRAG, SKY_VERT, SPRAY_FRAG, SPRAY_VERT } from './shaders';
import { breakAt, buildSlice, lerp, lipTip, WAVE } from './waveProfile';

export type Uniforms = Record<string, IUniform>;

export function createSky(shared: Uniforms, octaves: number): Mesh {
  const mat = new ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: shared,
    defines: { OCTAVES: octaves },
    side: BackSide,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new Mesh(new IcosahedronGeometry(1, 3), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Spindrift blown back off the lip, and mist where the lip lands. Animated entirely on the GPU. */
export function createSpray(shared: Uniforms, count: number): Points {
  const r = rand(7);
  const position = new Float32Array(count * 3);
  const velocity = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  // Crest line (highest point of each cross-section), sampled once.
  const crest = new Map<number, { z: number; y: number }>();
  const crestAt = (x: number) => {
    const key = Math.round(x * 2) / 2;
    let c = crest.get(key);
    if (!c) {
      let best = { z: 0, y: 0 };
      for (const p of buildSlice(key, { front: 1, inner: 30, outer: 40, back: 1 })) if (p.y > best.y) best = p;
      c = { z: best.z, y: best.y };
      crest.set(key, c);
    }
    return c;
  };
  for (let i = 0; i < count; i++) {
    const impact = r() < 0.38;
    if (impact) {
      const x = lerp(WAVE.xClose - 3, WAVE.xClose + 26, Math.pow(r(), 0.8));
      const tip = lipTip(x);
      position.set([x, 0.15 + r() * 0.5, tip.z + (r() - 0.3) * 1.2], i * 3);
      velocity.set([(r() - 0.5) * 0.8, 0.9 + r() * 1.5, 0.5 + r() * 1.4], i * 3);
    } else {
      const x = lerp(-9, WAVE.xClose + 26, r());
      const c = crestAt(x);
      const strength = 0.35 + 0.65 * breakAt(x);
      position.set([x, c.y - r() * 0.25, c.z + (r() - 0.5) * 0.8], i * 3);
      velocity.set([(r() - 0.6) * 0.9, (0.5 + r() * 0.9) * strength, -(1.6 + r() * 2.2) * strength], i * 3);
    }
    seed.set([r(), lerp(0.6, 1.8, r()) * (impact ? 2 : 1), impact ? 1 : 0, r()], i * 4);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(position, 3));
  geo.setAttribute('aVel', new Float32BufferAttribute(velocity, 3));
  geo.setAttribute('aSeed', new Float32BufferAttribute(seed, 4));
  const mat = new ShaderMaterial({
    vertexShader: SPRAY_VERT,
    fragmentShader: SPRAY_FRAG,
    uniforms: { ...shared, uScale: { value: 300 } },
    defines: { OCTAVES: 1 },
    transparent: true,
    depthWrite: false,
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 5;
  return points;
}

let glowTexture: CanvasTexture | null = null;
function getGlowTexture(): CanvasTexture {
  if (glowTexture) return glowTexture;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new CanvasTexture(c);
  return glowTexture;
}

const EMBER = 0xff7a1f;
const sphereGeo = new SphereGeometry(1, 28, 20);
const capGeo = new SphereGeometry(1, 12, 8);
const poolGeo = new PlaneGeometry(1, 1);
const hitMaterial = new MeshBasicMaterial({ visible: false });

/** One project: a glass float with a warm light inside, riding on the water. */
export class FloatLight {
  readonly id: string;
  readonly group = new Group();
  readonly hit: Mesh;
  readonly center = new Vector3();
  readonly placement: Placement;
  /** 0..1, eased towards 1 when hovered, focused or selected. */
  emphasis = 0;
  emphasisTarget = 0;
  private readonly base = new Vector3();
  private readonly normal = new Vector3();
  private readonly glass: ShaderMaterial;
  private readonly halo: Sprite;
  private readonly pool: Mesh;
  private readonly phase: number;

  constructor(id: string, placement: Placement, shared: Uniforms) {
    this.id = id;
    this.placement = placement;
    this.phase = placement.index * 1.7;
    const r = placement.radius;
    const s = placement.surface;
    this.normal.set(s.nx, s.ny, s.nz);
    this.base.set(...placement.position);
    this.center.copy(this.base);

    this.glass = new ShaderMaterial({
      vertexShader: FLOAT_VERT,
      fragmentShader: FLOAT_FRAG,
      uniforms: { ...shared, uGlow: { value: 1 }, uCap: { value: 0 } },
      defines: { OCTAVES: 1 },
    });
    const sphere = new Mesh(sphereGeo, this.glass);
    sphere.scale.setScalar(r);
    const capMat = this.glass.clone();
    capMat.uniforms.uSunDir = shared.uSunDir;
    capMat.uniforms.uCap.value = 1;
    const cap = new Mesh(capGeo, capMat);
    cap.scale.set(r * 0.3, r * 0.14, r * 0.3);
    cap.position.y = r * 0.97;

    this.halo = new Sprite(
      new SpriteMaterial({
        map: getGlowTexture(),
        color: EMBER,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.3,
      }),
    );
    this.halo.renderOrder = 6;

    // Pool of light on the water under the float.
    this.pool = new Mesh(
      poolGeo,
      new MeshBasicMaterial({
        map: getGlowTexture(),
        color: EMBER,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.4,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      }),
    );
    this.pool.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), this.normal));
    this.pool.position.set(s.x, s.y, s.z).addScaledVector(this.normal, 0.09);
    this.pool.scale.setScalar(r * 7);
    this.pool.renderOrder = 2;

    this.hit = new Mesh(sphereGeo, hitMaterial);
    this.hit.scale.setScalar(Math.max(r * 1.7, 0.6));
    this.hit.userData.id = id;

    this.group.add(sphere, cap, this.halo, this.hit);
    this.group.position.copy(this.base);
  }

  /** The pool lies on the water, so it is added to the scene, not to the bobbing group. */
  get poolMesh(): Mesh {
    return this.pool;
  }

  update(time: number, dt: number) {
    this.emphasis += (this.emphasisTarget - this.emphasis) * Math.min(1, dt * 7);
    const bob = Math.sin(time * 1.1 + this.phase) * 0.05 + Math.sin(time * 0.63 + this.phase * 2.1) * 0.03;
    this.group.position.copy(this.base).addScaledVector(this.normal, bob);
    this.group.rotation.set(Math.sin(time * 0.8 + this.phase) * 0.14, 0, Math.cos(time * 0.67 + this.phase) * 0.14);
    this.center.copy(this.group.position);
    const pulse = 0.9 + Math.sin(time * 1.6 + this.phase * 3.0) * 0.1;
    const e = this.emphasis;
    this.glass.uniforms.uGlow.value = pulse * (1 + e * 0.9);
    const r = this.placement.radius;
    this.halo.scale.setScalar(r * (5.5 + e * 3.0) * pulse);
    (this.halo.material as SpriteMaterial).opacity = 0.26 + e * 0.3;
    (this.pool.material as MeshBasicMaterial).opacity = (0.3 + e * 0.25) * pulse;
  }

  dispose() {
    this.glass.dispose();
    (this.halo.material as SpriteMaterial).dispose();
    (this.pool.material as MeshBasicMaterial).dispose();
  }
}
