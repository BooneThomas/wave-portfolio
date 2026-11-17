import { useI18n } from '../i18n';
import type { Text } from '../content';

const TODO = /(\[TODO:[^\]]*\])/g;

/**
 * Renders a piece of copy. Any "[TODO: ...]" in the text becomes a clearly
 * marked placeholder chip, so missing content is visible but never breaks the layout.
 */
export function Rich({ text }: { text: Text }) {
  const { t, ui } = useI18n();
  const parts = t(text).split(TODO);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('[TODO:') ? (
          <mark key={i} className="todo" title={ui.todo}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export const pad = (n: number) => String(n).padStart(2, '0');

/** URL of a file in /public. Works at a domain root and under a sub-path such as GitHub Pages. */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');
