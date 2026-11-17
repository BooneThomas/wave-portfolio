# The Wave: portfolio of Thomas Boone

A portfolio built around one 3D ocean wave at first light. Every project is a glass float with a light inside, drifting on the water: on the open sea, in the trough and deep in the barrel. Select a light and the camera flies to it and opens the project.

Built with Vite, React, TypeScript and plain Three.js. No tracking, no cookies, no third-party requests.

## Run it

Requires Node 20 or newer.

```bash
npm install
npm run dev        # local dev server
npm run build      # type check + production build + prerender, output in dist/
npm run preview    # serve the production build locally
npm run lint
npm test
```

## Edit the content

All content lives in typed files. Components contain no copy.

| What | File |
| --- | --- |
| Projects | `src/content/projects.ts` |
| Experience, education, skills | `src/content/experience.ts` |
| Name, role, intro, about text, contact links, SEO | `src/content/site.ts` |
| Buttons, labels, hints | `src/i18n/en.ts` |

Adding a project is adding one object to `projects.ts`. The scene places and scales the lights by itself, for any number of projects.

**[CONTENT_GUIDE.md](CONTENT_GUIDE.md)** has copy-paste templates for everything.

Missing information is written as `[TODO: ...]` inside a content string. The site shows it as a dashed placeholder chip, so it is easy to spot and never breaks the layout. Search the project for `[TODO:` to find what is left.

## How it holds up

- **Navigation**: the wave is the first screen; below it the page continues with a plain project list, About, Experience and education, and Contact. Every project is reachable from the list, with or without the 3D scene.
- **Controls**: drag or swipe sideways to look around, click or tap a light to open it. Keyboard: `Tab` to a light, `Enter` to open, `←` `→` for the previous and next project, `Esc` to go back. With no project open, `←` `→` turn the view.
- **Reduced motion**: with `prefers-reduced-motion` the scene renders still frames and the camera cuts instead of flying. There is also a pause button for everyone.
- **Weak devices**: phones and slow GPUs get a lighter mesh, cheaper shaders and a lower resolution. If frames stay slow, the resolution drops further. Add `?quality=low` or `?quality=high` to the URL to force a tier.
- **No WebGL**: a still image of the wave with the same project links as a list.
- **No JavaScript**: the content is prerendered into `index.html`.

## Deploy

The build is a static folder (`dist/`) with relative paths, so it works on any static host, at a domain root or in a sub-folder.

### GitHub Pages (simplest, already set up)

1. On GitHub, open the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` lints, tests, builds and publishes.
3. The site appears at `https://boonethomas.github.io/wave-portfolio/`.

Until step 1 is done the workflow only runs the checks and skips the deploy.

### Anywhere else (Netlify, Vercel, Cloudflare Pages)

Build command `npm run build`, output folder `dist`.

### After the address is known

Set `url` in `src/content/site.ts` to the public address. It is used for the canonical link and the Open Graph image.

## Project structure

```
src/
  content/      all content and its types
  i18n/         interface strings, locale helper (English now, Dutch-ready)
  scene/        the 3D scene (plain Three.js, lazy-loaded)
    waveProfile.ts   the shape of the wave as math
    waveGeometry.ts  the mesh
    shaders.ts       water, sky, spray, floats
    layout.ts        automatic placement of the project lights
    WaveScene.ts     renderer, camera, input, labels
  components/   Hero (scene + panel), Sections, Nav
  styles/       design tokens and all CSS
scripts/prerender.mjs   writes the page content into dist/index.html
public/         favicon, poster.jpg (no-WebGL image), og.jpg (link preview)
```

`DESIGN.md` describes the art direction and tokens, `PROGRESS.md` the status, `CLAUDE.md` the permanent rules for AI assistants working on this repo.

`public/poster.jpg` and `public/og.jpg` are stills of the scene. If the look of the scene changes a lot, take new screenshots (1600x900 and 1200x630) and replace them.

## Open TODOs

- Contact: fill in `linkedin` and `email` in `src/content/site.ts`. Until then the buttons show a placeholder.
- VLAIO internship: period and result.
- Smart Campus, Energy Prices: result.
- Hack The Future: date, the challenge, what was built, tech used.
- Bachelor thesis: period, one-sentence summary, research question, approach, conclusion, tech used.
- Enable GitHub Pages (see Deploy) and confirm the public URL in `src/content/site.ts`.
- Optional: Dutch translation (see CONTENT_GUIDE.md), project images or links.
