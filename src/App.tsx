import { useState, useEffect } from 'react';
import './index.css';
import type { AppData, ProviderData } from './types';
import ProviderCard from './components/ProviderCard';
import ProviderDetail from './components/ProviderDetail';
import AdSlot from './components/AdSlot';

const DATA_URL = `${import.meta.env.BASE_URL}data/providers.json`;

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<ProviderData | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const providers = data?.providers ?? [];
  const overallDown = providers.filter(p => p.status.indicator !== 'none' && p.status.indicator !== 'maintenance').length;
  const activeIncidents = providers.filter(p =>
    p.status.indicator !== 'none' && p.status.indicator !== 'maintenance'
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">ProviderPulse</h1>
          <p className="text-white/40 text-sm mt-1">
            Component-level health for the LLM APIs your stack depends on.
          </p>
          {data && (
            <div className="flex items-center gap-3 mt-3">
              <span className={`flex items-center gap-1.5 text-xs font-medium ${overallDown === 0 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${overallDown === 0 ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse`} />
                {overallDown === 0 ? 'All providers operational' : `${overallDown} provider${overallDown > 1 ? 's' : ''} with active issues`}
              </span>
              <span className="text-white/20 text-xs">
                Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Active incidents banner */}
        {data && activeIncidents.length > 0 && (
          <ActiveIncidentsBanner incidents={activeIncidents} onSelect={setSelected} />
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

        {/* Provider grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {providers.map(p => (
              <ProviderCard key={p.provider.id} data={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}

        {/* "Tools we use" placeholder (Carbon Ads slot post-launch) */}
        {data && (
          <div className="mt-8">
            <AdSlot />
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/6 text-center space-y-1">
          <p className="text-white/20 text-xs">Data sourced from official status pages · Refreshed every 30 minutes</p>
          <p className="text-white/15 text-xs">Score = severity-weighted uptime · Critical −8pts · Major −4pts · Minor −0.5pts</p>
          <p className="text-white/15 text-xs">Free · Open data · <a href="https://github.com/subright85/providerpulse/discussions" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 underline">Discussions</a></p>
        </div>
      </div>

      {selected && <ProviderDetail data={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const BANNER_CLS: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/8',
  major:    'border-orange-500/30 bg-orange-500/6',
  minor:    'border-yellow-500/20 bg-yellow-500/5',
};

function ActiveIncidentsBanner({ incidents, onSelect }: { incidents: ProviderData[]; onSelect: (p: ProviderData) => void }) {
  const worstSev = incidents.some(p => p.status.indicator === 'critical') ? 'critical'
    : incidents.some(p => p.status.indicator === 'major') ? 'major'
    : 'minor';

  return (
    <div className={`mb-5 rounded-2xl border px-4 py-3 ${BANNER_CLS[worstSev]}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35 shrink-0">Live Issues</span>
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {incidents.map(p => (
            <button
              key={p.provider.id}
              onClick={() => onSelect(p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/75 hover:text-white transition-colors"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${p.provider.domain}&sz=32`}
                alt=""
                className="w-3.5 h-3.5 rounded"
              />
              <span>{p.provider.name}</span>
            </button>
          ))}
        </div>
        <span className="text-white/25 text-[10px] shrink-0">{incidents.length} affected</span>
      </div>
    </div>
  );
}
