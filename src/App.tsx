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
  major:    'border-[#ff8800] bg-[#ff8800]/10',
  minor:    'border-[#ffff00] bg-[#ffff00]/10',
};

const BANNER_BAR: Record<string, string> = {
  critical: 'bg-[#ff006e]',
  major:    'bg-[#ff8800]',
  minor:    'bg-[#ffff00]',
};

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function ActiveIncidentsBanner({ incidents, onSelect }: { incidents: ProviderData[]; onSelect: (p: ProviderData) => void }) {
  const worstSev = incidents.some(p => p.status.indicator === 'critical') ? 'critical'
    : incidents.some(p => p.status.indicator === 'major') ? 'major'
    : 'minor';

  // Pick the most-impactful incident as the lead
  const lead = [...incidents].sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2, maintenance: 3, none: 4 };
    return (order[a.status.indicator] ?? 5) - (order[b.status.indicator] ?? 5);
  })[0];

  const leadActive = lead.recentIncidents.find(i => !i.resolvedAt && i.severity !== 'maintenance');
  const more = incidents.length - 1;

  return (
    <button
      onClick={() => onSelect(lead)}
      className={`mb-5 w-full text-left border-2 font-mono relative overflow-hidden ${BANNER_CLS[worstSev]}`}
    >
      {/* Severity accent bar — left edge */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${BANNER_BAR[worstSev]}`} />
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span className="text-[#ffff00] text-xl leading-none mt-0.5 shrink-0">⚠</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm leading-snug">
            <span className="font-bold uppercase tracking-wider text-white">Active incident:</span>{' '}
            <span className="text-white/85">
              {lead.provider.name} — {leadActive?.title ?? lead.status.description}
              {more > 0 && (
                <span className="text-white/50"> · +{more} other provider{more === 1 ? '' : 's'} affected</span>
              )}
            </span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/50 mt-1">
            ↳ updated {fmtRelative(lead.status.updatedAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
