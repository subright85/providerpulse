import { useState, useEffect } from 'react';
import './index.css';
import type { AppData, ProviderData, CategoryTagTrend } from './types';
import { CATEGORY_LABELS } from './providers';
import ProviderCard from './components/ProviderCard';
import ProviderDetail from './components/ProviderDetail';

const DATA_URL = `${import.meta.env.BASE_URL}data/providers.json`;

const TAG_COLORS: Record<string, string> = {
  'availability': 'bg-red-500/20 text-red-300',
  'api':          'bg-orange-500/20 text-orange-300',
  'inference':    'bg-violet-500/20 text-violet-300',
  'performance':  'bg-yellow-500/20 text-yellow-300',
  'auth':         'bg-blue-500/20 text-blue-300',
  'rate-limit':   'bg-cyan-500/20 text-cyan-300',
  'network':      'bg-indigo-500/20 text-indigo-300',
  'database':     'bg-teal-500/20 text-teal-300',
  'billing':      'bg-green-500/20 text-green-300',
  'webhook':      'bg-pink-500/20 text-pink-300',
  'deployment':   'bg-amber-500/20 text-amber-300',
  'other':        'bg-white/10 text-white/40',
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<ProviderData | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const categories = ['all', 'llm', 'infra', 'data', 'payment'];
  const providers = data?.providers ?? [];
  const filtered = filter === 'all' ? providers : providers.filter(p => p.provider.category === filter);
  const overallDown = providers.filter(p => p.status.indicator !== 'none' && p.status.indicator !== 'maintenance').length;

  // Category tag trends for the selected filter
  const tagTrend: CategoryTagTrend | null = filter !== 'all' && data?.categoryTagTrends
    ? (data.categoryTagTrends.find(t => t.category === filter) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">ProviderPulse</h1>
          <p className="text-white/40 text-sm mt-1">
            Historical reliability scores for LLM APIs and critical SaaS dependencies.
          </p>
          {data && (
            <div className="flex items-center gap-3 mt-3">
              <span className={`flex items-center gap-1.5 text-xs font-medium ${overallDown === 0 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${overallDown === 0 ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse`} />
                {overallDown === 0 ? 'All systems operational' : `${overallDown} provider${overallDown > 1 ? 's' : ''} with active issues`}
              </span>
              <span className="text-white/20 text-xs">Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mb-5 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-1 ${
                filter === cat ? 'bg-white/12 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Category tag trend panel — shown when a specific category is selected */}
        {tagTrend && tagTrend.tags.length > 0 && (
          <CategoryInsights trend={tagTrend} />
        )}

        {/* Loading skeleton */}
        {!data && !error && (
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-6 text-center">
            <p className="text-red-400 font-semibold text-sm">Failed to load provider data</p>
            <p className="text-white/30 text-xs mt-1">Data is collected every 30 minutes via GitHub Actions.</p>
          </div>
        )}

        {/* Provider list */}
        {data && (
          <div className="flex flex-col gap-3">
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-sm py-10">No providers in this category.</p>
            )}
            {filtered.map(p => (
              <ProviderCard key={p.provider.id} data={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/6 text-center space-y-1">
          <p className="text-white/20 text-xs">Data sourced from official status pages · Refreshed every 30 minutes</p>
          <p className="text-white/15 text-xs">Score = severity-weighted uptime · Critical incident −8pts · Major −4pts · Minor −0.5pts</p>
        </div>
      </div>

      {selected && <ProviderDetail data={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CategoryInsights({ trend }: { trend: CategoryTagTrend }) {
  const max = Math.max(...trend.tags.map(t => t.count90d), 1);
  return (
    <div className="mb-5 bg-white/4 border border-white/8 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Common Incident Types</p>
        <span className="text-white/20 text-[10px]">90-day · across all providers</span>
      </div>
      <div className="flex flex-col gap-2">
        {trend.tags.map(t => {
          const tagCls = TAG_COLORS[t.tag] ?? TAG_COLORS.other;
          const pct = (t.count90d / max) * 100;
          const trendIcon = t.trend === 'up' ? '↑' : t.trend === 'down' ? '↓' : '→';
          const trendColor = t.trend === 'up' ? 'text-red-400' : t.trend === 'down' ? 'text-emerald-400' : 'text-white/25';
          return (
            <div key={t.tag} className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 w-24 text-center ${tagCls}`}>{t.tag}</span>
              <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                <div className="h-full bg-white/20 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-white/40 text-[10px] tabular-nums w-6 text-right">{t.count90d}</span>
              <span className={`text-[10px] font-bold w-3 ${trendColor}`} title={`30d: ${t.count30d}`}>{trendIcon}</span>
              <span className="text-white/20 text-[10px] w-16 truncate">{t.providers.length} provider{t.providers.length > 1 ? 's' : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
