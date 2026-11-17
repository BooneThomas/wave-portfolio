# Progress

Resume here. Read `CLAUDE.md` and `DESIGN.md` first.

## Phases

1. **Foundation and scene** (done): Vite + React + TypeScript scaffold, typed content, i18n helper, wave geometry and shaders, sky, spray, floats, auto layout, camera rig, labels, detail panel, page sections.
2. **Polish of scene and responsive layout** (done): portrait framing with compact light layout, copy on top on phones, lights kept clear of the hero copy, wider focus shots, lip shading.
3. **Fallbacks and accessibility** (done): reduced motion, low tier, no-WebGL poster, no-JS prerendered content, keyboard path, focus handling in the panel.
4. **Delivery** (done): poster and Open Graph image, production build, README, CONTENT_GUIDE, GitHub Pages workflow, final verification.

## Last verification (production build, headless Edge)

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: all pass.
- Viewports 320x568, 375x812, 768x1024, 1024x768, 1440x900, 1920x1080: no horizontal scroll, all lights inside the frame, no console or hydration errors, tap targets at least 40px.
- Keyboard: skip link first, all lights reachable by Tab, Enter opens the panel and moves focus into it, Back / Previous / Next reachable, arrow keys step through projects, Esc closes and focus returns to the light.
- Reduced motion: two frames 1.5s apart are identical; a Play button is offered.
- No WebGL: poster image and working project links. No JavaScript: all content is in the HTML.
- Rough performance on the dev laptop (integrated AMD Radeon, 1440x900): first contentful paint about 0.5s, scene ready about 1.7s, about 290 kB transferred, well above 60 fps.

- Cross-browser (Playwright): Firefox desktop and phone-sized, WebKit desktop, WebKit with iPhone 13, iPhone SE and iPad profiles, Chromium with a Pixel 7 profile. In each: scene renders, a light opens its project, the panel closes, no horizontal scroll, no errors.

Not verified: physical phones (WebKit emulation is close to Safari on iOS, not identical) and screen readers.

## Open items

- Test once on a physical iPhone and with a screen reader.
- GitHub Pages is enabled (source: GitHub Actions); every push to `main` deploys to https://boonethomas.github.io/wave-portfolio/.
- Ideas, not started: Dutch translation and language switch, project images, a subtle sound toggle, labels showing titles on phones.

## Content still missing (shown on the site as placeholders)

- LinkedIn URL and email address (`src/content/site.ts`)
- VLAIO internship: period and result
- Smart Campus and Energy Prices: result
- Hack The Future: date, challenge, what was built, tech
- Bachelor thesis: period, summary, research question, approach, conclusion, tech
