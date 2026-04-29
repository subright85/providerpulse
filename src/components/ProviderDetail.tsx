import { useState } from 'react';
import type { ProviderData, Incident, MonthlyTrend, NewsItem, TagSummaryItem, IncidentTag, Provider } from '../types';

const SEV_CONFIG = {
  critical:    { color: 'text-red-400',    bg: 'bg-red-500/15',    label: 'Critical' },
  major:       { color: 'text-orange-400', bg: 'bg-orange-500/15', label: 'Major' },
  minor:       { color: 'text-yellow-400', bg: 'bg-yellow-500/15', label: 'Minor' },
  maintenance: { color: 'text-blue-400',   bg: 'bg-blue-500/15',   label: 'Maintenance' },
};

const TAG_COLORS: Record<IncidentTag, string> = {
  'availability': 'bg-red-500/20 text-red-300',
  'api':          'bg-orange-500/20 text-orange-300',
  'inference':    'bg-violet-500/20 text-violet-300',
  'performance':  'bg-yellow-500/20 text-yellow-300',
  'auth':         'bg-blue-500/20 text-blue-300',
  'rate-limit':   'bg-cyan-500/20 text-cyan-300',
  'network':      'bg-indigo-500/20 text-indigo-300',
  'database':     'bg-teal-500/20 text-teal-300',
  'billing':      'bg-green-500/20 text-green-300',
  'webhook':      'bg-pink-500/20 text-pink-300',
  'deployment':   'bg-amber-500/20 text-amber-300',
  'other':        'bg-white/10 text-white/40',
};

