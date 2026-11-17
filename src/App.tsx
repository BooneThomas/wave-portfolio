import { useCallback, useEffect, useRef, useState } from 'react';
import { Hero } from './components/Hero';
import { Footer, Nav } from './components/Nav';
import { About, Contact, Experience, Overview } from './components/Sections';
import { defaultLocale, projects, type Locale } from './content';
import { useProjectRoute } from './hooks';
import { I18nProvider, useI18n } from './i18n';

const ids = projects.map((p) => p.id);

function Page() {
  const { ui, locale } = useI18n();
  const route = useProjectRoute(ids);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const previous = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Opening a project brings the wave into view; closing returns focus to where the visitor was.
  useEffect(() => {
    const was = previous.current;
    previous.current = route.id;
    if (route.id && !was) {
      const active = document.activeElement as HTMLElement | null;
      opener.current = active && active !== document.body ? active : null;
    }
    if (route.id && window.scrollY > 8) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }
    if (!route.id && was) {
      const el = opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>(`a.float[href="#/project/${was}"]`);
      el?.focus();
      opener.current = null;
    }
  }, [route.id]);

  const close = route.close;
  const onClose = useCallback(() => close(), [close]);

  return (
    <>
      <a className="skip-link" href="#overview">
        {ui.skipToOverview}
      </a>
      <Nav />
      <main>
        <Hero selectedId={route.id} highlightId={highlightId} onSelect={route.open} onClose={onClose} />
        <div className="page">
          <Overview selectedId={route.id} onHighlight={setHighlightId} />
          <About />
          <Experience />
          <Contact />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  // Single locale for now. When Dutch is added, keep the choice here (and in localStorage).
  const [locale] = useState<Locale>(defaultLocale);
  return (
    <I18nProvider locale={locale}>
      <Page />
    </I18nProvider>
  );
}
