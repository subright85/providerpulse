import { useState } from 'react';
import type { ProviderData, Provider, ProviderComponent, MonthlyTrend } from '../types';
import { getComponentTier, TIER_LABELS, TIER_ICONS, type ComponentTier } from '../lib/component-tiers';

const INDICATOR_CONFIG = {
  none:        { label: 'Operational',  cls: 'border-green-200 text-green-700 bg-green-50',  dot: 'bg-green-500' },
  minor:       { label: 'Degraded',     cls: 'border-yellow-200 text-yellow-700 bg-yellow-50', dot: 'bg-yellow-500' },
  major:       { label: 'Major',        cls: 'border-orange-200 text-orange-700 bg-orange-50', dot: 'bg-orange-500' },
  critical:    { label: 'Critical',     cls: 'border-red-200 text-red-700 bg-red-50', dot: 'bg-red-500' },
  maintenance: { label: 'Maintenance',  cls: 'border-sky-200 text-sky-700 bg-sky-50', dot: 'bg-sky-500' },
};

function fmtLastIncident(iso: string | null): string {
  if (!iso) return 'No incidents';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function scoreColor(score: number): string {
  return score >= 90 ? '#16a34a' : score >= 75 ? '#0ea5e9' : score >= 60 ? '#ca8a04' : '#dc2626';
}

function ScoreBox({ score, period }: { score: number | null; period: '30D' | '90D' }) {
  if (score === null) {
    return (
      <div
        className="border border-slate-200 rounded-md px-2 py-1 flex flex-col items-center justify-center text-slate-400 shrink-0 min-w-[44px]"
        title={`${period} reliability unavailable`}
      >
        <span className="text-[11px] font-semibold leading-none pp-tabular">N/A</span>
        <span className="text-[8px] uppercase tracking-wider mt-0.5 text-slate-400">{period}</span>
      </div>
    );
  }
  const color = scoreColor(score);
  return (
    <div
      className="border rounded-md px-2 py-1 flex flex-col items-center justify-center shrink-0 min-w-[44px]"
      style={{ borderColor: color, color }}
      title={`${period} reliability score`}
    >
      <span className="text-[14px] font-semibold leading-none pp-tabular">{score}</span>
      <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-80">{period}</span>
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
    case 'under_maintenance':    return 'bg-sky-500';
    default:                     return 'bg-green-500/80';
  }
}

const TIER_LABEL_CLR: Record<ComponentTier, string> = {
  enduser: 'text-sky-700',
  api:     'text-emerald-700',
  infra:   'text-slate-500',
};

function ComponentTiers({ providerId, components }: { providerId: string; components: ProviderComponent[] }) {
  if (components.length === 0) return null;

  const grouped: Record<ComponentTier, ProviderComponent[]> = { enduser: [], api: [], infra: [] };
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
    <div className="flex flex-col gap-1.5">
      {tierOrder.map(tier => {
        const items = grouped[tier];
        if (items.length === 0) return null;
        const failing = items.filter(c => c.status !== 'operational').length;
        return (
          <div key={tier} className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wide w-20 shrink-0 ${TIER_LABEL_CLR[tier]}`}>
              {TIER_ICONS[tier]} {TIER_LABELS[tier]}
            </span>
            <div className="flex flex-wrap gap-1 flex-1">
              {items.map(c => (
                <span
                  key={c.id}
                  className={`w-2 h-2 rounded-sm ${componentDotColor(c.status)}`}
                  title={`${c.name} — ${c.status.replace('_', ' ')}`}
                />
              ))}
            </div>
            <span className={`text-[10px] font-semibold pp-tabular shrink-0 ${failing > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
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
    <div className="flex gap-1 items-end">
      {trend.map(m => {
        const h = (m.incidentCount / max) * 100;
        return (
          <div key={m.month} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <div className="w-full h-5 bg-slate-100 rounded-sm flex items-end overflow-hidden">
              <div
                className="w-full bg-sky-500 rounded-sm"
                style={{ height: `${Math.max(h, 4)}%` }}
                title={`${m.label}: ${m.incidentCount} incidents`}
              />
            </div>
            <span className="text-[8px] text-slate-400 leading-none">{m.label.split(' ')[0]}</span>
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
            <p className="text-base font-semibold text-slate-900 truncate">{provider.name}</p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${ind.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-pulse' : ''} ${ind.dot}`} />
              {ind.label}
            </span>
          </div>
          {activeIncident && (
            <p className="text-[11px] text-orange-700 mt-1 truncate leading-tight">
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
        <div className="rounded-md bg-slate-50 border border-slate-100 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Components</span>
            <span className={`text-[10px] font-semibold pp-tabular ${failingComps.length === 0 ? 'text-green-700' : 'text-orange-600'}`}>
              {failingComps.length === 0 ? `${components.length} OK` : `${failingComps.length}/${components.length} affected`}
            </span>
          </div>
          <ComponentTiers providerId={provider.id} components={components} />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="30d uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} ok={stats.uptime30d !== null && stats.uptime30d >= 99.5} />
        <Stat label="Incidents" value={String(stats.incidentCount30d)} ok={stats.incidentCount30d === 0} />
        <Stat label="Last inc." value={fmtLastIncident(stats.lastIncident)} ok={!stats.lastIncident} />
      </div>

      {stats.monthlyTrend.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">3-month incidents</p>
          <IncidentSparkline trend={stats.monthlyTrend} />
        </div>
      )}
    </button>
  );
}

function Stat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div>
      <p className={`text-sm font-semibold pp-tabular ${ok ? 'text-green-700' : 'text-slate-700'}`}>{value}</p>
      <p className="text-slate-400 text-[10px] uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
