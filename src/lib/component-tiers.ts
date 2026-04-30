// Per-provider mapping of components into 3 audience tiers.
// Per Nami's spec — lets the card show "ChatGPT down vs API fine" instead
// of a flat 25-dot blob, which is the LLM-only differentiator vs generic
// status aggregators.
//
// Manually curated for OpenAI + Anthropic (the two providers most users have
// in their stack). Other providers fall back to 'api' until Sanji's mapping
// table arrives.

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
    'Agent':               'enduser',
    'Connectors/Apps':     'enduser',
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
    // Developer infra (auth, tools, compliance)
    'Login':               'infra',
    'VS Code extension':   'infra',
    'CLI':                 'infra',
    'Codex Web':           'infra',
    'FedRAMP':             'infra',
  },
  anthropic: {
    'claude.ai':                              'enduser',
    'Claude Cowork':                          'enduser',
    'Claude API (api.anthropic.com)':         'api',
    'Claude Console (platform.claude.com)':   'infra',
    'Claude Code':                            'infra',
    'Claude for Government':                  'infra',
  },
};

export function getComponentTier(providerId: string, componentName: string): ComponentTier {
  const mapping = MAPPINGS[providerId];
  if (!mapping) return 'api'; // unmapped providers default to API services
  return mapping[componentName] ?? 'api';
}
