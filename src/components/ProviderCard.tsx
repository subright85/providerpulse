import { useState } from 'react';
import type { ProviderData, Provider } from '../types';

const INDICATOR_CONFIG = {
  none:        { label: 'Operational',  bg: 'bg-emerald-500/12', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  minor:       { label: 'Degraded',     bg: 'bg-yellow-500/12',  text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  major:       { label: 'Major Outage', bg: 'bg-orange-500/12',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  critical:    { label: 'Critical',     bg: 'bg-red-500/12',     text: 'text-red-400',     dot: 'bg-red-400' },
  maintenance: { label: 'Maintenance',  bg: 'bg-blue-500/12',    text: 'text-blue-400',    dot: 'bg-blue-400' },
};

const ACTIVE_BORDER = {
  critical:    'border-red-500/60',
  major:       'border-orange-500/50',
  minor:       'border-yellow-500/40',
  maintenance: 'border-blue-500/30',
};

function fmtLastIncident(iso: string | null): string {
  if (!iso) return 'No incidents';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

// Score ring uses cool palette only (blue→indigo→violet) so it can't be
// mistaken for the warm status indicator (red/orange/yellow). 90+ stays
// emerald since "operational" green is universally understood as positive
// regardless of context.
function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/25 text-[10px] font-medium" title="Historical reliability data unavailable">N/A</div>
  );
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const scoreColor = score >= 90 ? '#34d399' : score >= 75 ? '#60a5fa' : score >= 60 ? '#818cf8' : '#a78bfa';
  return (
    <div
      className="relative w-12 h-12 flex flex-col items-center justify-center shrink-0"
      title="30-day reliability score (historical, not current status)"
    >
      <svg className="absolute inset-0 -rotate-90" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={scoreColor} strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="text-[11px] font-bold leading-none" style={{ color: scoreColor }}>{score}</span>
      <span className="text-[7px] text-white/30 font-semibold uppercase tracking-wide leading-none mt-0.5">30d</span>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  const [failed, setFailed] = useState(false);
  if (failed || !provider.domain) {
    return <span className="text-xl shrink-0">{provider.icon}</span>;
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${provider.domain}&sz=64`}
      alt={provider.name}
      className="w-6 h-6 shrink-0 rounded"
      onError={() => setFailed(true)}
    />
  );
}

interface Props {
  data: ProviderData;
  onClick: () => void;
}

export default function ProviderCard({ data, onClick }: Props) {
  const { provider, status, stats, recentIncidents } = data;
  const ind = INDICATOR_CONFIG[status.indicator] ?? INDICATOR_CONFIG.none;
  const isActive = status.indicator !== 'none' && status.indicator !== 'maintenance';
  const borderCls = isActive
    ? `border-l-[3px] ${ACTIVE_BORDER[status.indicator as keyof typeof ACTIVE_BORDER] ?? 'border-yellow-500/40'} border-t border-r border-b border-t-white/8 border-r-white/8 border-b-white/8`
    : 'border border-white/8';

  // Most recent active incident title (for the card summary line)
  const activeIncident = recentIncidents.find(i =>
    i.resolvedAt === null && i.severity !== 'maintenance'
  );

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white/4 rounded-2xl p-4 hover:bg-white/6 transition-all duration-150 active:scale-99 ${borderCls}`}
    >
      <div className="flex items-center gap-3">
        <ProviderIcon provider={provider} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-sm">{provider.name}</p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${ind.bg} ${ind.text}`}>
              <span className={`w-1 h-1 rounded-full ${isActive ? 'animate-pulse' : ''} ${ind.dot}`} />
              {ind.label}
            </span>
          </div>

          {/* Active incident summary line */}
          {activeIncident && (
            <p className="text-[11px] text-orange-300/80 mt-1 truncate leading-tight">
              ⚠ {activeIncident.title}
            </p>
          )}

          <div className="flex gap-4 mt-2">
            <Stat label="30d uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} ok={stats.uptime30d !== null && stats.uptime30d >= 99.5} />
            <Stat label="Incidents" value={String(stats.incidentCount30d)} ok={stats.incidentCount30d === 0} />
            <Stat label="Last inc." value={fmtLastIncident(stats.lastIncident)} ok={!stats.lastIncident} />
          </div>
        </div>

        <ScoreRing score={stats.reliabilityScore} />
      </div>
    </button>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <p className={`text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-white/60'}`}>{value}</p>
      <p className="text-white/25 text-[10px] uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
