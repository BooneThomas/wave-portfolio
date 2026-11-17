import type { Project } from './types';

/**
 * All projects. The order here is the order in the overview list and
 * the order of the lights in the 3D scene (first = open sea, last = deep in the barrel).
 * Adding a project = adding one object. The scene places it automatically.
 */
export const projects: Project[] = [
  {
    id: 'vlaio-internship',
    title: 'Data Engineer internship',
    kind: 'internship',
    organisation: 'VLAIO (Flemish Government)',
    period: '[TODO: internship period]',
    summary:
      'Made ETL processes and ML notebooks on Azure Databricks more reliable with a Python testing framework and an end-to-end CI/CD pipeline.',
    highlights: [
      'Built a Python testing framework for Azure Databricks, covering ETL processes and ML notebooks.',
      'Set up end-to-end CI/CD in Azure DevOps with SonarQube quality gates and branch policies.',
      'Worked with stakeholders on dimensional modeling and the Medallion architecture.',
    ],
    result: '[TODO: result of the internship]',
    tech: ['Python', 'Azure Databricks', 'Azure DevOps', 'CI/CD', 'SonarQube', 'Medallion architecture', 'Dimensional modeling'],
  },
  {
    id: 'smart-campus',
    title: 'Smart Campus',
    kind: 'project',
    organisation: 'Data engineering',
    summary:
      'An automated pipeline that turns campus WiFi and API data into attendance forecasts and dashboards for facility management.',
    highlights: [
      'Automated ETL pipeline that loads campus WiFi and API data into a data warehouse.',
      'Machine learning models that forecast student attendance.',
      'Power BI dashboards for facility management.',
    ],
    result: '[TODO: result]',
    tech: ['Python', 'SQL', 'ETL', 'Data warehouse', 'Machine learning', 'Power BI'],
  },
  {
    id: 'energy-prices',
    title: 'Energy Prices',
    kind: 'project',
    organisation: 'Data engineering',
    summary:
      'ETL pipelines for large volumes of energy market data, with a time series model for price trends.',
    highlights: [
      'ETL pipelines in Python and SQL that process large volumes of energy market data.',
      'Time series model for price trends.',
    ],
    result: '[TODO: result]',
    tech: ['Python', 'SQL', 'ETL', 'Time series'],
  },
  {
    id: 'agentic-ai',
    title: 'Customer support AI agent',
    kind: 'project',
    organisation: 'Agentic AI on Amazon Bedrock AgentCore',
    period: '2026',
    summary:
      'A customer support agent on serverless AWS, with persistent memory, authenticated tools, policies and continuous evaluation.',
    highlights: [
      'Agent built with the Strands Agents SDK and Claude Sonnet 4.6, running serverless on AWS.',
      'Persistent memory, and Lambda tools exposed through AgentCore Gateway.',
      'Cognito JWT authentication and Cedar policies.',
      'Traces, continuous evaluations and A/B-tested prompts.',
    ],
    note: 'Presented at the AWS x Deloitte Student Innovation Summit (2026).',
    tech: ['Amazon Bedrock AgentCore', 'Strands Agents SDK', 'Claude Sonnet 4.6', 'AWS Lambda', 'Amazon Cognito', 'Cedar', 'GenAI / LLMs'],
  },
  {
    id: 'hack-the-future',
    title: 'Hack The Future',
    kind: 'hackathon',
    organisation: 'Team entry',
    period: '[TODO: date]',
    summary: 'Second place with my team in the Hack The Future hackathon.',
    highlights: [
      '[TODO: the challenge we worked on]',
      '[TODO: what we built and my part in it]',
    ],
    result: 'Second place.',
    tech: ['[TODO: tech used]'],
  },
  {
    id: 'bachelor-thesis',
    title: 'AI-supported test automation',
    kind: 'thesis',
    organisation: 'HOGENT',
    period: '[TODO: period]',
    summary: 'My bachelor thesis on AI-supported test automation. [TODO: one-sentence summary]',
    highlights: [
      '[TODO: research question]',
      '[TODO: approach and tools]',
    ],
    result: '[TODO: conclusion]',
    tech: ['[TODO: tech used]'],
  },
];
