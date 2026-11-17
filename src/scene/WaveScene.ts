import {
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { layoutFloats, viewFor, type ViewPose } from './layout';
import { createSky, createSpray, FloatLight, type Uniforms } from './objects';
import { detectQuality, type Quality } from './quality';
import { WATER_FRAG, WATER_VERT } from './shaders';
import { buildWaveGeometry } from './waveGeometry';
import { clamp, WAVE } from './waveProfile';

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  /** Element that receives pointer input and defines the size of the scene. */
  container: HTMLElement;
  /** Project ids, in content order. */
  ids: string[];
  /** Returns the DOM label (a button) for a project, positioned by the scene every frame. */
  getLabel: (id: string) => HTMLElement | null;
  motion: boolean;
  onSelect: (id: string) => void;
  onReady: () => void;
}

interface Pose {
  position: Vector3;
  target: Vector3;
  inside: boolean;
}

const HOME = { pivot: new Vector3(2.2, 2.3, -0.4), azimuth: 2.76, elevation: 0.03, radius: 16.5, fov: 40 };
const MOUTH = new Vector3(-7.5, 1.9, -0.6);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The 3D scene. Plain Three.js, no React: the app talks to it through a few methods.
 * Throws if WebGL is not available, so the caller can show the fallback.
 */
export class WaveScene {
  private readonly opts: SceneOptions;
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(HOME.fov, 1, 0.1, 1200);
  private readonly quality: Quality;
  private readonly shared: Uniforms;
  private readonly floats: FloatLight[] = [];
  private readonly proxy: Mesh;
  private readonly raycaster = new Raycaster();
  private readonly disposers: (() => void)[] = [];

  private width = 1;
  private height = 1;
  private dpr = 1;
  private dprCap = 2;
  private time = 12;
  private last = 0;
  private raf = 0;
  private visible = true;
  private motion: boolean;
  private dirty = 4;
  private disposed = false;

  // Camera rig.
  private focusId: string | null = null;
  private readonly pos = new Vector3();
  private readonly target = new Vector3();
  private inside = false;
  private tween: { from: Pose; t: number; duration: number; via: Vector3 | null } | null = null;
  private fit = 1;
  private orbit = { yaw: 0, pitch: 0, yawGoal: 0, pitchGoal: 0 };
  private look = new Vector2();
  private lookGoal = new Vector2();
  private inset = { right: 0, bottom: 0, top: 0, left: 0, rightGoal: 0, bottomGoal: 0, topGoal: 0, leftGoal: 0 };
  /** Bottom-left block of hero copy (its right and top edge, in pixels) that lights must stay clear of. */
  private avoid: { x: number; y: number } | null = null;
  private narrow: boolean | null = null;

  // Input.
  private drag: { id: number; x: number; y: number; moved: boolean } | null = null;
  private hoverId: string | null = null;
  private highlightId: string | null = null;
  private pointer = new Vector2(-2, -2);
  private pointerDirty = false;

  // Labels.
  private labelFrame = 0;
  private occlusionCursor = 0;
  private readonly occluded = new Map<string, boolean>();
  private readonly compact = new Map<string, boolean>();
  private readonly tagWidth = new Map<string, number>();

  // Adaptive resolution.
  private slowFrames = 0;
  private frameAvg = 16;

