import type { SkillGroup, TimelineEntry } from './types';

/** Experience, education and awards. Newest or upcoming first. */
export const timeline: TimelineEntry[] = [
  {
    id: 'fontys-msc',
    type: 'education',
    title: 'Master of Science in Applied IT',
    organisation: 'Fontys',
    location: 'Eindhoven, Netherlands',
    period: 'Starting September 2027',
  },
  {
    id: 'hogent-bsc',
    type: 'education',
    title: 'Bachelor in Applied Computer Science, AI & Data Engineering',
    organisation: 'HOGENT',
    location: 'Ghent, Belgium',
    period: 'Graduated October 2026',
    description: 'Still enrolled for 2026-2027. Bachelor thesis on AI-supported test automation.',
    projectId: 'bachelor-thesis',
  },
  {
    id: 'vlaio',
    type: 'work',
    title: 'Data Engineer intern',
    organisation: 'VLAIO (Flemish Government)',
    period: '[TODO: internship period]',
    description:
      'Python testing framework for Azure Databricks, CI/CD in Azure DevOps with SonarQube quality gates, and dimensional modeling with stakeholders.',
    projectId: 'vlaio-internship',
  },
  {
    id: 'aws-deloitte-summit',
    type: 'award',
    title: 'Presented at the AWS x Deloitte Student Innovation Summit',
    organisation: 'AWS x Deloitte',
    period: '2026',
    description: 'Presented my customer support agent built on Amazon Bedrock AgentCore.',
    projectId: 'agentic-ai',
  },
  {
    id: 'htf',
    type: 'award',
    title: 'Second place, Hack The Future',
    organisation: 'Hack The Future hackathon',
    period: '[TODO: date]',
    description: 'Second place with my team.',
    projectId: 'hack-the-future',
  },
];

export const skills: SkillGroup[] = [
  {
    id: 'cloud',
    label: 'Cloud & platforms',
    items: ['Azure', 'AWS', 'Databricks', 'Azure DevOps', 'Docker'],
  },
  {
    id: 'data',
    label: 'Data engineering',
    items: ['Python', 'SQL', 'Java', 'CI/CD', 'MLflow', 'SonarQube', 'Git', 'Power BI'],
  },
  {
    id: 'ai',
    label: 'AI & machine learning',
    items: ['TensorFlow/Keras', 'Scikit-Learn', 'Time Series', 'GenAI/LLMs', 'NLP'],
  },
  {
    id: 'ways',
    label: 'Ways of working',
    items: ['Agile', 'BPMN'],
  },
];
