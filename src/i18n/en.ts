/** Interface strings (labels, buttons, hints). Content lives in src/content. */
export const en = {
  skipToOverview: 'Skip to the project overview',
  nav: {
    label: 'Main',
    wave: 'The wave',
    projects: 'Projects',
    about: 'About',
    experience: 'Experience',
    contact: 'Contact',
    menu: 'Menu',
    closeMenu: 'Close menu',
  },
  scene: {
    sectionLabel: 'The wave: all projects as lights on the water',
    floatsLabel: 'Projects in the scene',
    hint: 'Drag or use the arrow keys to look around. Pick a light to open a project.',
    hintTouch: 'Swipe sideways to look around. Tap a light to open a project.',
    overviewCta: 'See all projects as a list',
    pause: 'Pause motion',
    play: 'Play motion',
    reset: 'Reset view',
    loading: 'Loading the wave',
    fallback: 'The 3D scene is not available on this device. All projects are listed below.',
    open: 'Open project',
    canvasAlt:
      'A large ocean wave curling over at first light. Small warm lights float on the water, one for each project.',
  },
  panel: {
    close: 'Back to the wave',
    previous: 'Previous',
    next: 'Next',
    of: 'of',
    highlights: 'What I did',
    result: 'Result',
    tech: 'Tech',
    links: 'Links',
    keys: 'Arrow keys: next and previous. Esc: back to the wave.',
  },
  kinds: {
    internship: 'Internship',
    project: 'Project',
    hackathon: 'Hackathon',
    thesis: 'Thesis',
  },
  overview: {
    title: 'Projects',
    intro: 'Everything in the wave, as a plain list. Select a row to open it.',
    viewInWave: 'Open',
  },
  about: { title: 'About' },
  experience: {
    title: 'Experience & education',
    skills: 'Skills',
    types: { work: 'Work', education: 'Education', award: 'Recognition' },
    seeProject: 'See the project',
  },
  contact: {
    title: 'Contact',
    lead: 'Want to talk about data, cloud or AI work? Get in touch.',
    linkedin: 'LinkedIn',
    email: 'Send an email',
    todoLinkedin: '[TODO: LinkedIn URL]',
    todoEmail: '[TODO: email address]',
  },
  footer: {
    built: 'Built with Three.js and React. No tracking, no cookies.',
    top: 'Back to the top',
  },
  todo: 'To be added',
  language: 'Language',
};

export type UiStrings = typeof en;
