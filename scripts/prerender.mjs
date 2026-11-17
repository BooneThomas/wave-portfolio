// Renders the app to static HTML after the build, so the content is in index.html
// for search engines, link previews and visitors without JavaScript.
import { readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const { render } = await import(pathToFileURL(resolve(root, 'dist-ssr/entry-server.js')).href);
const file = resolve(root, 'dist/index.html');
const html = await readFile(file, 'utf8');
const marker = '<!--app-->';
if (!html.includes(marker)) throw new Error('prerender: marker not found in dist/index.html');
await writeFile(file, html.replace(marker, render()));
await rm(resolve(root, 'dist-ssr'), { recursive: true, force: true });
console.log('prerender: content written to dist/index.html');
