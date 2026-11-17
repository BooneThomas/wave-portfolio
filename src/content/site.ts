import type { About, Site } from './types';

export const site: Site = {
  name: 'Thomas Boone',
  role: 'Data & AI Engineer | Cloud Solutions',
  location: 'Ghent, Belgium',
  // Change this when the site moves to another address.
  url: 'https://boonethomas.github.io/wave-portfolio/',
  intro:
    'I build data pipelines and AI systems on Azure and AWS. Every light on the water is something I worked on.',
  links: {
    // Leave one empty and its contact button shows a visible placeholder instead.
    linkedin: 'https://www.linkedin.com/in/thomas-boone-b67719334/',
    email: 'thomasbooneprof@gmail.com',
  },
  seo: {
    title: 'Thomas Boone | Data & AI Engineer',
    description:
      'Portfolio of Thomas Boone, Data & AI Engineer from Ghent, Belgium. Data engineering, cloud and agentic AI projects, shown inside a 3D ocean wave.',
    jobTitle: 'Data & AI Engineer',
  },
};

export const about: About = {
  lead: 'I like data work that keeps running after the demo: tested pipelines, repeatable deployments and models you can check.',
  paragraphs: [
    'I am Thomas, a data and AI engineer from Ghent. I graduated in October 2026 with a Bachelor in Applied Computer Science (AI & Data Engineering) at HOGENT, and I am still enrolled there for 2026-2027.',
    'In September 2027 I start the Master of Science in Applied IT at Fontys in Eindhoven.',
    'So far I have worked as a data engineering intern at VLAIO, built an AI agent on Amazon Bedrock AgentCore, and finished second with my team in the Hack The Future hackathon.',
  ],
  facts: [
    { label: 'Based in', value: 'Ghent, Belgium' },
    { label: 'Profile', value: 'Data & AI Engineer | Cloud Solutions' },
    { label: 'Degree', value: 'BSc Applied Computer Science, HOGENT (2026)' },
    { label: 'Next', value: 'MSc Applied IT, Fontys (from September 2027)' },
  ],
};