function fmtDuration(mins: number | null): string {
  if (mins === null) return 'Ongoing';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

interface Props {
  data: ProviderData;
  onClose: () => void;
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  return score >= 90 ? '#34d399' : score >= 75 ? '#60a5fa' : score >= 60 ? '#818cf8' : '#a78bfa';
}

function ScoreBlock({ score, label }: { score: number | null; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <p className="text-3xl font-black leading-none" style={{ color: getScoreColor(score) }}>{score ?? '—'}</p>
      <p className="text-white/40 text-[9px] font-semibold uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function ProviderLogo({ provider, size = 24 }: { provider: Provider; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !provider.domain) {
    return <span style={{ fontSize: size }}>{provider.icon}</span>;
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${provider.domain}&sz=64`}
      alt={provider.name}
      style={{ width: size, height: size }}
      className="rounded shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

export default function ProviderDetail({ data, onClose }: Props) {
  const { provider, status, stats, recentIncidents, news } = data;
  const score = stats.reliabilityScore;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0f1117] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90svh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0f1117] border-b border-white/8 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProviderLogo provider={provider} size={28} />
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{provider.name}</h2>
              <p className="text-white/40 text-xs">{status.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-xl">✕</button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Score + stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 flex items-center justify-around gap-2">
              <ScoreBlock score={score} label="30-Day" />
              <div className="w-px h-12 bg-white/10" />
              <ScoreBlock score={stats.reliabilityScore90d} label="90-Day" />
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 flex flex-col gap-2.5">
              <StatRow label="30-day uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} />
              <StatRow label="90-day uptime" value={stats.uptime90d !== null ? `${stats.uptime90d}%` : '—'} />
              <StatRow label="Incidents (30d)" value={String(stats.incidentCount30d)} />
              <StatRow label="Avg. MTTR" value={stats.avgMttr30d !== null ? `${stats.avgMttr30d}m` : '—'} />
            </div>
          </div>

          {/* Monthly trend */}
          {stats.monthlyTrend.length > 0 && <TrendChart trend={stats.monthlyTrend} />}

          {/* Tag breakdown */}
          {stats.tagSummary.length > 0 && <TagBreakdown tags={stats.tagSummary} />}

          {/* Assessment */}
          {score !== null && (
            <div className="bg-white/4 border border-white/8 rounded-xl p-4">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Assessment</p>
              <p className="text-white/70 text-sm leading-relaxed">{getAssessment(stats)}</p>
            </div>
          )}

          {/* Incidents */}
          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Incident History (90 days)</p>
            {recentIncidents.length === 0 ? (
              <div className="bg-white/4 border border-white/8 rounded-xl py-6 text-center">
                <p className="text-emerald-400 text-sm font-semibold">No incidents recorded</p>
                <p className="text-white/30 text-xs mt-1">Clean track record for the past 90 days</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentIncidents.map(inc => <IncidentRow key={inc.id} inc={inc} />)}
              </div>
            )}
          </div>

          {/* News */}
          {news && news.length > 0 && (
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Related News</p>
              <div className="flex flex-col gap-2">
                {news.map(item => <NewsRow key={item.id} item={item} />)}
              </div>
            </div>
          )}

          <a
            href={provider.statusPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-2.5 rounded-xl border border-white/12 text-white/50 hover:text-white hover:border-white/25 text-sm font-medium transition-all"
          >
            Official Status Page ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/40 text-xs">{label}</span>
      <span className="text-white/80 text-xs font-semibold">{value}</span>
    </div>
  );
}

function TrendChart({ trend }: { trend: MonthlyTrend[] }) {
  const maxInc = Math.max(...trend.map(t => t.incidentCount), 1);
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-4">
      <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">90-Day Incident Trend</p>
      <div className="flex items-end gap-1.5 h-20">
        {trend.map(t => {
          const barColor = t.incidentCount === 0
            ? 'bg-emerald-500/30'
            : t.incidentCount <= 2 ? 'bg-yellow-500/50' : 'bg-orange-500/60';
          return (
            <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-white/40 text-[9px] font-semibold tabular-nums">{t.incidentCount || ''}</span>
              <div className="w-full flex flex-col justify-end" style={{ height: '52px' }}>
                <div
                  className={`w-full rounded-sm ${barColor}`}
                  style={{ height: t.incidentCount === 0 ? '3px' : `${Math.max(8, (t.incidentCount / maxInc) * 52)}px` }}
                />
              </div>
              <span className="text-white/25 text-[9px] whitespace-nowrap">{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TagBreakdown({ tags }: { tags: TagSummaryItem[] }) {
  const max = Math.max(...tags.map(t => t.count90d), 1);
  const top = tags.slice(0, 6);
  return (
    <div className="bg-white/4 border border-white/8 rounded-xl p-4">
      <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">Incident Type Breakdown (90d)</p>
      <div className="flex flex-col gap-2">
        {top.map(t => {
          const tagColor = TAG_COLORS[t.tag as IncidentTag] ?? TAG_COLORS.other;
          const pct = (t.count90d / max) * 100;
          const trend30 = t.count30d / Math.max(t.count90d, 1);
          const trendIcon = trend30 > 0.45 ? '↑' : trend30 < 0.20 ? '↓' : '→';
          const trendColor = trend30 > 0.45 ? 'text-red-400' : trend30 < 0.20 ? 'text-emerald-400' : 'text-white/30';
          return (
            <div key={t.tag} className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 w-24 text-center ${tagColor}`}>{t.tag}</span>
              <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                <div className="h-full bg-white/25 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-white/40 text-[10px] tabular-nums w-6 text-right">{t.count90d}</span>
              <span className={`text-[10px] font-bold w-3 ${trendColor}`}>{trendIcon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TagPill({ tag }: { tag: IncidentTag }) {
  const cls = TAG_COLORS[tag] ?? TAG_COLORS.other;
  return (
    <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${cls}`}>{tag}</span>
  );
}

function IncidentRow({ inc }: { inc: Incident }) {
  const sev = SEV_CONFIG[inc.severity] ?? SEV_CONFIG.minor;
  return (
    <a
      href={inc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-xl p-3 hover:bg-white/7 transition-all"
    >
      <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${sev.bg} ${sev.color}`}>{sev.label}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-xs font-medium leading-snug">{inc.title}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {inc.tags?.map(tag => <TagPill key={tag} tag={tag} />)}
        </div>
        <div className="flex gap-2 mt-1">
          <span className="text-white/30 text-[10px]">{fmtDate(inc.startedAt)}</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-white/30 text-[10px]">{fmtDuration(inc.durationMinutes)}</span>
        </div>
      </div>
    </a>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-xl p-3 hover:bg-white/7 transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-white/75 text-xs font-medium leading-snug">{item.title}</p>
        <div className="flex gap-2 mt-1">
          <span className="text-orange-400/60 text-[10px] font-semibold">HN</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-white/30 text-[10px]">{fmtRelative(item.publishedAt)}</span>
          {item.points > 0 && (
            <>
              <span className="text-white/20 text-[10px]">·</span>
              <span className="text-white/30 text-[10px]">{item.points}pts</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

function getAssessment(stats: ProviderData['stats']): string {
  const s = stats.reliabilityScore ?? 0;
  const inc = stats.incidentCount30d;
  const mttr = stats.avgMttr30d;

  if (s >= 95) return `Excellent reliability. ${inc === 0 ? 'No incidents in the past 30 days.' : `Rare incidents with fast recovery (avg ${mttr}m MTTR).`} Suitable for production-critical workloads.`;
  if (s >= 85) return `Good reliability overall. ${inc > 0 ? `${inc} incident${inc > 1 ? 's' : ''} in 30 days with ${mttr ? `${mttr}m avg recovery` : 'variable recovery time'}.` : ''} Recommended to have a fallback plan for sensitive services.`;
  if (s >= 70) return `Moderate reliability. Recurring incidents may impact SLA-sensitive applications. Consider redundancy or multi-provider architecture.`;
  return `Below-average reliability based on historical data. High incident frequency or slow recovery times observed. Evaluate alternatives before critical adoption.`;
}
