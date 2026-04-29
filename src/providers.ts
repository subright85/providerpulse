import type { Provider } from './types';

export const PROVIDERS: Provider[] = [
  // LLM Providers
  { id: 'openai',     name: 'OpenAI',        category: 'llm',     domain: 'openai.com',          color: '#10a37f', icon: '🤖', statusPageUrl: 'https://status.openai.com',                       apiUrl: 'https://status.openai.com/api/v2/summary.json' },
  { id: 'anthropic',  name: 'Anthropic',     category: 'llm',     domain: 'anthropic.com',       color: '#d97706', icon: '🧠', statusPageUrl: 'https://status.anthropic.com',                    apiUrl: 'https://status.anthropic.com/api/v2/summary.json' },
  { id: 'google-ai',  name: 'Google AI',     category: 'llm',     domain: 'cloud.google.com',    color: '#4285f4', icon: '✨', statusPageUrl: 'https://status.cloud.google.com',                 apiUrl: 'https://status.cloud.google.com/incidents.json' },
  { id: 'groq',       name: 'Groq',          category: 'llm',     domain: 'groq.com',            color: '#f97316', icon: '⚡', statusPageUrl: 'https://groqstatus.com',                          apiUrl: 'https://groqstatus.com/api/v2/summary.json' },
  { id: 'cohere',     name: 'Cohere',        category: 'llm',     domain: 'cohere.com',          color: '#6366f1', icon: '🔮', statusPageUrl: 'https://status.cohere.com',                       apiUrl: 'https://status.cohere.com/api/v2/summary.json' },
  { id: 'deepseek',   name: 'DeepSeek',      category: 'llm',     domain: 'deepseek.com',        color: '#00b4d8', icon: '🐋', statusPageUrl: 'https://status.deepseek.com',                     apiUrl: 'https://status.deepseek.com/api/v2/summary.json' },
  // Infrastructure
  { id: 'vercel',     name: 'Vercel',        category: 'infra',   domain: 'vercel.com',          color: '#ffffff', icon: '▲',  statusPageUrl: 'https://www.vercel-status.com',                   apiUrl: 'https://www.vercel-status.com/api/v2/summary.json' },
  { id: 'cloudflare', name: 'Cloudflare',    category: 'infra',   domain: 'cloudflare.com',      color: '#f6821f', icon: '☁️', statusPageUrl: 'https://www.cloudflarestatus.com',                apiUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json' },
  { id: 'github',     name: 'GitHub',        category: 'infra',   domain: 'github.com',          color: '#ffffff', icon: '🐙', statusPageUrl: 'https://www.githubstatus.com',                    apiUrl: 'https://www.githubstatus.com/api/v2/summary.json' },
  { id: 'azure',      name: 'Azure',         category: 'infra',   domain: 'azure.microsoft.com', color: '#0089d6', icon: '🔷', statusPageUrl: 'https://azure.status.microsoft/en-us/status/',    apiUrl: 'https://azurestatuscdn.azureedge.net/en-us/status/feed/' },
  { id: 'netlify',    name: 'Netlify',       category: 'infra',   domain: 'netlify.com',         color: '#00c7b7', icon: '🌐', statusPageUrl: 'https://www.netlifystatus.com',                   apiUrl: 'https://www.netlifystatus.com/api/v2/summary.json' },
  { id: 'render',     name: 'Render',        category: 'infra',   domain: 'render.com',          color: '#46e3b7', icon: '🎨', statusPageUrl: 'https://status.render.com',                       apiUrl: 'https://status.render.com/api/v2/summary.json' },
  // Data & Storage
  { id: 'supabase',   name: 'Supabase',      category: 'data',    domain: 'supabase.com',        color: '#3ecf8e', icon: '🗄️', statusPageUrl: 'https://status.supabase.com',                     apiUrl: 'https://status.supabase.com/api/v2/summary.json' },
  { id: 'pinecone',   name: 'Pinecone',      category: 'data',    domain: 'pinecone.io',         color: '#008080', icon: '🌲', statusPageUrl: 'https://status.pinecone.io',                      apiUrl: 'https://status.pinecone.io/api/v2/summary.json' },
  { id: 'mongodb',    name: 'MongoDB Atlas', category: 'data',    domain: 'mongodb.com',         color: '#00ed64', icon: '🍃', statusPageUrl: 'https://status.mongodb.com',                      apiUrl: 'https://status.mongodb.com/api/v2/summary.json' },
  { id: 'upstash',    name: 'Upstash',       category: 'data',    domain: 'upstash.com',         color: '#00e9a3', icon: '🔴', statusPageUrl: 'https://status.upstash.com',                      apiUrl: 'https://status.upstash.com/api/v2/summary.json' },
  // Payments & Communication
  { id: 'twilio',     name: 'Twilio',        category: 'payment', domain: 'twilio.com',          color: '#f22f46', icon: '📡', statusPageUrl: 'https://status.twilio.com',                       apiUrl: 'https://status.twilio.com/api/v2/summary.json' },
  { id: 'sendgrid',   name: 'SendGrid',      category: 'payment', domain: 'sendgrid.com',        color: '#1a82e2', icon: '📧', statusPageUrl: 'https://status.sendgrid.com',                     apiUrl: 'https://status.sendgrid.com/api/v2/summary.json' },
  { id: 'plaid',      name: 'Plaid',         category: 'payment', domain: 'plaid.com',           color: '#00c98b', icon: '🏦', statusPageUrl: 'https://status.plaid.com',                        apiUrl: 'https://status.plaid.com/api/v2/summary.json' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  llm:     '🤖 LLM Providers',
  infra:   '⚙️ Infrastructure',
  data:    '🗄️ Data & Storage',
  payment: '📡 Payments & Comms',
};
