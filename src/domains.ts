// Static catalog of suggested ontology domains.
// Users can also add custom domains via free-text in prompts.

export interface Domain {
  key: string;
  label: string;
  description: string;
  examples: string;
}

export const DEFAULT_DOMAINS: readonly Domain[] = [
  {
    key: 'tech',
    label: 'Tech / AI / Programming',
    description: 'Technology, AI, programming, system design',
    examples: 'transformer architecture, Rust ownership, RAG patterns',
  },
  {
    key: 'finance',
    label: 'Finance / Investing / Business',
    description: 'Investing, finance, business, startups',
    examples: 'DCF valuation, Kelly criterion, SaaS economics',
  },
  {
    key: 'reading',
    label: 'Reading / Humanities / Philosophy',
    description: 'Books, humanities, philosophy, history',
    examples: 'Thinking Fast and Slow, Stoicism, cognitive biases',
  },
  {
    key: 'growth',
    label: 'Personal Growth / Learning',
    description: 'Personal growth, learning methods, productivity',
    examples: 'spaced repetition, deep work, mental models',
  },
  {
    key: 'insights',
    label: 'Cross-domain Insights',
    description: 'Insights spanning two or more domains',
    examples: 'AI impact on labor markets, philosophy and decision-making',
  },
] as const;

export const ADDITIONAL_DOMAIN_CATALOG: readonly Domain[] = [
  {
    key: 'art',
    label: 'Art / Design',
    description: 'Visual design, music, creative arts',
    examples: 'typography, color theory, generative art',
  },
  {
    key: 'health',
    label: 'Health / Fitness',
    description: 'Health, fitness, sleep, nutrition',
    examples: 'VO2 max, sleep architecture, glycemic response',
  },
  {
    key: 'science',
    label: 'Science',
    description: 'Hard sciences, research, experiments',
    examples: 'CRISPR mechanics, dark matter evidence, fusion progress',
  },
  {
    key: 'history',
    label: 'History',
    description: 'Historical events, biographies, civilizations',
    examples: 'Bronze Age collapse, Roman fiscal policy, Cold War archives',
  },
] as const;

export function findDomainByKey(key: string): Domain | undefined {
  const all = [...DEFAULT_DOMAINS, ...ADDITIONAL_DOMAIN_CATALOG];
  return all.find((d) => d.key === key);
}
