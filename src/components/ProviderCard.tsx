import type { ProviderData } from '../types';

const INDICATOR_CONFIG = {
  none:        { label: 'Operational',  bg: 'bg-emerald-500/12', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  minor:       { label: 'Degraded',     bg: 'bg-yellow-500/12',  text: 'text-yellow-400',  dot: 'bg-yellow-400' },
  major:       { label: 'Major Outage', bg: 'bg-orange-500/12',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  critical:    { label: 'Critical',     bg: 'bg-red-500/12',     text: 'text-red-400',     dot: 'bg-red-400' },
  maintenance: { label: 'Maintenance',  bg: 'bg-blue-500/12',    text: 'text-blue-400',    dot: 'bg-blue-400' },
};

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/25 text-xs font-medium">N/A</div>
  );
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const scoreColor = score >= 90 ? '#34d399' : score >= 75 ? '#facc15' : '#f87171';
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={scoreColor} strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="text-[11px] font-bold" style={{ color: scoreColor }}>{score}</span>
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
      className="w-full text-left bg-white/4 border border-white/8 rounded-2xl p-4 hover:bg-white/6 hover:border-white/12 transition-all duration-150 active:scale-99"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{provider.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-sm">{provider.name}</p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${ind.bg} ${ind.text}`}>
              <span className={`w-1 h-1 rounded-full ${ind.dot}`} />
              {ind.label}
            </span>
          </div>

          <div className="flex gap-4 mt-2">
            <Stat label="30d uptime" value={stats.uptime30d !== null ? `${stats.uptime30d}%` : '—'} ok={stats.uptime30d !== null && stats.uptime30d >= 99.5} />
            <Stat label="Incidents" value={String(stats.incidentCount30d)} ok={stats.incidentCount30d === 0} />
            <Stat label="MTTR" value={stats.avgMttr30d !== null ? `${stats.avgMttr30d}m` : '—'} ok={stats.avgMttr30d !== null && stats.avgMttr30d < 60} />
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
