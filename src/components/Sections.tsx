import { about, projects, site, skills, timeline } from '../content';
import { projectHref } from '../hooks';
import { useI18n } from '../i18n';
import { pad, Rich } from './Rich';

interface OverviewProps {
  selectedId: string | null;
  onHighlight: (id: string | null) => void;
}

/** The plain list of all projects. Always available, with or without the 3D scene. */
export function Overview({ selectedId, onHighlight }: OverviewProps) {
  const { ui, t } = useI18n();
  return (
    <section id="overview" className="section" aria-labelledby="overview-title">
      <header className="section__head">
        <p className="section__index" aria-hidden="true">01</p>
        <h2 id="overview-title">{ui.overview.title}</h2>
        <p className="section__intro">{ui.overview.intro}</p>
      </header>
      <ol className="ledger">
        {projects.map((p, i) => (
          <li key={p.id}>
            <a
              className="ledger__row"
              href={projectHref(p.id)}
              aria-current={p.id === selectedId ? 'true' : undefined}
              onPointerEnter={() => onHighlight(p.id)}
              onPointerLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(p.id)}
              onBlur={() => onHighlight(null)}
            >
              <span className="ledger__num" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span className="ledger__main">
                <span className="ledger__title">{t(p.title)}</span>
                <span className="ledger__meta">
                  {ui.kinds[p.kind]}
                  {p.organisation && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <Rich text={p.organisation} />
                    </>
                  )}
                </span>
              </span>
              <span className="ledger__summary">
                <Rich text={p.summary} />
              </span>
              <span className="ledger__go" aria-hidden="true">
                {ui.overview.viewInWave} →
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function About() {
  const { ui } = useI18n();
  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <header className="section__head">
        <p className="section__index" aria-hidden="true">02</p>
        <h2 id="about-title">{ui.about.title}</h2>
      </header>
      <div className="about">
        <div className="about__text">
          <p className="lead">
            <Rich text={about.lead} />
          </p>
          {about.paragraphs.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </div>
        <dl className="facts">
          {about.facts.map((f, i) => (
            <div key={i}>
              <dt>
                <Rich text={f.label} />
              </dt>
              <dd>
                <Rich text={f.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Experience() {
  const { ui } = useI18n();
  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <header className="section__head">
        <p className="section__index" aria-hidden="true">03</p>
        <h2 id="experience-title">{ui.experience.title}</h2>
      </header>
      <ol className="timeline">
        {timeline.map((entry) => (
          <li key={entry.id} className="timeline__item" data-type={entry.type}>
            <p className="timeline__period">
              <Rich text={entry.period} />
            </p>
            <div className="timeline__body">
              <p className="eyebrow">{ui.experience.types[entry.type]}</p>
              <h3>
                <Rich text={entry.title} />
              </h3>
              <p className="timeline__org">
                <Rich text={entry.organisation} />
                {entry.location && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <Rich text={entry.location} />
                  </>
                )}
              </p>
              {entry.description && (
                <p>
                  <Rich text={entry.description} />
                </p>
              )}
              {entry.projectId && projects.some((p) => p.id === entry.projectId) && (
                <p>
                  <a className="text-link" href={projectHref(entry.projectId)}>
                    {ui.experience.seeProject} <span aria-hidden="true">→</span>
                  </a>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <h3 className="section__sub" id="skills">
        {ui.experience.skills}
      </h3>
      <div className="skills">
        {skills.map((group) => (
          <div key={group.id} className="skills__group">
            <h4>
              <Rich text={group.label} />
            </h4>
            <ul className="tags">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Contact() {
  const { ui, t } = useI18n();
  const { linkedin, email } = site.links;
  return (
    <section id="contact" className="section section--contact" aria-labelledby="contact-title">
      <header className="section__head">
        <p className="section__index" aria-hidden="true">04</p>
        <h2 id="contact-title">{ui.contact.title}</h2>
      </header>
      <p className="lead">{ui.contact.lead}</p>
      <p className="contact__actions">
        {linkedin ? (
          <a className="btn btn--solid" href={linkedin} target="_blank" rel="noopener noreferrer">
            {ui.contact.linkedin} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="btn btn--todo">
            {ui.contact.linkedin} <mark className="todo">{ui.contact.todoLinkedin}</mark>
          </span>
        )}
        {email ? (
          <a className="btn" href={`mailto:${email}`}>
            {ui.contact.email}
          </a>
        ) : (
          <span className="btn btn--todo">
            {ui.contact.email} <mark className="todo">{ui.contact.todoEmail}</mark>
          </span>
        )}
      </p>
      <p className="contact__place">{t(site.location)}</p>
    </section>
  );
}
