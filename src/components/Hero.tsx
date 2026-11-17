import { useCallback, useEffect, useRef, useState } from 'react';
import { projects, site } from '../content';
import { projectHref, useMediaQuery } from '../hooks';
import { useI18n } from '../i18n';
import type { WaveScene } from '../scene/WaveScene';
import { ProjectPanel } from './ProjectPanel';
import { pad } from './Rich';

type Status = 'loading' | 'ready' | 'fallback';

interface Props {
  selectedId: string | null;
  highlightId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const ids = projects.map((p) => p.id);

/** The wave: WebGL canvas, the project lights as real links on top of it, and the detail panel. */
export function Hero({ selectedId, highlightId, onSelect, onClose }: Props) {
  const { ui, t } = useI18n();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<WaveScene | null>(null);
  const labels = useRef(new Map<string, HTMLElement>());
  const [status, setStatus] = useState<Status>('loading');
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const coarse = useMediaQuery('(pointer: coarse)');
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const motion = motionChoice ?? !reduced;
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const selected = projects.find((p) => p.id === selectedId) ?? null;

  // Latest values for the scene, which is created asynchronously.
  const latest = useRef({ selectedId, motion, onSelect });
  latest.current = { selectedId, motion, onSelect };

  useEffect(() => {
    let cancelled = false;
    let scene: WaveScene | null = null;
    const start = async () => {
      try {
        const mod = await import('../scene/WaveScene');
        if (cancelled || !canvasRef.current || !stageRef.current) return;
        scene = new mod.WaveScene({
          canvas: canvasRef.current,
          container: stageRef.current,
          ids,
          getLabel: (id) => labels.current.get(id) ?? null,
          motion: latest.current.motion,
          onSelect: (id) => latest.current.onSelect(id),
          onReady: () => setStatus('ready'),
        });
        sceneRef.current = scene;
        scene.focus(latest.current.selectedId);
      } catch (error) {
        console.warn('3D scene unavailable, showing the static fallback.', error);
        if (!cancelled) setStatus('fallback');
      }
    };
    void start();
    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.focus(selectedId);
  }, [selectedId, status]);

  useEffect(() => {
    sceneRef.current?.setMotion(motion);
  }, [motion, status]);

  useEffect(() => {
    sceneRef.current?.highlight(focusedId ?? highlightId);
  }, [focusedId, highlightId, status]);

  // Tell the scene how much room the panel takes, so the subject stays visible next to it.
  const observer = useRef<ResizeObserver | null>(null);
  const panelRef = useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect();
    const report = () => {
      const stage = stageRef.current;
      if (!el || !stage) return sceneRef.current?.setInset(0, 0);
      const side = el.offsetWidth < stage.clientWidth * 0.7;
      sceneRef.current?.setInset(side ? el.offsetWidth : 0, side ? 0 : el.offsetHeight);
    };
    if (el) {
      observer.current = new ResizeObserver(report);
      observer.current.observe(el);
    }
    report();
  }, []);

  // Keyboard: Esc closes, arrows step through projects or turn the view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      const inView = (stageRef.current?.getBoundingClientRect().bottom ?? 0) > window.innerHeight * 0.4;
      if (!inView) return;
      if (e.key === 'Escape' && latest.current.selectedId) {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const current = latest.current.selectedId;
        if (current) {
          const i = ids.indexOf(current);
          latest.current.onSelect(ids[(i + dir + ids.length) % ids.length]);
        } else {
          sceneRef.current?.nudge(dir);
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <section id="top" className="hero" aria-label={ui.scene.sectionLabel} data-status={status} data-open={selected ? 'true' : 'false'}>
      <div className="hero__stage" ref={stageRef}>
        <div className="hero__backdrop" role="img" aria-label={ui.scene.canvasAlt} />
        <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
        <div className="hero__shade" aria-hidden="true" />

        <div className="hero__copy">
          <p className="eyebrow">{t(site.role)}</p>
          <h1>{site.name}</h1>
          <p className="hero__intro">{t(site.intro)}</p>
          <p className="hero__actions">
            <a className="btn" href="#overview">
              {ui.scene.overviewCta} <span aria-hidden="true">↓</span>
            </a>
          </p>
        </div>

        <nav className="floats" aria-label={ui.scene.floatsLabel} data-live={status === 'ready' ? 'true' : 'false'}>
          <ul>
            {projects.map((p, i) => (
              <li key={p.id}>
                <a
                  className="float"
                  href={projectHref(p.id)}
                  aria-current={p.id === selectedId ? 'true' : undefined}
                  data-active={p.id === selectedId || p.id === highlightId ? 'true' : undefined}
                  ref={(el) => {
                    if (el) labels.current.set(p.id, el);
                    else labels.current.delete(p.id);
                  }}
                  onFocus={() => setFocusedId(p.id)}
                  onBlur={() => setFocusedId(null)}
                  onPointerEnter={() => setFocusedId(p.id)}
                  onPointerLeave={() => setFocusedId(null)}
                >
                  <span className="float__tag">
                    <span className="float__num">{pad(i + 1)}</span>
                    <span className="float__title">{t(p.title)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {status === 'fallback' && <p className="hero__notice">{ui.scene.fallback}</p>}
        {status === 'loading' && (
          <p className="hero__notice hero__notice--loading" role="status">
            {ui.scene.loading}
          </p>
        )}

        {status === 'ready' && (
          <div className="hero__controls">
            <p className="hero__hint">{coarse ? ui.scene.hintTouch : ui.scene.hint}</p>
            <button type="button" className="chip-btn" onClick={() => setMotionChoice(!motion)} aria-pressed={!motion}>
              <span aria-hidden="true">{motion ? '❙❙' : '▶'}</span> {motion ? ui.scene.pause : ui.scene.play}
            </button>
            <button type="button" className="chip-btn" onClick={() => sceneRef.current?.resetView()}>
              {ui.scene.reset}
            </button>
          </div>
        )}

        {selected && <ProjectPanel project={selected} onClose={onClose} panelRef={panelRef} />}
      </div>
    </section>
  );
}
