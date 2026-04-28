import type { ProviderData, Incident } from '../types';

const SEV_CONFIG = {
  critical:    { color: 'text-red-400',    bg: 'bg-red-500/15',    label: 'Critical' },
  major:       { color: 'text-orange-400', bg: 'bg-orange-500/15', label: 'Major' },
  minor:       { color: 'text-yellow-400', bg: 'bg-yellow-500/15', label: 'Minor' },
  maintenance: { color: 'text-blue-400',   bg: 'bg-blue-500/15',   label: 'Maintenance' },
};

function fmtDuration(mins: number | null): string {
  if (mins === null) return 'Ongoing';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  data: ProviderData;
  onClose: () => void;
}

export default function ProviderDetail({ data, onClose }: Props) {
  const { provider, status, stats, recentIncidents } = data;
  const score = stats.reliabilityScore;
  const scoreColor = score !== null ? (score >= 90 ? '#34d399' : score >= 75 ? '#facc15' : '#f87171') : '#94a3b8';

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
            <span className="text-2xl">{provider.icon}</span>
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
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1">
              <p className="text-4xl font-black" style={{ color: scoreColor }}>{score ?? '—'}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest">Reliability Score</p>
              <p className="text-white/25 text-[10px]">out of 100</p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 flex flex-col gap-2.5">
              <StatRow label="30-day uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} />
              <StatRow label="90-day uptime" value={stats.uptime90d !== null ? `${stats.uptime90d}%` : '—'} />
              <StatRow label="Incidents (30d)" value={String(stats.incidentCount30d)} />
              <StatRow label="Avg. MTTR" value={stats.avgMttr30d !== null ? `${stats.avgMttr30d}m` : '—'} />
            </div>
          </div>

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
        <p className="text-white/80 text-xs font-medium truncate">{inc.title}</p>
        <div className="flex gap-2 mt-0.5">
          <span className="text-white/30 text-[10px]">{fmtDate(inc.startedAt)}</span>
          <span className="text-white/20 text-[10px]">·</span>
          <span className="text-white/30 text-[10px]">{fmtDuration(inc.durationMinutes)}</span>
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
