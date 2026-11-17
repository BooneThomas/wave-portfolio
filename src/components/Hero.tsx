import { useCallback, useEffect, useRef, useState } from 'react';
import { projects, site } from '../content';
import { projectHref, useMediaQuery } from '../hooks';
import { useI18n } from '../i18n';
import type { WaveScene } from '../scene/WaveScene';
import { ProjectPanel } from './ProjectPanel';
import { asset, pad } from './Rich';

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
  // Larger reading view of the project panel. Remembered while the visitor browses.
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
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

  // Tell the scene how much room the interface takes (panel, and the copy on phones),
  // so its subject stays visible in the space that is left.
  const copyRef = useRef<HTMLDivElement>(null);
  const panelEl = useRef<HTMLElement | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const reportInsets = useCallback(() => {
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!stage || !scene) return;
    const panel = panelEl.current;
    if (panel) {
      // The large reading view covers the scene, so there is nothing to make room for.
      if (expandedRef.current) return scene.setInset(0, 0);
      const side = panel.offsetWidth < stage.clientWidth * 0.7;
      scene.setInset(side ? panel.offsetWidth : 0, side ? 0 : panel.offsetHeight, 0);
      return;
    }
    const copy = copyRef.current;
    if (!copy) return scene.setInset(0, 0);
    // Phones: copy sits on top. Wider screens: copy sits bottom left.
    if (window.matchMedia('(max-width: 47.99rem)').matches) scene.setInset(0, 0, copy.offsetTop + copy.offsetHeight);
    else scene.setInset(0, 0, 0, { x: copy.offsetLeft + copy.offsetWidth, y: copy.offsetTop });
  }, []);
  const panelRef = useCallback(
    (el: HTMLElement | null) => {
      panelEl.current = el;
      reportInsets();
    },
    [reportInsets],
  );
  useEffect(() => {
    observer.current = new ResizeObserver(reportInsets);
    if (stageRef.current) observer.current.observe(stageRef.current);
    if (copyRef.current) observer.current.observe(copyRef.current);
    reportInsets();
    return () => observer.current?.disconnect();
    // Runs again when the scene becomes ready, so it gets the first measurement.
  }, [reportInsets, status, expanded]);

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
        <div
          className="hero__backdrop"
          role="img"
          aria-label={ui.scene.canvasAlt}
          style={status === 'fallback' ? { backgroundImage: `url(${asset('poster.jpg')})` } : undefined}
        />
        <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
        <div className="hero__shade" aria-hidden="true" />

        <div className="hero__copy" ref={copyRef}>
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

        {selected && (
          <ProjectPanel
            project={selected}
            onClose={onClose}
            panelRef={panelRef}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((v) => !v)}
          />
        )}
      </div>
    </section>
  );
}
