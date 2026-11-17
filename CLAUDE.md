# Wave portfolio: permanent rules

Portfolio of Thomas Boone, built around one 3D ocean wave. Read `PROGRESS.md` (status) and `DESIGN.md` (art direction) before changing anything. Do not change the style without a reason written down in `DESIGN.md`.

## Rules

- Everything is in English: site copy, comments, commit messages, docs.
- All content lives in `src/content/*.ts` (typed). Interface strings live in `src/i18n/en.ts`. Never hard-code copy in components.
- Never invent numbers, results, dates or technical details. Missing information is written as `[TODO: what is missing]` inside the content string; the site renders it as a visible placeholder chip.
- No tracking, no analytics, no third-party requests, no secrets, no phone number. Fonts are self-hosted through `@fontsource-variable`.
- Contact area: LinkedIn and email only.
- Adding a project is adding one object to `src/content/projects.ts`. The scene places it by itself (`src/scene/layout.ts`); never position lights by hand.
- The 3D scene is plain Three.js in `src/scene/` and is lazy-loaded. React components never import from `three`.
- Keep the three fallbacks working: reduced motion (static frame, instant camera cuts), low tier (lighter mesh and shaders), no WebGL (poster image and the same project links).
- Colours, type and spacing come from the tokens in `src/styles/global.css`. Scene colours are documented in `DESIGN.md`.
- Work in phases. Finish one, update `PROGRESS.md`, then commit and push with a clear message.

## Commands

- `npm run dev`: local dev server
- `npm run build`: type check, production build and prerender to `dist/`
- `npm run preview`: serve `dist/`
- `npm run lint`, `npm run typecheck`, `npm test`

## Map

- `src/content/`: all content and its types
- `src/i18n/`: interface strings and the locale helper
- `src/scene/`: wave shape (`waveProfile.ts`), mesh, shaders, lights, layout, camera (`WaveScene.ts`)
- `src/components/`: `Hero` (scene, project links, panel), `Sections`, `Nav`
- `scripts/prerender.mjs`: writes the page content into `dist/index.html`

## Environment

- Node 20.17 on the dev machine: stay on Vite 6 and Vitest 3 (newer majors need a newer Node).
