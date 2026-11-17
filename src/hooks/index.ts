import { useCallback, useSyncExternalStore } from 'react';

const PROJECT_ROUTE = /^#\/project\/([\w-]+)$/;

function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb);
  window.addEventListener('popstate', cb);
  return () => {
    window.removeEventListener('hashchange', cb);
    window.removeEventListener('popstate', cb);
  };
}

/** Link target that opens a project. Shareable: the selection lives in the URL hash. */
export const projectHref = (id: string) => `#/project/${id}`;

/** The project selected through the URL hash (#/project/<id>), or null. */
export function useProjectRoute(validIds: string[]) {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => '',
  );
  const match = PROJECT_ROUTE.exec(hash);
  const id = match && validIds.includes(match[1]) ? match[1] : null;
  const open = useCallback((next: string) => {
    window.location.hash = `/project/${next}`;
  }, []);
  const close = useCallback(() => {
    if (!PROJECT_ROUTE.test(window.location.hash)) return;
    window.history.pushState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);
  return { id, open, close };
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
