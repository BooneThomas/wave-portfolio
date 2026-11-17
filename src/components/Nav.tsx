import { useEffect, useState } from 'react';
import { site } from '../content';
import { useI18n } from '../i18n';

export function Nav() {
  const { ui } = useI18n();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = [
    { href: '#top', label: ui.nav.wave },
    { href: '#overview', label: ui.nav.projects },
    { href: '#about', label: ui.nav.about },
    { href: '#experience', label: ui.nav.experience },
    { href: '#contact', label: ui.nav.contact },
  ];

  return (
    <header className="nav" data-solid={solid} data-open={open}>
      <a className="nav__brand" href="#top">
        {site.name}
      </a>
      <button
        type="button"
        className="nav__toggle chip-btn"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? ui.nav.closeMenu : ui.nav.menu}
      </button>
      <nav id="site-nav" className="nav__links" aria-label={ui.nav.label}>
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function Footer() {
  const { ui } = useI18n();
  return (
    <footer className="footer">
      <p>
        {site.name}. {ui.footer.built}
      </p>
      <a className="text-link" href="#top">
        {ui.footer.top} <span aria-hidden="true">↑</span>
      </a>
    </footer>
  );
}