  constructor(opts: SceneOptions) {
    this.opts = opts;
    this.motion = opts.motion;
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) throw new Error('WebGL not available');
    this.quality = detectQuality(gl);
    this.dprCap = this.quality.maxDpr;
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    this.renderer = new WebGLRenderer({
      canvas: opts.canvas,
      antialias: this.quality.antialias,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setClearColor(0x04121a);

    const sun = new Vector3(0.985, 0.075, -0.13).normalize();
    this.shared = { uTime: { value: this.time }, uSunDir: { value: sun } };

    // Sea and wave.
    const water = new Mesh(
      buildWaveGeometry(this.quality.detail),
      new ShaderMaterial({
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        uniforms: { ...this.shared, uHeight: { value: WAVE.height } },
        defines: { OCTAVES: this.quality.octaves },
        side: DoubleSide,
      }),
    );
    water.frustumCulled = false;
    this.scene.add(water, createSky(this.shared, this.quality.octaves), createSpray(this.shared, this.quality.sprayCount));

    // Coarse copy of the wave, only used to test whether a light is hidden behind the lip.
    this.proxy = new Mesh(buildWaveGeometry(0.22));
    this.proxy.updateMatrixWorld();

    this.bind();
    this.resize();
    const home = this.homePose();
    this.pos.copy(home.position);
    this.target.copy(home.target);
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------------- public API

  /** Fly to a project, or back out to the wide view with null. */
  focus(id: string | null) {
    if (id === this.focusId) return;
    this.focusId = id;
    this.orbit.yawGoal = this.orbit.pitchGoal = 0;
    if (id) this.orbit.yaw = this.orbit.pitch = 0;
    const goal = this.goalPose();
    const from: Pose = { position: this.pos.clone(), target: this.target.clone(), inside: this.inside };
    const distance = from.position.distanceTo(goal.position);
    this.tween = {
      from,
      t: 0,
      duration: this.motion ? clamp(0.9 + distance * 0.07, 1.1, 2.3) : 0,
      // Going in or out of the barrel: swing through its open mouth instead of through the lip.
      via: from.inside !== goal.inside ? MOUTH : null,
    };
    this.inside = goal.inside;
    this.syncEmphasis();
    this.dirty = 4;
  }

  /** Highlight a light (keyboard focus or hover on its label or list row). */
  highlight(id: string | null) {
    this.highlightId = id;
    this.syncEmphasis();
    this.dirty = 4;
  }

  setMotion(on: boolean) {
    this.motion = on;
    this.dirty = 4;
  }

  /**
   * Space taken by interface on top of the scene (detail panel right or below, hero copy
   * on top on phones), so the subject stays centred in what is left.
   */
  setInset(right: number, bottom: number, top = 0, avoid: { x: number; y: number } | null = null) {
    const changed =
      Math.abs(top - this.inset.topGoal) > 4 ||
      Math.abs((avoid?.x ?? 0) - (this.avoid?.x ?? 0)) > 4 ||
      Math.abs((avoid?.y ?? 0) - (this.avoid?.y ?? 0)) > 4;
    this.avoid = avoid;
    this.inset.rightGoal = right;
    this.inset.bottomGoal = bottom;
    this.inset.topGoal = top;
    // Nudge the picture to the right so the mouth of the barrel is not under the copy.
    this.inset.leftGoal = avoid ? Math.min(avoid.x * 0.3, this.width * 0.09) : 0;
    if (changed && !this.focusId) this.fitHome();
    this.dirty = 4;
  }

  /** (Re)creates the project lights. Portrait screens get a more compact layout. */
  private buildFloats(narrow: boolean) {
    if (this.narrow === narrow) return;
    this.narrow = narrow;
    for (const f of this.floats) {
      this.scene.remove(f.group, f.poolMesh);
      f.dispose();
    }
    this.floats.length = 0;
    const placements = layoutFloats(this.opts.ids.length, narrow ? 0.55 : 1);
    this.opts.ids.forEach((id, i) => {
      const f = new FloatLight(id, placements[i], this.shared);
      this.floats.push(f);
      this.scene.add(f.group, f.poolMesh);
    });
    this.syncEmphasis();
  }

  /** Turn the view left or right (keyboard). */
  nudge(direction: number) {
    this.orbit.yawGoal = clamp(this.orbit.yawGoal + direction * 0.16, ...this.yawLimits());
    this.dirty = 4;
  }

  resetView() {
    this.orbit.yawGoal = this.orbit.pitchGoal = 0;
    this.dirty = 4;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.disposers.forEach((d) => d());
    this.floats.forEach((f) => f.dispose());
    this.scene.traverse((o) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
    });
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------- camera

  private yawLimits(): [number, number] {
    return this.focusId ? [-0.5, 0.5] : [-0.75, 0.3];
  }

  private homePose(): Pose {
    const az = HOME.azimuth + this.orbit.yaw + this.look.x * 0.05;
    const el = HOME.elevation + this.orbit.pitch - this.look.y * 0.025;
    const r = HOME.radius * this.fit;
    const p = new Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(r).add(HOME.pivot);
    p.y = Math.max(p.y, 1.1);
    return { position: p, target: HOME.pivot.clone(), inside: false };
  }

  private focusPose(f: FloatLight): Pose {
    const v: ViewPose = viewFor(f.placement);
    const target = new Vector3(...v.target);
    const offset = new Vector3(...v.position).sub(target);
    // On narrow screens step back a little so the light and its surroundings fit.
    offset.multiplyScalar(Math.max(1, 1 + (this.fit - 1) * 0.35));
    const yaw = this.orbit.yaw + this.look.x * 0.06;
    offset.applyAxisAngle(new Vector3(0, 1, 0), -yaw * (v.inside ? 0.35 : 1));
    const p = target.clone().add(offset);
    p.y = Math.max(p.y + this.orbit.pitch * 4 - this.look.y * 0.12, 0.7);
    return { position: p, target, inside: v.inside };
  }

  private goalPose(): Pose {
    const f = this.focusId ? this.floats.find((x) => x.id === this.focusId) : null;
    return f ? this.focusPose(f) : this.homePose();
  }

  /** Pull the home camera back until every light is comfortably inside the frame. */
  private fitHome() {
    const cam = this.camera;
    const v = new Vector3();
    let lo = 0.72;
    let hi = 3.2;
    const fits = (fit: number) => {
      this.fit = fit;
      const home = this.homePose();
      cam.position.copy(home.position);
      cam.lookAt(home.target);
      cam.updateMatrixWorld();
      // Safe area in pixels: clear of the nav or hero copy above and the controls below.
      const top = this.inset.topGoal;
      const left = this.inset.leftGoal;
      const avoid = this.avoid;
      const minX = this.width * 0.06;
      const maxX = this.width * (this.narrow ? 0.88 : 0.93);
      const minY = top > 0 ? top + this.height * 0.02 : this.height * 0.17;
      const maxY = this.height - (this.narrow ? 96 : this.height * 0.15);
      const points = this.floats.map((f) => f.center);
      // Keep the crest of the barrel in frame as well.
      points.push(new Vector3(0, WAVE.height * 1.08, -4));
      return points.every((p) => {
        v.copy(p).project(cam);
        const x = (v.x * 0.5 + 0.5) * this.width + left / 2;
        const y = (-v.y * 0.5 + 0.5) * this.height + top / 2;
        const underCopy = avoid !== null && x < avoid.x + 28 && y > avoid.y - 20;
        return v.z < 1 && x > minX && x < maxX && y > minY && y < maxY && !underCopy;
      });
    };
    const saved = { yaw: this.orbit.yaw, pitch: this.orbit.pitch, lx: this.look.x, ly: this.look.y };
    this.orbit.yaw = this.orbit.pitch = 0;
    this.look.set(0, 0);
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    this.fit = hi;
    this.orbit.yaw = saved.yaw;
    this.orbit.pitch = saved.pitch;
    this.look.set(saved.lx, saved.ly);
  }

  private updateCamera(dt: number) {
    const k = this.motion ? Math.min(1, dt * 5) : 1;
    const o = this.orbit;
    o.yaw += (o.yawGoal - o.yaw) * k;
    o.pitch += (o.pitchGoal - o.pitch) * k;
    this.look.lerp(this.lookGoal, this.motion ? Math.min(1, dt * 2.5) : 1);
    const goal = this.goalPose();
    if (this.tween) {
      const tw = this.tween;
      tw.t = tw.duration > 0 ? Math.min(1, tw.t + dt / tw.duration) : 1;
      const e = ease(tw.t);
      if (tw.via) {
        const a = 1 - e;
        this.pos
          .copy(tw.from.position)
          .multiplyScalar(a * a)
          .addScaledVector(tw.via, 2 * a * e)
          .addScaledVector(goal.position, e * e);
      } else {
        this.pos.lerpVectors(tw.from.position, goal.position, e);
      }
      this.target.lerpVectors(tw.from.target, goal.target, e);
      if (tw.t >= 1) this.tween = null;
      this.dirty = Math.max(this.dirty, 2);
    } else {
      this.pos.lerp(goal.position, k);
      this.target.lerp(goal.target, k);
    }
    const cam = this.camera;
    cam.position.copy(this.pos);
    if (this.motion) {
      // Gentle drift, as if filmed from a boat.
      cam.position.x += Math.sin(this.time * 0.23) * 0.12;
      cam.position.y += Math.sin(this.time * 0.37) * 0.07;
    }
    cam.lookAt(this.target);

    const ins = this.inset;
    ins.right += (ins.rightGoal - ins.right) * k;
    ins.bottom += (ins.bottomGoal - ins.bottom) * k;
    ins.top += (ins.topGoal - ins.top) * k;
    ins.left += (ins.leftGoal - ins.left) * k;
    if (ins.right > 0.5 || ins.bottom > 0.5 || ins.top > 0.5 || ins.left > 0.5) {
      cam.setViewOffset(this.width, this.height, (ins.right - ins.left) / 2, (ins.bottom - ins.top) / 2, this.width, this.height);
    } else if (cam.view?.enabled) {
      cam.clearViewOffset();
    }
    const settling =
      Math.abs(o.yawGoal - o.yaw) > 1e-4 ||
      Math.abs(o.pitchGoal - o.pitch) > 1e-4 ||
      Math.abs(ins.rightGoal - ins.right) > 0.5 ||
      Math.abs(ins.bottomGoal - ins.bottom) > 0.5 ||
      Math.abs(ins.topGoal - ins.top) > 0.5 ||
      Math.abs(ins.leftGoal - ins.left) > 0.5 ||
      this.pos.distanceToSquared(goal.position) > 1e-5;
    if (settling) this.dirty = Math.max(this.dirty, 2);
  }

  // ---------------------------------------------------------------- input

  private bind() {
    const el = this.opts.container;
    const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      el.addEventListener(type, fn);
      this.disposers.push(() => el.removeEventListener(type, fn));
    };
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    on('pointerdown', (e) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button, a')) return;
      this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    });
    on('pointermove', (e) => {
      const p = local(e);
      this.pointer.set((p.x / this.width) * 2 - 1, -(p.y / this.height) * 2 + 1);
      this.pointerDirty = true;
      if (e.pointerType === 'mouse') this.lookGoal.set(this.pointer.x, this.pointer.y);
      const d = this.drag;
      if (d && d.id === e.pointerId) {
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) > 6) {
          d.moved = true;
          el.setPointerCapture?.(e.pointerId);
          el.dataset.dragging = 'true';
        }
        if (d.moved) {
          const [lo, hi] = this.yawLimits();
          this.orbit.yawGoal = clamp(this.orbit.yawGoal + (dx / this.width) * 1.6, lo, hi);
          this.orbit.pitchGoal = clamp(this.orbit.pitchGoal + (dy / this.height) * 0.7, -0.03, 0.36);
          d.x = e.clientX;
          d.y = e.clientY;
        }
      }
      this.dirty = Math.max(this.dirty, 2);
    });
    const end = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      this.drag = null;
      delete el.dataset.dragging;
      if (!d.moved && e.type === 'pointerup') {
        const p = local(e);
        this.pointer.set((p.x / this.width) * 2 - 1, -(p.y / this.height) * 2 + 1);
        const id = this.pick();
        if (id) this.opts.onSelect(id);
      }
    };
    on('pointerup', end);
    on('pointercancel', end);
    on('pointerleave', () => {
      this.lookGoal.set(0, 0);
      this.pointer.set(-2, -2);
      this.pointerDirty = true;
    });

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.dirty = 4;
    });
    io.observe(el);
    const onVis = () => {
      this.last = 0;
    };
    document.addEventListener('visibilitychange', onVis);
    this.disposers.push(
      () => ro.disconnect(),
      () => io.disconnect(),
      () => document.removeEventListener('visibilitychange', onVis),
    );
  }

  private pick(): string | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.floats.map((f) => f.hit),
      false,
    );
    return hits.length ? (hits[0].object.userData.id as string) : null;
  }

  private syncEmphasis() {
    for (const f of this.floats) {
      f.emphasisTarget = f.id === this.focusId ? 1 : f.id === this.hoverId || f.id === this.highlightId ? 0.8 : 0;
    }
  }

  // ---------------------------------------------------------------- frame

  private resize() {
    const el = this.opts.container;
    this.width = Math.max(1, el.clientWidth);
    this.height = Math.max(1, el.clientHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    // Portrait screens get a wider lens so the wave keeps its height.
    this.camera.fov = HOME.fov + clamp((1 - this.camera.aspect) * 22, 0, 16);
    this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    for (const child of this.scene.children) {
      const u = ((child as Mesh).material as ShaderMaterial | undefined)?.uniforms;
      if (u?.uScale) u.uScale.value = this.height * this.dpr * 0.5;
    }
    this.buildFloats(this.camera.aspect < 0.8);
    this.tagWidth.clear();
    this.fitHome();
    this.dirty = 4;
  }

  private adapt(dtMs: number) {
    this.frameAvg += (dtMs - this.frameAvg) * 0.05;
    if (this.frameAvg > 26) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 90 && this.dpr > 0.8) {
      this.dprCap = this.dpr = Math.max(0.75, this.dpr - 0.25);
      this.renderer.setPixelRatio(this.dpr);
      this.renderer.setSize(this.width, this.height, false);
      this.slowFrames = 0;
      this.frameAvg = 16;
    }
  }

  private readonly frame = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    if (!this.visible || document.hidden) {
      this.last = 0;
      return;
    }
    const dtMs = this.last ? Math.min(now - this.last, 100) : 16;
    this.last = now;
    const dt = dtMs / 1000;
    if (!this.motion && this.dirty <= 0) return;
    this.dirty--;
    if (this.motion) {
      this.time += dt;
      this.adapt(dtMs);
    }
    this.shared.uTime.value = this.time;

    this.updateCamera(dt);
    for (const f of this.floats) f.update(this.time, dt);
    if (this.pointerDirty) {
      this.pointerDirty = false;
      const id = this.drag?.moved ? null : this.pick();
      if (id !== this.hoverId) {
        this.hoverId = id;
        this.opts.container.style.cursor = id ? 'pointer' : '';
        this.syncEmphasis();
        this.dirty = Math.max(this.dirty, 30);
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
    if (this.last && !this.readySent) {
      this.readySent = true;
      this.opts.onReady();
    }
  };
  private readySent = false;

  // ---------------------------------------------------------------- labels

  private readonly v = new Vector3();
  private readonly dir = new Vector3();

  private updateLabels() {
    const cam = this.camera;
    this.labelFrame++;
    // One occlusion test per frame, round robin.
    if (this.floats.length) {
      const f = this.floats[this.occlusionCursor++ % this.floats.length];
      this.dir.copy(f.center).sub(cam.position);
      const dist = this.dir.length();
      this.raycaster.set(cam.position, this.dir.normalize());
      this.raycaster.far = dist - f.placement.radius * 1.5;
      const hidden = this.raycaster.intersectObject(this.proxy, false).length > 0;
      this.raycaster.far = Infinity;
      this.occluded.set(f.id, hidden);
    }
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const recompute = this.labelFrame % 10 === 1;
    const order = recompute
      ? [...this.floats].sort((a, b) => a.center.distanceToSquared(cam.position) - b.center.distanceToSquared(cam.position))
      : this.floats;
    for (const f of order) {
      const el = this.opts.getLabel(f.id);
      if (!el) continue;
      this.v.copy(f.center).project(cam);
      const x = (this.v.x * 0.5 + 0.5) * this.width;
      const y = (-this.v.y * 0.5 + 0.5) * this.height;
      const off = this.v.z > 1 || x < -40 || x > this.width + 40 || y < -40 || y > this.height + 40;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.dataset.off = String(off);
      el.dataset.occluded = String(!!this.occluded.get(f.id) && f.id !== this.focusId);
      if (recompute) {
        // Hide the title when it would collide with a nearer label or leave the frame.
        let w = this.tagWidth.get(f.id);
        if (w === undefined || (!this.compact.get(f.id) && this.labelFrame % 120 === 1)) {
          w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 120;
          if (!this.compact.get(f.id)) this.tagWidth.set(f.id, w);
        }
        const box = { x: x + 14, y: y - 16, w: w + 12, h: 32 };
        const clash =
          this.focusId !== null ||
          off ||
          box.x + box.w > this.width - 8 ||
          placed.some((p) => box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y);
        const was = this.compact.get(f.id);
        if (was !== clash) {
          this.compact.set(f.id, clash);
          el.dataset.compact = String(clash);
        }
        placed.push(clash ? { x: x - 20, y: y - 20, w: 40, h: 40 } : { x: x - 20, y: y - 20, w: box.w + 34, h: 40 });
      }
    }
  }
}
