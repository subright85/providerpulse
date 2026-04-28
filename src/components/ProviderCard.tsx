import type { ProviderData } from '../types';

const INDICATOR_CONFIG = {
  none:        { label: 'Operational',  bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  minor:       { label: 'Degraded',     bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  major:       { label: 'Major Outage', bg: 'bg-orange-500/15',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  critical:    { label: 'Critical',     bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400' },
  maintenance: { label: 'Maintenance',  bg: 'bg-blue-500/15',    text: 'text-blue-400',    dot: 'bg-blue-400' },
};

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return <div className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center text-white/30 text-xs">N/A</div>;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const scoreColor = score >= 90 ? '#34d399' : score >= 75 ? '#facc15' : '#f87171';
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={scoreColor} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="text-xs font-bold" style={{ color: scoreColor }}>{score}</span>
    </div>
  );
}

interface Props {
  data: ProviderData;
  onClick: () => void;
}

export default function ProviderCard({ data, onClick }: Props) {
  const { provider, status, stats } = data;
  const ind = INDICATOR_CONFIG[status.indicator] ?? INDICATOR_CONFIG.none;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/4 border border-white/8 rounded-2xl p-4 hover:bg-white/7 hover:border-white/15 transition-all duration-150 active:scale-98"
    >
      <div className="flex items-start gap-3">
        {/* Icon + name */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{provider.icon}</span>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight">{provider.name}</p>
            <div className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${ind.bg} ${ind.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ind.dot}`} />
              {ind.label}
            </div>
          </div>
        </div>

        {/* Score */}
        <ScoreRing score={stats.reliabilityScore} />
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-white/6">
        <Stat label="30d uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} good={stats.uptime30d !== null && stats.uptime30d >= 99} />
        <Stat label="Incidents" value={String(stats.incidentCount30d)} good={stats.incidentCount30d === 0} />
        <Stat label="Avg MTTR" value={stats.avgMttr30d !== null ? `${stats.avgMttr30d}m` : '—'} good={stats.avgMttr30d !== null && stats.avgMttr30d < 60} />
      </div>
    </button>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex-1 text-center">
      <p className={`font-bold text-sm ${good ? 'text-emerald-400' : 'text-white/70'}`}>{value}</p>
      <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  );
}
