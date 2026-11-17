# Design: "First light"

## The idea

One heavy wave at the moment it curls over, seen at first light. The water is cold and dark; the only warm things in the picture are the rising sun and the projects. Each project is a **glass fishing float with a light inside**, drifting on the water.

The page has two surfaces:

1. **The wave** (first screen and the project panel): dark, atmospheric, with one warm accent (ember) that belongs to the lights.
2. **The page below it**: neutral and quiet, in the manner of Apple's product pages. White, light grey and black, large semibold headlines, rounded white tiles, no colour accents.

The contrast is deliberate: the wave is the experience, the page is the paperwork.

## Scene

- **Wave**: one continuous sheet built from cross-sections (`src/scene/waveProfile.ts`). A master curve is defined by its tangent angle; along the crest line each cross-section uses more of that curve, so the lip grows out of the swell like a peeling wave. Left is the unbroken shoulder, the middle is the open barrel, right it closes, and far down the line it collapses into whitewater.
- **Motion**: the shape stands still (the camera travels with the wave). Life comes from the water texture flowing up the face and over the lip, a slow breathing of the surface, spindrift blowing back off the crest, mist where the lip lands, bobbing floats and a gentle camera drift.
- **Light**: the sun sits low at the point where the wave line meets the horizon. Thin water (the lip, the roof of the barrel) glows sea-glass green when it is backlit. Inside the barrel there is less sky and more dark water.
- **Camera**: the home view looks down the line into the barrel. Dragging orbits within limits, the pointer adds a small parallax. Selecting a project flies to it: open-sea floats are seen with the wave as backdrop, barrel floats from inside the tube. Flights in or out of the barrel bend through its open mouth and under the roof, never through the lip.

### Where the lights go (`src/scene/layout.ts`)

The order of the projects is a short journey into the wave:

| Project | Place |
| --- | --- |
| 1 | on the open sea, in front of the wave |
| 2 | in the trough, at the mouth of the barrel |
| 3 | just inside the mouth, under the lip |
| 4 and up | in a line down the barrel, each one deeper than the last |

The first three places are fixed. Every further project joins the line in the barrel, and the barrel grows longer when the line needs room (`barrelEndFor`), so the number of projects is unlimited.

From the home view the lights in the barrel are hidden behind the falling lip. One label on the lip ("04-06 inside the barrel") stands for them and opens the first one. Once the camera is inside (from project 3 on), every light in view has its own label again.

### Scene palette (linear values in `src/scene/shaders.ts`)

| Role | Value |
| --- | --- |
| Deep water | `0.004, 0.030, 0.052` |
| Mid water | `0.010, 0.105, 0.135` |
| Sea-glass (thin water) | `0.022, 0.215, 0.195` |
| Backlit glow | `0.42, 0.62, 0.30` |
| Barrel mist | `0.020, 0.075, 0.095` |
| Sky: zenith / cold horizon / warm horizon | `0.004, 0.010, 0.034` / `0.030, 0.055, 0.105` / `0.95, 0.36, 0.13` |
| Ember (lights) | `1.0, 0.36, 0.07` |

## Interface (`src/styles/global.css`)

### Type

One family for everything: **the system font on Apple devices (SF Pro), Inter everywhere else**. SF Pro may only be used on Apple platforms and cannot be shipped with a website, so the stack asks for `-apple-system` first and falls back to Inter (self-hosted, variable), which is the closest open typeface.

- Headlines: weight 600, tracking -0.028em, line-height 1.06.
- Body: 17px, line-height 1.47, tracking -0.011em.
- Sub-headlines and leads: weight 500 or 600, 20 to 28px, grey on the light page.
- Small labels are sentence case, weight 600. No uppercase tracking.
- Numbers are tabular.

### Colour

Components only use semantic tokens. Each surface redefines them.

| Token | Wave (dark) | Page (light) | Contact and footer (black) |
| --- | --- | --- | --- |
| `--bg` | `#04121a` | `#f5f5f7` (About: `#fff`) | `#000` |
| `--text` | `#f5f5f7` | `#1d1d1f` | `#f5f5f7` |
| `--text-dim` | `#b4bcc0` | `#6e6e73` | `#a1a1a6` |
| `--label` | `#8fe3cf` (sea-glass) | `#6e6e73` | `#a1a1a6` |
| `--accent` | `#ffb454` (ember) | `#1d1d1f` | `#f5f5f7` |
| `--number` | ember | `#86868b` | `#86868b` |
| `--hairline` | white 16% | `#d2d2d7` | `#424245` |
| `--focus` | ember | `#0071e3` | `#2997ff` |

Ember appears only in the wave: light numbers, the selected state, bullet points in the panel, and placeholders.

### Shape

- Pills for anything you can press. Solid pill = primary (black on light, white on black).
- White tiles with a 20px radius on the grey page: the project list, the skill groups. A grey tile on the white About section.
- Hairlines inside tiles, no drop shadows.
- The navigation bar is clear over the wave and turns into frosted white once the page is light.
- Placeholders: `[TODO: ...]` renders as a dashed chip (ember on dark, brown on light).

## Layout decisions

- The page is one scroll: the wave fills the first screen, then Projects (plain list), About, Experience and education, Contact.
- Sections are full-width colour bands; their content keeps to a 76rem measure.
- Project details open in a panel inside the wave section: beside the scene on wide screens, as a bottom sheet on phones. The scene shifts its view so the selected light stays visible next to the panel.
- The selected project lives in the URL (`#/project/<id>`), so the back button and shared links work.
- Vertical swipes on the scene scroll the page; horizontal drags turn the camera. The wheel is never hijacked.
- On phones the copy sits over the sky, labels are numbers only (pins above the lights), and the camera looks down a little more so the lights spread over the height of the screen.

## Decisions log

- Plain Three.js instead of React Three Fiber: smaller bundle, full control over the render loop, and the scene stays separate from the content.
- Static wave shape with flowing texture instead of a simulated surface: cheaper, more controllable, and the floats stay seated on the water.
- Labels are DOM links, not sprites: keyboard, screen readers and tap targets come for free.
- The page is prerendered at build time so the content is in the HTML for search engines and no-JS visitors.
- Contact links are placeholders until Thomas fills them in: his email is not published without his say.
- 2026-11-17, at Thomas's request: Apple-like typography and a white, grey and black page below the wave (was a serif on dark ink); projects 1 to 3 at the mouth of the wave, all others in the barrel (was one path from the far open sea into the barrel).
