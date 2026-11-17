import { useEffect, useRef } from 'react';
import { projects, type Project } from '../content';
import { projectHref } from '../hooks';
import { useI18n } from '../i18n';
import { asset, pad, Rich } from './Rich';

interface Props {
  project: Project;
  onClose: () => void;
  /** Reports the panel element so the scene can keep its subject clear of it. */
  panelRef: (el: HTMLElement | null) => void;
}

/** Detail view of one project. Sits beside the scene on wide screens, below it on phones. */
export function ProjectPanel({ project, onClose, panelRef }: Props) {
  const { ui, t } = useI18n();
  const rootRef = useRef<HTMLElement | null>(null);
  const index = projects.findIndex((p) => p.id === project.id);
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  // Move focus into the panel when it opens. When stepping with Previous / Next the focus
  // is already inside and stays on that control, so it can be pressed again.
  useEffect(() => {
    const root = rootRef.current;
    if (root && !root.contains(document.activeElement)) root.focus({ preventScroll: true });
  }, [project.id]);

  return (
    <aside
      className="panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="panel-title"
      tabIndex={-1}
      ref={(el) => {
        rootRef.current = el;
        panelRef(el);
      }}
    >
      <p className="sr-only" aria-live="polite">
        {pad(index + 1)} {ui.panel.of} {pad(projects.length)}: {t(project.title)}
      </p>
      <div className="panel__bar">
        <p className="panel__count">
          <span className="num">{pad(index + 1)}</span>
          <span aria-hidden="true"> / </span>
          <span className="sr-only">{ui.panel.of}</span>
          {pad(projects.length)}
        </p>
        <button type="button" className="chip-btn" onClick={onClose}>
          <span aria-hidden="true">←</span> {ui.panel.close}
        </button>
      </div>

      <div className="panel__body" key={project.id}>
        <p className="eyebrow">
          {ui.kinds[project.kind]}
          {project.organisation && (
            <>
              <span aria-hidden="true"> · </span>
              <Rich text={project.organisation} />
            </>
          )}
        </p>
        <h2 id="panel-title">
          <Rich text={project.title} />
        </h2>
        {project.period && (
          <p className="panel__period">
            <Rich text={project.period} />
          </p>
        )}
        <p className="panel__summary">
          <Rich text={project.summary} />
        </p>

        {project.image && (
          <img
            className="panel__image"
            src={asset(project.image.src)}
            alt={t(project.image.alt)}
            width={project.image.width}
            height={project.image.height}
            loading="lazy"
            decoding="async"
          />
        )}

        <h3>{ui.panel.highlights}</h3>
        <ul className="panel__list">
          {project.highlights.map((h, i) => (
            <li key={i}>
              <Rich text={h} />
            </li>
          ))}
        </ul>

        {project.result && (
          <>
            <h3>{ui.panel.result}</h3>
            <p>
              <Rich text={project.result} />
            </p>
          </>
        )}

        {project.note && (
          <p className="panel__note">
            <Rich text={project.note} />
          </p>
        )}

        <h3>{ui.panel.tech}</h3>
        <ul className="tags">
          {project.tech.map((tech) => (
            <li key={tech}>
              <Rich text={tech} />
            </li>
          ))}
        </ul>

        {project.links && project.links.length > 0 && (
          <>
            <h3>{ui.panel.links}</h3>
            <ul className="panel__links">
              {project.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {t(link.label)} <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <nav className="panel__nav" aria-label={`${ui.panel.previous} / ${ui.panel.next}`}>
        <a href={projectHref(prev.id)} className="panel__step" rel="prev">
          <span className="panel__step-dir">
            <span aria-hidden="true">←</span> {ui.panel.previous}
          </span>
          <span className="panel__step-title">{t(prev.title)}</span>
        </a>
        <a href={projectHref(next.id)} className="panel__step panel__step--next" rel="next">
          <span className="panel__step-dir">
            {ui.panel.next} <span aria-hidden="true">→</span>
          </span>
          <span className="panel__step-title">{t(next.title)}</span>
        </a>
      </nav>
    </aside>
  );
}
