# Design: "First light"

## The idea

One heavy wave at the moment it curls over, seen at first light. The water is cold and dark; the only warm things in the picture are the rising sun and the projects. Each project is a **glass fishing float with a light inside**, drifting on the water: some on the open sea, some in the trough, some deep in the barrel. Cold water, warm lights. That contrast is the whole design, in the scene and in the interface.

The site should feel calm and made by hand: few colours, one serif, generous space, slow motion.

## Scene

- **Wave**: one continuous sheet built from cross-sections (`src/scene/waveProfile.ts`). A master curve is defined by its tangent angle; along the crest line each cross-section uses more of that curve, so the lip grows out of the swell like a peeling wave. Left is the unbroken shoulder, the middle is the open barrel, right it closes and collapses into whitewater.
- **Motion**: the shape stands still (the camera travels with the wave). Life comes from the water texture flowing up the face and over the lip, a slow breathing of the surface, spindrift blowing back off the crest, mist where the lip lands, bobbing floats and a gentle camera drift.
- **Light**: the sun sits low at the point where the wave line meets the horizon. Thin water (the lip, the roof of the barrel) glows sea-glass green when it is backlit. Inside the barrel there is less sky and more dark water.
- **Camera**: the home view looks down the line into the barrel. Dragging orbits within limits, the pointer adds a small parallax. Selecting a project flies to it: open-sea floats are seen with the wave as backdrop, barrel floats from inside the tube. Flights in or out of the barrel pass through its open mouth.
- **Project lights**: placed automatically along one path from the open sea into the barrel (`src/scene/layout.ts`). More projects means smaller lights, closer together. Each light has a real link on top of it (number and title); labels that would collide collapse to their number.

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

## Interface tokens (`src/styles/global.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--ink-900` | `#04121a` | page background |
| `--ink-800` | `#071c26` | raised surfaces |
| `--foam` | `#f3eee3` | text |
| `--foam-dim` | `#a9bcbc` | secondary text (9:1 on ink) |
| `--glass` | `#8fe3cf` | labels, eyebrows, education markers |
| `--ember` | `#ffb454` | the one accent: numbers, links, focus, active states |
| `--line` | foam at 14% | hairlines |

- **Type**: Fraunces (variable, display: headings, numbers, lead paragraphs) and Instrument Sans (variable, text). Both self-hosted. Headings are light (weight 380) with tight tracking. Small labels are uppercase with 0.14em tracking.
- **Shape**: pills for anything you can press, hairlines instead of boxes, no drop shadows.
- **Numbers**: projects are numbered `01`, `02`, ... in Fraunces, ember. The same number appears on the light, in the list and in the panel.
- **Placeholders**: `[TODO: ...]` renders as a dashed ember chip.

## Layout decisions

- The page is one scroll: the wave fills the first screen, then Projects (plain list), About, Experience and education, Contact.
- Project details open in a panel inside the wave section: beside the scene on wide screens, as a bottom sheet on phones. The scene shifts its view so the selected light stays visible next to the panel.
- The selected project lives in the URL (`#/project/<id>`), so the back button and shared links work.
- Vertical swipes on the scene scroll the page; horizontal drags turn the camera. The wheel is never hijacked.

## Decisions log

- Plain Three.js instead of React Three Fiber: smaller bundle, full control over the render loop, and the scene stays separate from the content.
- Static wave shape with flowing texture instead of a simulated surface: cheaper, more controllable, and the floats stay seated on the water.
- Labels are DOM links, not sprites: keyboard, screen readers and tap targets come for free.
- The page is prerendered at build time so the content is in the HTML for search engines and no-JS visitors.
- Contact links are placeholders until Thomas fills them in: his email is not published without his say.
