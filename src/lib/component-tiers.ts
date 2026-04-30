// Per-provider mapping of components into 3 audience tiers.
// Per Nami's spec — lets the card show "ChatGPT down vs API fine" instead
// of a flat 25-dot blob, which is the LLM-only differentiator vs generic
// status aggregators.
//
// Mappings curated from Sanji's audit of all 8 provider status APIs.
// Components not in the table fall back to 'api' (most LLM provider
// components are API endpoints by default).

export type ComponentTier = 'enduser' | 'api' | 'infra';

export const TIER_LABELS: Record<ComponentTier, string> = {
  enduser: 'End-user',
  api:     'API services',
  infra:   'Developer infra',
};

export const TIER_ICONS: Record<ComponentTier, string> = {
  enduser: '👥',
  api:     '🛠',
  infra:   '⚙',
};

// Tier color = group label/border color. Distinct from status (red/yellow/green)
// so a viewer can distinguish "what kind of thing is broken" from "is it broken."
export const TIER_RING: Record<ComponentTier, string> = {
  enduser: 'text-blue-300',
  api:     'text-emerald-300',
  infra:   'text-white/40',
};

const MAPPINGS: Record<string, Record<string, ComponentTier>> = {
  openai: {
    // End-user (consumer-facing apps / properties)
    'App':                 'enduser',
    'ChatGPT Atlas':       'enduser',
    'Sora':                'enduser',
    'Voice mode':          'enduser',
    'Conversations':       'enduser',
    'Connectors/Apps':     'enduser',
    'Codex Web':           'enduser',
    // API services (developer/business APIs)
    'Chat Completions':    'api',
    'Responses':           'api',
    'Embeddings':          'api',
    'Audio':               'api',
    'Images':              'api',
    'Moderations':         'api',
    'Fine-tuning':         'api',
    'Batch':               'api',
    'Files':               'api',
    'Realtime':            'api',
    'File uploads':        'api',
    'Compliance API':      'api',
    'Codex API':           'api',
    'Agent':               'api',
    // Developer infra (auth, tools, compliance)
    'Login':               'infra',
    'VS Code extension':   'infra',
    'CLI':                 'infra',
    'FedRAMP':             'infra',
  },
  anthropic: {
    'claude.ai':                              'enduser',
    'Claude Cowork':                          'enduser',
    'Claude for Government':                  'enduser',
    'Claude API (api.anthropic.com)':         'api',
    'Claude Console (platform.claude.com)':   'infra',
    'Claude Code':                            'infra',
  },
  groq: {
    // All model endpoints fall through to 'api' default
    'Website': 'infra',
    'Docs':    'infra',
  },
  cohere: {
    'Coral':          'enduser',  // consumer assistant product
    'Playground':     'enduser',  // borderline but Sanji's classification
    'Website':        'infra',
    'Docs':           'infra',
    'Infrastructure': 'infra',
    // All command-*/embed-*/rerank-*/embeddings endpoints fall through to 'api'
  },
  deepseek: {
    '网页对话服务 (Web Chat Service)': 'enduser',
    'API 服务 (API Service)':          'api',
  },
  ai21: {
    'Studio Platform':    'enduser',
    'Maestro':            'api',
    'Maestro Websearch':  'api',
    'Maestro Filesearch': 'api',
    'jamba-mini':         'api',
    'jamba-large':        'api',
  },
  // perplexity and google-ai have 0 components — nothing to map yet
};

export function getComponentTier(providerId: string, componentName: string): ComponentTier {
  const mapping = MAPPINGS[providerId];
  if (!mapping) return 'api';
  return mapping[componentName] ?? 'api';
}
