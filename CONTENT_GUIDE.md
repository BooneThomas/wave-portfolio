# Content guide

Everything you can read on the site comes from four files. Edit them, save, done. No component needs to change.

| What | File |
| --- | --- |
| Projects | `src/content/projects.ts` |
| Experience, education, skills | `src/content/experience.ts` |
| Name, role, intro, about, contact, SEO | `src/content/site.ts` |
| Buttons, labels, hints | `src/i18n/en.ts` |

Rules:

- Never invent numbers, results or dates. If something is unknown, write `[TODO: what is missing]` inside the string. It shows up on the site as a dashed placeholder.
- Run `npm run build` after editing. TypeScript will tell you if a field is missing or misspelled.

## Add a project

Add one object to the `projects` array in `src/content/projects.ts`. Its position in the array is its number, its place in the list and its place in the scene (first = open sea, last = deepest in the barrel). The light is placed and sized automatically.

```ts
{
  id: 'my-project',                 // unique, lowercase, dashes only; used in the URL
  title: 'Project title',
  kind: 'project',                  // 'internship' | 'project' | 'hackathon' | 'thesis'
  organisation: 'Company or context',   // optional
  period: 'Feb - May 2027',             // optional, free text
  summary: 'One or two sentences. Shown in the list and at the top of the panel.',
  highlights: [
    'What you built or did, one short sentence.',
    'Another one.',
  ],
  result: '[TODO: result]',         // optional
  note: 'Presented at ...',         // optional, shown as a side note
  tech: ['Python', 'Azure'],
  links: [                          // optional
    { label: 'Source code', href: 'https://github.com/...' },
  ],
  image: {                          // optional, file goes in /public
    src: 'projects/my-project.jpg',
    alt: 'Describe what the image shows.',
    width: 1200,
    height: 800,
  },
},
```

To remove a project, delete its object. To reorder, move it.

## Add experience, education or recognition

Add one object to `timeline` in `src/content/experience.ts`. Order in the file is the order on the page (newest first).

```ts
{
  id: 'unique-id',
  type: 'work',                     // 'work' | 'education' | 'award'
  title: 'Role or degree',
  organisation: 'Company or school',
  location: 'City, Country',        // optional
  period: 'Sep 2027 - Jun 2028',
  description: 'One or two sentences.',   // optional
  projectId: 'my-project',          // optional: adds a "See the project" link
},
```

## Skills

In `src/content/experience.ts`. Add an item to a group, or add a group:

```ts
{
  id: 'new-group',
  label: 'Group title',
  items: ['Skill one', 'Skill two'],
},
```

## Text, contact and SEO

In `src/content/site.ts`:

- `site.role`, `site.intro`: the lines around the name on the first screen.
- `site.links.linkedin`: full URL, for example `https://www.linkedin.com/in/your-handle/`.
- `site.links.email`: the address only, no `mailto:`.
- `site.url`: public address of the site (canonical link and link previews).
- `site.seo`: page title and description for search engines and link previews.
- `about.lead`, `about.paragraphs`, `about.facts`: the About section.

## Add Dutch later

Every piece of content is a `Text`: a plain string (English) or an object with translations.

```ts
title: 'Energy Prices',                                   // English only
title: { en: 'Energy Prices', nl: 'Energieprijzen' },     // translated
```

Steps:

1. Copy `src/i18n/en.ts` to `src/i18n/nl.ts`, translate the values, and type it as `UiStrings`.
2. Register it in `src/i18n/index.tsx` (`const dictionaries = { en, nl }`).
3. Add `'nl'` to `locales` in `src/content/types.ts`.
4. Turn content strings into `{ en: '...', nl: '...' }` where you want a translation. Anything left as a plain string stays English.
5. Add a language switch that sets the locale in `src/App.tsx` (the state is already there).

## Changing the look

Not content, so not here. Read `DESIGN.md` first; colours and type are tokens at the top of `src/styles/global.css`.
