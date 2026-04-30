import { useState } from 'react';
import type { ProviderData, Provider, ProviderComponent, MonthlyTrend } from '../types';
import { getComponentTier, TIER_LABELS, TIER_ICONS, type ComponentTier } from '../lib/component-tiers';

const INDICATOR_CONFIG = {
  none:        { label: 'OPERATIONAL',  cls: 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10', dot: 'bg-[#00ff00]' },
  minor:       { label: 'DEGRADED',     cls: 'border-[#ffff00] text-[#ffff00] bg-[#ffff00]/10', dot: 'bg-[#ffff00]' },
  major:       { label: 'MAJOR',        cls: 'border-[#ff8800] text-[#ff8800] bg-[#ff8800]/10', dot: 'bg-[#ff8800]' },
  critical:    { label: 'CRITICAL',     cls: 'border-[#ff006e] text-[#ff006e] bg-[#ff006e]/10', dot: 'bg-[#ff006e]' },
  maintenance: { label: 'MAINTENANCE',  cls: 'border-[#00ffff] text-[#00ffff] bg-[#00ffff]/10', dot: 'bg-[#00ffff]' },
};

function fmtLastIncident(iso: string | null): string {
  if (!iso) return 'No incidents';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function scoreColor(score: number): string {
  return score >= 90 ? '#00ff00' : score >= 75 ? '#00ffff' : score >= 60 ? '#ffff00' : '#ff8800';
}

function ScoreBox({ score, period }: { score: number | null; period: '30D' | '90D' }) {
  if (score === null) {
    return (
      <div
        className="border-2 border-white/30 px-2 py-1 flex flex-col items-center justify-center text-white/40 font-mono shrink-0"
        title={`${period} reliability unavailable`}
      >
        <span className="text-[11px] font-bold leading-none">N/A</span>
        <span className="text-[7px] uppercase tracking-wider mt-0.5">{period}</span>
      </div>
    );
  }
  const color = scoreColor(score);
  return (
    <div
      className="border-2 px-2 py-1 flex flex-col items-center justify-center font-mono shrink-0"
      style={{ borderColor: color, color }}
      title={`${period} reliability score`}
    >
      <span className="text-[14px] font-bold leading-none tabular-nums">{score}</span>
      <span className="text-[7px] uppercase tracking-wider mt-0.5 opacity-80">{period}</span>
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
      className="w-6 h-6 shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function componentDotColor(status: ProviderComponent['status']): string {
  switch (status) {
    case 'major_outage':         return 'bg-[#ff006e]';
    case 'partial_outage':       return 'bg-[#ff8800]';
    case 'degraded_performance': return 'bg-[#ffff00]';
    case 'under_maintenance':    return 'bg-[#00ffff]';
    default:                     return 'bg-[#00ff00]/70';
  }
}

const TIER_BORDER: Record<ComponentTier, string> = {
  enduser: 'text-[#00ffff]',
  api:     'text-[#00ff00]',
  infra:   'text-white/50',
};

function ComponentTiers({ providerId, components }: { providerId: string; components: ProviderComponent[] }) {
  if (components.length === 0) return null;

  const grouped: Record<ComponentTier, ProviderComponent[]> = {
    enduser: [],
    api:     [],
    infra:   [],
  };
  for (const c of components) {
    grouped[getComponentTier(providerId, c.name)].push(c);
  }
  for (const tier of Object.keys(grouped) as ComponentTier[]) {
    grouped[tier].sort((a, b) => {
      const aOk = a.status === 'operational' ? 1 : 0;
      const bOk = b.status === 'operational' ? 1 : 0;
      if (aOk !== bOk) return aOk - bOk;
      return a.name.localeCompare(b.name);
    });
  }

  const tierOrder: ComponentTier[] = ['enduser', 'api', 'infra'];

  return (
    <div className="flex flex-col gap-1.5 font-mono">
      {tierOrder.map(tier => {
        const items = grouped[tier];
        if (items.length === 0) return null;
        const failing = items.filter(c => c.status !== 'operational').length;
        return (
          <div key={tier} className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider w-20 shrink-0 ${TIER_BORDER[tier]}`}>
              {TIER_ICONS[tier]} {TIER_LABELS[tier]}
            </span>
            <div className="flex flex-wrap gap-1 flex-1">
              {items.map(c => (
                <span
                  key={c.id}
                  className={`w-2 h-2 ${componentDotColor(c.status)}`}
                  title={`${c.name} — ${c.status.replace('_', ' ')}`}
                />
              ))}
            </div>
            <span className={`text-[10px] font-bold tabular-nums shrink-0 ${failing > 0 ? 'text-[#ff8800]' : 'text-white/40'}`}>
              {failing > 0 ? `${failing}/${items.length}` : `${items.length}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function IncidentSparkline({ trend }: { trend: MonthlyTrend[] }) {
  if (trend.length === 0) return null;
  const max = Math.max(...trend.map(t => t.incidentCount), 1);
  return (
    <div className="flex gap-1 items-end font-mono">
      {trend.map(m => {
        const h = (m.incidentCount / max) * 100;
        return (
          <div key={m.month} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className="w-full h-5 bg-white/5 border-2 border-white/10 flex items-end overflow-hidden">
              <div
                className="w-full bg-[#00ffff]"
                style={{ height: `${Math.max(h, 4)}%` }}
                title={`${m.label}: ${m.incidentCount} incidents`}
              />
            </div>
            <span className="text-[7px] text-white/40 uppercase leading-none">{m.label.split(' ')[0]}</span>
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

  const activeIncident = recentIncidents.find(i =>
    i.resolvedAt === null && i.severity !== 'maintenance'
  );
  const failingComps = components.filter(c => c.status !== 'operational');

  return (
    <button
      onClick={onClick}
      className="pp-card w-full text-left p-4 flex flex-col gap-3 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <ProviderIcon provider={provider} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="pp-display text-base text-white truncate">{provider.name}</p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border-2 text-[9px] font-bold uppercase tracking-wider font-mono ${ind.cls}`}>
              <span className={`w-1.5 h-1.5 ${isActive ? 'animate-pulse' : ''} ${ind.dot}`} />
              {ind.label}
            </span>
          </div>
          {activeIncident && (
            <p className="text-[11px] text-[#ff8800] mt-1 truncate leading-tight font-mono">
              ⚠ {activeIncident.title}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <ScoreBox score={stats.reliabilityScore} period="30D" />
          <ScoreBox score={stats.reliabilityScore90d} period="90D" />
        </div>
      </div>

      {/* Components grouped by audience tier */}
      {components.length > 0 && (
        <div className="border-2 border-white/20 p-2.5">
          <div className="flex items-center justify-between mb-2 font-mono">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Components</span>
            <span className={`text-[10px] font-bold tabular-nums ${failingComps.length === 0 ? 'text-[#00ff00]' : 'text-[#ff8800]'}`}>
              {failingComps.length === 0 ? `${components.length} OK` : `${failingComps.length}/${components.length} AFFECTED`}
            </span>
          </div>
          <ComponentTiers providerId={provider.id} components={components} />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 font-mono">
        <Stat label="30D UPTIME" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} ok={stats.uptime30d !== null && stats.uptime30d >= 99.5} />
        <Stat label="INCIDENTS" value={String(stats.incidentCount30d)} ok={stats.incidentCount30d === 0} />
        <Stat label="LAST INC." value={fmtLastIncident(stats.lastIncident)} ok={!stats.lastIncident} />
      </div>

      {stats.monthlyTrend.length > 0 && (
        <div className="border-t-2 border-white/20 pt-2">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1 font-mono">3-month incidents</p>
          <IncidentSparkline trend={stats.monthlyTrend} />
        </div>
      )}
    </button>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <p className={`text-sm font-bold tabular-nums ${ok ? 'text-[#00ff00]' : 'text-white/85'}`}>{value}</p>
      <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
