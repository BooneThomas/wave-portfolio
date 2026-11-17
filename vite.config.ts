import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import react from '@vitejs/plugin-react';
import { site } from './src/content/site';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Fills the SEO / Open Graph tags in index.html from src/content/site.ts. */
function seo(): Plugin {
  return {
    name: 'wave-seo',
    transformIndexHtml(html) {
      const url = site.url.replace(/\/?$/, '/');
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: site.name,
        jobTitle: site.seo.jobTitle,
        url,
        address: { '@type': 'PostalAddress', addressLocality: 'Ghent', addressCountry: 'BE' },
        ...(site.links.linkedin ? { sameAs: [site.links.linkedin] } : {}),
      };
      return html
        .replaceAll('%SITE_TITLE%', esc(site.seo.title))
        .replaceAll('%SITE_DESCRIPTION%', esc(site.seo.description))
        .replaceAll('%SITE_URL%', esc(url))
        .replaceAll('%SITE_NAME%', esc(site.name))
        .replaceAll('%SITE_JSONLD%', JSON.stringify(jsonLd).replace(/</g, '\u003c'));
    },
  };
}

export default defineConfig({
  // Relative base: the build works at a domain root and under /repo-name/ on GitHub Pages.
  base: './',
  plugins: [react(), seo()],
  build: { target: 'es2022', chunkSizeWarningLimit: 700 },
  test: { include: ['src/**/*.test.ts'] },
});
