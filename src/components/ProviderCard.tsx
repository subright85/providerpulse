import { useState } from 'react';
import type { ProviderData, Provider, ProviderComponent, MonthlyTrend } from '../types';

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

function scoreColor(score: number): string {
  return score >= 90 ? '#34d399' : score >= 75 ? '#60a5fa' : score >= 60 ? '#818cf8' : '#a78bfa';
}

function ScoreRing({ score, period }: { score: number | null; period: '30D' | '90D' }) {
  const size = 44;
  const r = 18;
  const stroke = 2.5;
  if (score === null) {
    return (
      <div
        className="rounded-full border border-white/10 flex flex-col items-center justify-center text-white/25"
        style={{ width: size, height: size }}
        title={`${period} reliability unavailable`}
      >
        <span className="text-[9px] font-bold leading-none">N/A</span>
        <span className="text-[6px] text-white/30 font-semibold uppercase tracking-wide leading-none mt-0.5">{period}</span>
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
      <span className="text-[11px] font-bold leading-none" style={{ color }}>{score}</span>
      <span className="text-[6px] text-white/30 font-semibold uppercase tracking-wide leading-none mt-0.5">{period}</span>
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

function componentDotColor(status: ProviderComponent['status']): string {
  switch (status) {
    case 'major_outage':         return 'bg-red-500';
    case 'partial_outage':       return 'bg-orange-500';
    case 'degraded_performance': return 'bg-yellow-500';
    case 'under_maintenance':    return 'bg-blue-500';
    default:                     return 'bg-emerald-500/60';
  }
}

// Visualize all components as a dot grid — like a status calendar but for
// components. Each dot = one component, colored by status. Failing first.
function ComponentDots({ components }: { components: ProviderComponent[] }) {
  if (components.length === 0) return null;
  const sorted = [...components].sort((a, b) => {
    const aOk = a.status === 'operational' ? 1 : 0;
    const bOk = b.status === 'operational' ? 1 : 0;
    return aOk - bOk;
  });
  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map(c => (
        <span
          key={c.id}
          className={`w-2 h-2 rounded-sm ${componentDotColor(c.status)}`}
          title={`${c.name} — ${c.status.replace('_', ' ')}`}
        />
      ))}
    </div>
  );
}

// 3-month incident sparkline (bars). Tiny, fits inside card.
function IncidentSparkline({ trend }: { trend: MonthlyTrend[] }) {
  if (trend.length === 0) return null;
  const max = Math.max(...trend.map(t => t.incidentCount), 1);
  return (
    <div className="flex gap-1 items-end">
      {trend.map(m => {
        const h = (m.incidentCount / max) * 100;
        return (
          <div key={m.month} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className="w-full h-5 bg-white/5 rounded-sm flex items-end overflow-hidden">
              <div
                className="w-full bg-blue-400/60 rounded-sm"
                style={{ height: `${Math.max(h, 4)}%` }}
                title={`${m.label}: ${m.incidentCount} incidents`}
              />
            </div>
            <span className="text-[7px] text-white/30 leading-none">{m.label.split(' ')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  data: ProviderData;
  onClick: () => void;
}

export default function ProviderCard({ data, onClick }: Props) {
  const { provider, status, stats, recentIncidents, components } = data;
  const ind = INDICATOR_CONFIG[status.indicator] ?? INDICATOR_CONFIG.none;
  const isActive = status.indicator !== 'none' && status.indicator !== 'maintenance';
  const borderCls = isActive
    ? `border-l-[3px] ${ACTIVE_BORDER[status.indicator as keyof typeof ACTIVE_BORDER] ?? 'border-yellow-500/40'} border-t border-r border-b border-t-white/8 border-r-white/8 border-b-white/8`
    : 'border border-white/8';

  const activeIncident = recentIncidents.find(i =>
    i.resolvedAt === null && i.severity !== 'maintenance'
  );
  const failingComps = components.filter(c => c.status !== 'operational');

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white/4 rounded-2xl p-4 hover:bg-white/6 transition-all duration-150 active:scale-99 flex flex-col gap-3 ${borderCls}`}
    >
      {/* Header — logo, name, status pill, score rings */}
      <div className="flex items-start gap-3">
        <ProviderIcon provider={provider} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-sm truncate">{provider.name}</p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${ind.bg} ${ind.text}`}>
              <span className={`w-1 h-1 rounded-full ${isActive ? 'animate-pulse' : ''} ${ind.dot}`} />
              {ind.label}
            </span>
          </div>
          {activeIncident && (
            <p className="text-[11px] text-orange-300/80 mt-0.5 truncate leading-tight">
              ⚠ {activeIncident.title}
            </p>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <ScoreRing score={stats.reliabilityScore} period="30D" />
          <ScoreRing score={stats.reliabilityScore90d} period="90D" />
        </div>
      </div>

      {/* Component dot grid — visual at-a-glance health */}
      {components.length > 0 && (
        <div className="bg-white/3 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">Components</span>
            <span className={`text-[10px] tabular-nums ${failingComps.length === 0 ? 'text-emerald-400' : 'text-orange-300'}`}>
              {failingComps.length === 0 ? `${components.length} OK` : `${failingComps.length} of ${components.length} affected`}
            </span>
          </div>
          <ComponentDots components={components} />
        </div>
      )}

      {/* Stats row + 3-month sparkline */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="30d uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} ok={stats.uptime30d !== null && stats.uptime30d >= 99.5} />
        <Stat label="Incidents" value={String(stats.incidentCount30d)} ok={stats.incidentCount30d === 0} />
        <Stat label="Last inc." value={fmtLastIncident(stats.lastIncident)} ok={!stats.lastIncident} />
      </div>

      {stats.monthlyTrend.length > 0 && (
        <div className="border-t border-white/6 pt-2">
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wide mb-1">3-month incidents</p>
          <IncidentSparkline trend={stats.monthlyTrend} />
        </div>
      )}
    </button>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <p className={`text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-white/70'}`}>{value}</p>
      <p className="text-white/25 text-[10px] uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
