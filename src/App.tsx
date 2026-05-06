import { useState, useEffect } from 'react';
import './index.css';
import type { AppData, ProviderData } from './types';
import { Analytics } from '@vercel/analytics/react';
import ProviderCard from './components/ProviderCard';
import ProviderDetail from './components/ProviderDetail';
import AdSlot from './components/AdSlot';
import FloatingDonateButton from './components/FloatingDonateButton';

const DATA_URL = 'https://raw.githubusercontent.com/subright85/IsLLMDown/main/public/data/providers.json';
const COFFEE_URL = import.meta.env.VITE_DONATION_COFFEE_URL ?? 'https://buymeacoffee.com/sukim';
const STALE_THRESHOLD_MS = 30 * 60 * 1000;  // warn if data > 30 min old
const BMC_BANNER_DISMISS_KEY = 'isllmdown_bmc_banner_dismissed';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<ProviderData | null>(null);
  const [bmcBannerDismissed, setBmcBannerDismissed] = useState(true);

  useEffect(() => {
    const load = () =>
      fetch(`${DATA_URL}?t=${Math.floor(Date.now() / 60000)}`)  // 1-min cache bust
        .then(r => { if (!r.ok) throw new Error(r.status.toString()); return r.json(); })
        .then(d => { setData(d); setError(false); })
        .catch(() => setError(true));

    load();
    const timer = setInterval(load, 5 * 60 * 1000);  // re-fetch every 5 min
    return () => clearInterval(timer);
  }, []);

  // Read banner-dismissed flag client-side only (avoid SSR mismatch); default to
  // hidden until we've checked, so the banner doesn't flash for returning users.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.localStorage.getItem(BMC_BANNER_DISMISS_KEY)) {
      setBmcBannerDismissed(false);
    }
  }, []);

  const dismissBmcBanner = () => {
    setBmcBannerDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BMC_BANNER_DISMISS_KEY, '1');
    }
  };

  const providers = data?.providers ?? [];
  const overallDown = providers.filter(p => p.status.indicator !== 'none' && p.status.indicator !== 'maintenance').length;
  const activeIncidents = providers.filter(p =>
    p.status.indicator !== 'none' && p.status.indicator !== 'maintenance'
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top BMC banner — full-width, dismissible (persisted in localStorage) */}
      {!bmcBannerDismissed && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
            <span className="text-amber-900">
              <span className="mr-1">☕</span>
              <strong>Enjoying IsLLMDown?</strong> It's free, and stays free —{' '}
              <a
                href={COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-amber-700"
              >
                Buy me a coffee →
              </a>
            </span>
            <button
              onClick={dismissBmcBanner}
              aria-label="Dismiss"
              className="shrink-0 text-amber-700 hover:text-amber-900 text-base leading-none px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="pp-display text-3xl sm:text-4xl text-slate-900">IsLLMDown</h1>
          <p className="text-slate-600 text-sm mt-1.5">
            Component-level health for the LLM APIs your stack depends on.
          </p>
          {data && (
            <div className="flex items-center flex-wrap gap-3 mt-4">
              <span className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-md border ${overallDown === 0 ? 'border-green-200 text-green-700 bg-green-50' : 'border-yellow-200 text-yellow-700 bg-yellow-50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${overallDown === 0 ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                {overallDown === 0 ? 'All providers operational' : `${overallDown} provider${overallDown > 1 ? 's' : ''} with issues`}
              </span>
              <span className="text-slate-400 text-xs pp-mono">
                Updated {fmtRelative(data.generatedAt)}
              </span>
              {Date.now() - new Date(data.generatedAt).getTime() > STALE_THRESHOLD_MS && (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  ⚠ Data may be stale
                </span>
              )}
            </div>
          )}
        </div>

        {/* Active incidents banner */}
        {data && activeIncidents.length > 0 && (
          <ActiveIncidentsBanner incidents={activeIncidents} onSelect={setSelected} />
        )}

        {/* Loading skeleton */}
        {!data && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-lg border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-700 font-semibold text-sm">Failed to load provider data</p>
            <p className="text-slate-600 text-xs mt-2">Data is collected every 10 minutes via GitHub Actions.</p>
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
        <div className="mt-12 pt-6 border-t border-slate-200 text-center space-y-1">
          <p className="text-slate-500 text-xs">Data sourced from official status pages · Refreshed every 10 minutes</p>
          <p className="text-slate-400 text-xs">Score = severity-weighted uptime · Critical −8pts · Major −4pts · Minor −0.5pts</p>
          <p className="text-slate-400 text-xs">Free · Open data · <a href="https://github.com/subright85/IsLLMDown/discussions" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">Discussions</a></p>
        </div>
      </div>

      {selected && <ProviderDetail data={selected} onClose={() => setSelected(null)} />}

      <FloatingDonateButton />
      <Analytics />
    </div>
  );
}

const BANNER_CLS: Record<string, string> = {
  critical: 'border-red-200 bg-red-50',
  major:    'border-orange-200 bg-orange-50',
  minor:    'border-yellow-200 bg-yellow-50',
};

const BANNER_BAR: Record<string, string> = {
  critical: 'bg-red-500',
  major:    'bg-orange-500',
  minor:    'bg-yellow-500',
};

const BANNER_ICON_CLR: Record<string, string> = {
  critical: 'text-red-600',
  major:    'text-orange-600',
  minor:    'text-yellow-600',
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

  const lead = [...incidents].sort((a, b) => {
    const order = { critical: 0, major: 1, minor: 2, maintenance: 3, none: 4 };
    return (order[a.status.indicator] ?? 5) - (order[b.status.indicator] ?? 5);
  })[0];

  const leadActive = lead.recentIncidents.find(i => !i.resolvedAt && i.severity !== 'maintenance');
  const more = incidents.length - 1;

  return (
    <button
      onClick={() => onSelect(lead)}
      className={`mb-5 w-full text-left rounded-lg border relative overflow-hidden ${BANNER_CLS[worstSev]}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${BANNER_BAR[worstSev]}`} />
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span className={`text-xl leading-none mt-0.5 shrink-0 ${BANNER_ICON_CLR[worstSev]}`}>⚠</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug text-slate-800">
            <span className="font-semibold">Active incident:</span>{' '}
            <span>
              {lead.provider.name} — {leadActive?.title ?? lead.status.description}
              {more > 0 && (
                <span className="text-slate-500"> · +{more} other provider{more === 1 ? '' : 's'} affected</span>
              )}
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1 pp-mono">
            Updated {fmtRelative(lead.status.updatedAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
