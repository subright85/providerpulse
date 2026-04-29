import type { Provider } from './types';

// LLM-only focus per Show HN positioning. Component-level health for the
// 6 major LLM API providers — that's the core value prop, no jack-of-all-trades.
export const PROVIDERS: Provider[] = [
  { id: 'openai',     name: 'OpenAI',    category: 'llm', domain: 'openai.com',       color: '#10a37f', icon: '🤖', statusPageUrl: 'https://status.openai.com',     apiUrl: 'https://status.openai.com/api/v2/summary.json' },
  { id: 'anthropic',  name: 'Anthropic', category: 'llm', domain: 'anthropic.com',    color: '#d97706', icon: '🧠', statusPageUrl: 'https://status.anthropic.com',  apiUrl: 'https://status.anthropic.com/api/v2/summary.json' },
  { id: 'google-ai',  name: 'Google AI', category: 'llm', domain: 'cloud.google.com', color: '#4285f4', icon: '✨', statusPageUrl: 'https://status.cloud.google.com', apiUrl: 'https://status.cloud.google.com/incidents.json' },
  { id: 'groq',       name: 'Groq',      category: 'llm', domain: 'groq.com',         color: '#f97316', icon: '⚡', statusPageUrl: 'https://groqstatus.com',         apiUrl: 'https://groqstatus.com/api/v2/summary.json' },
  { id: 'cohere',     name: 'Cohere',    category: 'llm', domain: 'cohere.com',       color: '#6366f1', icon: '🔮', statusPageUrl: 'https://status.cohere.com',     apiUrl: 'https://status.cohere.com/api/v2/summary.json' },
  { id: 'deepseek',   name: 'DeepSeek',  category: 'llm', domain: 'deepseek.com',     color: '#00b4d8', icon: '🐋', statusPageUrl: 'https://status.deepseek.com',   apiUrl: 'https://status.deepseek.com/api/v2/summary.json' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  llm: '🤖 LLM Providers',
};
