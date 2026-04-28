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
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💊</span>
            <h1 className="text-xl font-black tracking-tight text-white">ProviderPulse</h1>
          </div>
          <p className="text-white/40 text-sm">LLM &amp; SaaS reliability — not just uptime, but trustworthiness.</p>
          {data && (
            <div className="flex items-center gap-2 mt-2">
              {overallDown === 0
                ? <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />All systems operational</span>
                : <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />{overallDown} provider{overallDown > 1 ? 's' : ''} with issues</span>
              }
              <span className="text-white/20 text-xs">· Updated {new Date(data.generatedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                filter === cat ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {cat === 'all' ? '🌐 All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Loading */}
        {!data && !error && (
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 text-center">
            <p className="text-red-400 font-bold">데이터를 불러오지 못했어 😔</p>
            <p className="text-white/40 text-sm mt-1">GitHub Actions가 아직 첫 수집을 안 했거나 네트워크 오류야.</p>
          </div>
        )}

        {/* Provider grid */}
        {data && (
          <div className="flex flex-col gap-3">
            {filtered.length === 0 && (
              <p className="text-center text-white/30 text-sm py-8">No providers in this category.</p>
            )}
            {filtered.map(p => (
              <ProviderCard key={p.provider.id} data={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/8 text-center">
          <p className="text-white/25 text-xs">Data collected from public status pages every 30 min via GitHub Actions.</p>
          <p className="text-white/15 text-xs mt-1">Reliability score = uptime (60%) + incident frequency + MTTR</p>
        </div>
      </div>

      {/* Detail modal */}
      {selected && <ProviderDetail data={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
