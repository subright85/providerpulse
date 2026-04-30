import { useState, useEffect } from 'react';
import './index.css';
import type { AppData, ProviderData } from './types';
import { Analytics } from '@vercel/analytics/react';
import ProviderCard from './components/ProviderCard';
import ProviderDetail from './components/ProviderDetail';
import AdSlot from './components/AdSlot';
import FloatingDonateButton from './components/FloatingDonateButton';

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 border-b-2 border-white pb-6">
          <h1 className="pp-display text-4xl sm:text-5xl uppercase">ProviderPulse</h1>
          <p className="text-white/70 text-sm mt-2 font-mono">
            Component-level health for the LLM APIs your stack depends on.
          </p>
          {data && (
            <div className="flex items-center gap-3 mt-4 font-mono">
              <span className={`flex items-center gap-2 text-xs font-bold uppercase px-2 py-1 border-2 ${overallDown === 0 ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-[#ffff00] text-[#ffff00] bg-[#ffff00]/10'}`}>
                <span className={`w-2 h-2 ${overallDown === 0 ? 'bg-[#00ff00]' : 'bg-[#ffff00]'} animate-pulse`} />
                {overallDown === 0 ? 'All providers operational' : `${overallDown} provider${overallDown > 1 ? 's' : ''} with issues`}
              </span>
              <span className="text-white/40 text-xs">
                ↳ updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <div key={i} className="h-28 border-2 border-white/30 bg-white/4 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="border-2 border-[#ff006e] bg-[#ff006e]/10 p-6 text-center font-mono">
            <p className="text-[#ff006e] font-bold uppercase text-sm">Failed to load provider data</p>
            <p className="text-white/60 text-xs mt-2">Data is collected every 30 minutes via GitHub Actions.</p>
          </div>
        )}

        {/* Provider grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        <div className="mt-12 pt-6 border-t-2 border-white text-center space-y-1 font-mono">
          <p className="text-white/50 text-xs">Data sourced from official status pages · Refreshed every 30 minutes</p>
          <p className="text-white/40 text-xs">Score = severity-weighted uptime · Critical −8pts · Major −4pts · Minor −0.5pts</p>
          <p className="text-white/40 text-xs">Free · Open data · <a href="https://github.com/subright85/providerpulse/discussions" target="_blank" rel="noopener noreferrer" className="text-[#00ff00] hover:underline">Discussions</a></p>
        </div>
      </div>

      {selected && <ProviderDetail data={selected} onClose={() => setSelected(null)} />}

      <FloatingDonateButton />
      <Analytics />
    </div>
  );
}

const BANNER_CLS: Record<string, string> = {
  critical: 'border-[#ff006e] bg-[#ff006e]/10',
  major:    'border-[#ffff00] bg-[#ffff00]/10',
  minor:    'border-[#ffff00] bg-[#ffff00]/5',
};

function ActiveIncidentsBanner({ incidents, onSelect }: { incidents: ProviderData[]; onSelect: (p: ProviderData) => void }) {
  const worstSev = incidents.some(p => p.status.indicator === 'critical') ? 'critical'
    : incidents.some(p => p.status.indicator === 'major') ? 'major'
    : 'minor';

  return (
    <div className={`mb-5 border-2 px-4 py-3 font-mono ${BANNER_CLS[worstSev]}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 shrink-0">▶ Live Issues</span>
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {incidents.map(p => (
            <button
              key={p.provider.id}
              onClick={() => onSelect(p)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase text-white hover:text-[#00ff00] transition-colors"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${p.provider.domain}&sz=32`}
                alt=""
                className="w-3.5 h-3.5"
              />
              <span>{p.provider.name}</span>
            </button>
          ))}
        </div>
        <span className="text-white/40 text-[10px] uppercase shrink-0">{incidents.length} affected</span>
      </div>
    </div>
  );
}
