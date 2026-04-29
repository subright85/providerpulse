import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { AppData, ProviderData, MonthlyTrend } from '../types';

const DATA_URL = `${import.meta.env.BASE_URL}data/providers.json`;

function setMeta(title: string, description: string) {
  document.title = title;
  let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.name = 'description';
    document.head.appendChild(descTag);
  }
  descTag.content = description;

  // OG tags
  const setOg = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.content = content;
  };
  setOg('og:title', title);
  setOg('og:description', description);
}

function scoreColor(score: number | null): string {
  if (score === null) return '#94a3b8';
  return score >= 90 ? '#34d399' : score >= 75 ? '#60a5fa' : score >= 60 ? '#818cf8' : '#a78bfa';
}

function pickWinner(a: ProviderData, b: ProviderData): string {
  const sa = a.stats.reliabilityScore, sb = b.stats.reliabilityScore;
  if (sa === null && sb === null) return `Both ${a.provider.name} and ${b.provider.name} lack enough historical data to compare reliability head-to-head.`;
  if (sa === null) return `${b.provider.name} has measurable historical reliability data; ${a.provider.name} doesn't.`;
  if (sb === null) return `${a.provider.name} has measurable historical reliability data; ${b.provider.name} doesn't.`;
  const diff = sa - sb;
  if (Math.abs(diff) < 3) {
    return `${a.provider.name} (${sa}) and ${b.provider.name} (${sb}) are roughly tied on 30-day reliability — pick based on features, latency, or pricing instead.`;
  }
  const winner = diff > 0 ? a : b;
  const loser  = diff > 0 ? b : a;
  const wScore = diff > 0 ? sa : sb;
  const lScore = diff > 0 ? sb : sa;
  return `${winner.provider.name} edges out ${loser.provider.name} on 30-day reliability (${wScore} vs ${lScore}). The gap reflects ${winner.provider.name}'s lower incident count and shorter recovery time over the past month.`;
}

