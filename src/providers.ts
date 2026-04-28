import type { Provider } from './types';

export const PROVIDERS: Provider[] = [
  // LLM
  { id: 'openai',    name: 'OpenAI',        category: 'llm',     color: '#10a37f', icon: '🤖', statusPageUrl: 'https://status.openai.com',        apiUrl: 'https://status.openai.com/api/v2/summary.json' },
  { id: 'anthropic', name: 'Anthropic',     category: 'llm',     color: '#d97706', icon: '🧠', statusPageUrl: 'https://status.anthropic.com',     apiUrl: 'https://status.anthropic.com/api/v2/summary.json' },
  { id: 'google-ai', name: 'Google AI',     category: 'llm',     color: '#4285f4', icon: '✨', statusPageUrl: 'https://status.cloud.google.com',  apiUrl: 'https://status.cloud.google.com/en/' },
  { id: 'groq',      name: 'Groq',          category: 'llm',     color: '#f97316', icon: '⚡', statusPageUrl: 'https://groqstatus.com',            apiUrl: 'https://groqstatus.com/api/v2/summary.json' },
  { id: 'cohere',    name: 'Cohere',        category: 'llm',     color: '#6366f1', icon: '🔮', statusPageUrl: 'https://status.cohere.com',         apiUrl: 'https://status.cohere.com/api/v2/summary.json' },
  // Infra
  { id: 'vercel',    name: 'Vercel',        category: 'infra',   color: '#ffffff', icon: '▲',  statusPageUrl: 'https://www.vercel-status.com',     apiUrl: 'https://www.vercel-status.com/api/v2/summary.json' },
  { id: 'cloudflare',name: 'Cloudflare',    category: 'infra',   color: '#f6821f', icon: '☁️', statusPageUrl: 'https://www.cloudflarestatus.com',  apiUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json' },
  { id: 'github',    name: 'GitHub',        category: 'infra',   color: '#ffffff', icon: '🐙', statusPageUrl: 'https://www.githubstatus.com',      apiUrl: 'https://www.githubstatus.com/api/v2/summary.json' },
  // Data
  { id: 'supabase',  name: 'Supabase',      category: 'data',    color: '#3ecf8e', icon: '🗄️', statusPageUrl: 'https://status.supabase.com',       apiUrl: 'https://status.supabase.com/api/v2/summary.json' },
  { id: 'pinecone',  name: 'Pinecone',      category: 'data',    color: '#008080', icon: '🌲', statusPageUrl: 'https://status.pinecone.io',        apiUrl: 'https://status.pinecone.io/api/v2/summary.json' },
  // Payment
  { id: 'stripe',    name: 'Stripe',        category: 'payment', color: '#635bff', icon: '💳', statusPageUrl: 'https://status.stripe.com',         apiUrl: 'https://status.stripe.com/api/v2/summary.json' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  llm: '🤖 LLM Providers',
  infra: '⚙️ Infrastructure',
  data: '🗄️ Data & Storage',
  payment: '💳 Payments',
};
