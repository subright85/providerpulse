import { useState } from 'react';
import type { ProviderData, Provider, ProviderComponent } from '../types';

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

// Score uses cool palette only (emerald→blue→indigo→violet) so it can't be
// mistaken for the warm status indicator (red/orange/yellow).
function scoreColor(score: number): string {
  return score >= 90 ? '#34d399' : score >= 75 ? '#60a5fa' : score >= 60 ? '#818cf8' : '#a78bfa';
}

function ScoreRing({ score, period }: { score: number | null; period: '30D' | '90D' }) {
  const size = period === '30D' ? 48 : 36;
  const r = period === '30D' ? 20 : 14;
  const stroke = period === '30D' ? 2.5 : 2;
  const fontSize = period === '30D' ? '11px' : '9px';
  const labelSize = period === '30D' ? '7px' : '6px';

  if (score === null) {
    return (
      <div
        className="rounded-full border border-white/10 flex items-center justify-center text-white/25 font-medium"
        style={{ width: size, height: size, fontSize: labelSize }}
        title={`${period} reliability unavailable`}
      >
        N/A
      </div>
    );
  }
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div
      className="relative flex flex-col items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      title={`${period} historical reliability score (not current status)`}
    >
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="font-bold leading-none" style={{ color, fontSize }}>{score}</span>
      <span className="text-white/30 font-semibold uppercase tracking-wide leading-none mt-0.5"
        style={{ fontSize: labelSize }}>{period}</span>
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

          {/* Component health summary — the LLM-only differentiator */}
          <ComponentSummary components={data.components} />

          <div className="flex gap-4 mt-2">
            <Stat label="30d uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} ok={stats.uptime30d !== null && stats.uptime30d >= 99.5} />
            <Stat label="Incidents" value={String(stats.incidentCount30d)} ok={stats.incidentCount30d === 0} />
            <Stat label="Last inc." value={fmtLastIncident(stats.lastIncident)} ok={!stats.lastIncident} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <ScoreRing score={stats.reliabilityScore} period="30D" />
          <ScoreRing score={stats.reliabilityScore90d} period="90D" />
        </div>
      </div>
    </button>
  );
}

function ComponentSummary({ components }: { components: ProviderComponent[] }) {
  if (components.length === 0) return null;
  const failing = components.filter(c => c.status !== 'operational');
  if (failing.length === 0) {
    return (
      <p className="text-[11px] text-emerald-400/70 mt-1 leading-tight">
        ✓ All {components.length} components operational
      </p>
    );
  }
  // Show up to 3 failing components inline
  const display = failing.slice(0, 3);
  const more = failing.length - display.length;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {display.map(c => (
        <span
          key={c.id}
          className={`text-[10px] px-1.5 py-0.5 rounded ${componentStatusBadge(c.status)}`}
          title={c.description ?? c.status}
        >
          {c.name}
        </span>
      ))}
      {more > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 text-white/40">+{more} more</span>
      )}
    </div>
  );
}

function componentStatusBadge(status: ProviderComponent['status']): string {
  switch (status) {
    case 'major_outage':         return 'bg-red-500/20 text-red-300';
    case 'partial_outage':       return 'bg-orange-500/20 text-orange-300';
    case 'degraded_performance': return 'bg-yellow-500/20 text-yellow-300';
    case 'under_maintenance':    return 'bg-blue-500/20 text-blue-300';
    default:                     return 'bg-white/10 text-white/50';
  }
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <p className={`text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-white/60'}`}>{value}</p>
      <p className="text-white/25 text-[10px] uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