export default function ComparePage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parts = (slug ?? '').split('-vs-');
  const idA = parts[0];
  const idB = parts[1];

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(setData)
      .catch(() => setError('Failed to load data'));
  }, []);

  useEffect(() => {
    if (!data || !idA || !idB) return;
    const a = data.providers.find(p => p.provider.id === idA);
    const b = data.providers.find(p => p.provider.id === idB);
    if (a && b) {
      setMeta(
        `${a.provider.name} vs ${b.provider.name} — Reliability Comparison | ProviderPulse`,
        `Compare ${a.provider.name} and ${b.provider.name} on uptime, incident count, and 30/90-day reliability scores from real status-page data.`
      );
    }
  }, [data, idA, idB]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  if (!idA || !idB) return <ErrorState message="Bad URL — expected /compare/{providerA}-vs-{providerB}" />;

  const a = data.providers.find(p => p.provider.id === idA);
  const b = data.providers.find(p => p.provider.id === idB);

  if (!a || !b) {
    return <ErrorState message={`Provider not found: ${!a ? idA : idB}. Check spelling or pick from the home page.`} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <Link to="/" className="text-white/40 hover:text-white text-sm inline-flex items-center gap-1.5 mb-6">
          ← All providers
        </Link>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight">
          {a.provider.name} <span className="text-white/30">vs</span> {b.provider.name}
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Reliability comparison from official status-page data · 90-day window
        </p>

        {/* Side-by-side cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <CompareCard data={a} />
          <CompareCard data={b} />
        </div>

        {/* Verdict */}
        <div className="mt-6 bg-white/4 border border-white/8 rounded-2xl p-5">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">Which should you pick?</p>
          <p className="text-white/85 text-sm leading-relaxed">{pickWinner(a, b)}</p>
        </div>

        {/* Side-by-side metrics table */}
        <div className="mt-6 bg-white/4 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left text-white/40 text-[10px] font-semibold uppercase tracking-widest px-4 py-2">Metric</th>
                <th className="text-right text-white/40 text-[10px] font-semibold uppercase tracking-widest px-4 py-2">{a.provider.name}</th>
                <th className="text-right text-white/40 text-[10px] font-semibold uppercase tracking-widest px-4 py-2">{b.provider.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <MetricRow label="30-day reliability" valueA={fmtScore(a.stats.reliabilityScore)} valueB={fmtScore(b.stats.reliabilityScore)} />
              <MetricRow label="90-day reliability" valueA={fmtScore(a.stats.reliabilityScore90d)} valueB={fmtScore(b.stats.reliabilityScore90d)} />
              <MetricRow label="30-day uptime" valueA={fmtPct(a.stats.uptime30d)} valueB={fmtPct(b.stats.uptime30d)} />
              <MetricRow label="90-day uptime" valueA={fmtPct(a.stats.uptime90d)} valueB={fmtPct(b.stats.uptime90d)} />
              <MetricRow label="Incidents (30d)" valueA={String(a.stats.incidentCount30d)} valueB={String(b.stats.incidentCount30d)} />
              <MetricRow label="Avg MTTR" valueA={fmtMttr(a.stats.avgMttr30d)} valueB={fmtMttr(b.stats.avgMttr30d)} />
            </tbody>
          </table>
        </div>

        {/* Trend bars */}
        {a.stats.monthlyTrend.length > 0 && b.stats.monthlyTrend.length > 0 && (
          <div className="mt-6 bg-white/4 border border-white/8 rounded-2xl p-5">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">Incident count by month</p>
            <TrendCompare a={a} b={b} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/6 text-center space-y-1">
          <p className="text-white/20 text-xs">
            Data from status.{a.provider.domain} and status.{b.provider.domain} · Refreshed every 30 minutes
          </p>
          <p className="text-white/15 text-xs">All features free · No subscription</p>
        </div>
      </div>
    </div>
  );
}

function CompareCard({ data }: { data: ProviderData }) {
  const { provider, stats, status } = data;
  const score = stats.reliabilityScore;
  const indicatorOk = status.indicator === 'none';
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <img
          src={`https://www.google.com/s2/favicons?domain=${provider.domain}&sz=64`}
          alt={provider.name}
          className="w-7 h-7 rounded"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">{provider.name}</p>
          <p className={`text-[11px] ${indicatorOk ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {status.description}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-5xl font-black leading-none" style={{ color: scoreColor(score) }}>
          {score ?? '—'}
        </p>
        <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">30-day reliability score</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div>
          <p className="text-white/85 font-semibold">{fmtPct(stats.uptime30d)}</p>
          <p className="text-white/30 text-[10px]">30d uptime</p>
        </div>
        <div>
          <p className="text-white/85 font-semibold">{stats.incidentCount30d}</p>
          <p className="text-white/30 text-[10px]">incidents</p>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, valueA, valueB }: { label: string; valueA: string; valueB: string }) {
  return (
    <tr>
      <td className="text-white/50 px-4 py-2.5">{label}</td>
      <td className="text-white/85 font-semibold text-right tabular-nums px-4 py-2.5">{valueA}</td>
      <td className="text-white/85 font-semibold text-right tabular-nums px-4 py-2.5">{valueB}</td>
    </tr>
  );
}

function TrendCompare({ a, b }: { a: ProviderData; b: ProviderData }) {
  const aTrend = a.stats.monthlyTrend;
  const bTrend = b.stats.monthlyTrend;
  const max = Math.max(
    ...aTrend.map(t => t.incidentCount),
    ...bTrend.map(t => t.incidentCount),
    1
  );
  const months = aTrend.map((t: MonthlyTrend, i) => ({
    label: t.label,
    a: t.incidentCount,
    b: bTrend[i]?.incidentCount ?? 0,
  }));
  return (
    <div className="flex flex-col gap-3">
      {months.map(m => (
        <div key={m.label}>
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-white/50 text-xs">{m.label}</p>
            <p className="text-white/30 text-[10px] tabular-nums">
              <span className="text-emerald-400/70">{m.a}</span> · <span className="text-blue-400/70">{m.b}</span>
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/40 w-14 truncate">{a.provider.name}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: `${(m.a / max) * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/40 w-14 truncate">{b.provider.name}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400/60 rounded-full" style={{ width: `${(m.b / max) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtScore(v: number | null): string { return v === null ? '—' : String(v); }
function fmtPct(v: number | null): string   { return v === null ? '—' : `${v}%`; }
function fmtMttr(v: number | null): string  { return v === null ? '—' : `${v}m`; }

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <p className="text-white/40 text-sm">Loading comparison…</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-red-400 font-semibold">{message}</p>
        <Link to="/" className="text-white/50 hover:text-white text-sm mt-4 inline-block underline">
          ← Back to all providers
        </Link>
      </div>
    </div>
  );
}
