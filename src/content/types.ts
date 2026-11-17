/**
 * Content types. Every piece of site content is typed here.
 * See CONTENT_GUIDE.md for copy-paste templates.
 */

/** Add a locale here (and in src/i18n) to enable a new language. */
export const locales = ['en'] as const;
export type Locale = (typeof locales)[number] | 'nl';
export const defaultLocale: Locale = 'en';

/**
 * A piece of copy. A plain string is English.
 * To translate, use an object: { en: 'Hello', nl: 'Hallo' }.
 * Missing translations fall back to English.
 */
export type Text = string | ({ en: string } & Partial<Record<Locale, string>>);

export type ProjectKind = 'internship' | 'project' | 'hackathon' | 'thesis';

export interface Link {
  label: Text;
  href: string;
}

export interface Project {
  /** Unique, URL-safe slug. Used in links: #/project/<id>. */
  id: string;
  title: Text;
  kind: ProjectKind;
  /** Company, client, school or platform. */
  organisation?: Text;
  /** Free text, for example "Feb – May 2026". */
  period?: Text;
  /** One or two sentences. Shown in the overview list and at the top of the detail panel. */
  summary: Text;
  /** What was built or done. One short sentence per item. */
  highlights: Text[];
  /** Outcome or result. Use "[TODO: ...]" when unknown. Never invent numbers. */
  result?: Text;
  /** Extra remark, for example where the work was presented. */
  note?: Text;
  tech: string[];
  links?: Link[];
  /** Optional image, stored in /public. Alt text is required. */
  image?: { src: string; alt: Text; width: number; height: number };
}

export type TimelineType = 'work' | 'education' | 'award';

export interface TimelineEntry {
  id: string;
  type: TimelineType;
  title: Text;
  organisation: Text;
  location?: Text;
  period: Text;
  description?: Text;
  /** Optional id of a project that tells the full story. */
  projectId?: string;
}

export interface SkillGroup {
  id: string;
  label: Text;
  items: string[];
}

export interface Site {
  name: string;
  role: Text;
  location: Text;
  /** Public URL of the deployed site, used for canonical and Open Graph tags. */
  url: string;
  /** One short paragraph under the name in the hero. */
  intro: Text;
  links: {
    /** Full LinkedIn profile URL. Empty string shows a visible TODO placeholder. */
    linkedin: string;
    /** Email address. Empty string shows a visible TODO placeholder. */
    email: string;
  };
  seo: { title: string; description: string; jobTitle: string };
}

export interface About {
  /** Short statement shown large. */
  lead: Text;
  paragraphs: Text[];
  /** Small key/value facts next to the text. */
  facts: { label: Text; value: Text }[];
}
