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
  const previous = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Opening a project brings the wave into view. Closing puts keyboard focus on the
  // light of the project that was open, so the visitor continues from there.
  useEffect(() => {
    const was = previous.current;
    previous.current = route.id;
    if (route.id && window.scrollY > 8) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }
    if (!route.id && was) {
      document.querySelector<HTMLElement>(`a.float[href="#/project/${was}"]`)?.focus({ preventScroll: true });
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
