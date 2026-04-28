import { useState, useEffect } from 'react';
import './index.css';
import type { AppData, ProviderData } from './types';
import { CATEGORY_LABELS } from './providers';
import ProviderCard from './components/ProviderCard';
import ProviderDetail from './components/ProviderDetail';

const DATA_URL = `${import.meta.env.BASE_URL}data/providers.json`;

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
          <p className="text-white/15 text-xs">Score = severity-weighted uptime (60%) + incident frequency + avg. MTTR</p>
        </div>
      </div>

      {selected && <ProviderDetail data={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
