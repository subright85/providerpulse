/**
 * Fetches status + incident history from Statuspage.io APIs for all providers.
 * Writes output to public/data/providers.json (read by the React frontend).
 * Run: node scripts/collect.mjs
 * GitHub Actions: runs every 30 minutes, commits the result.
 */

import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'data', 'providers.json');

const PROVIDERS = [
  { id: 'openai',     name: 'OpenAI',      category: 'llm',     color: '#10a37f', icon: '🤖', apiUrl: 'https://status.openai.com/api/v2/summary.json',        statusPageUrl: 'https://status.openai.com' },
  { id: 'anthropic',  name: 'Anthropic',   category: 'llm',     color: '#d97706', icon: '🧠', apiUrl: 'https://status.anthropic.com/api/v2/summary.json',     statusPageUrl: 'https://status.anthropic.com' },
  { id: 'groq',       name: 'Groq',        category: 'llm',     color: '#f97316', icon: '⚡', apiUrl: 'https://groqstatus.com/api/v2/summary.json',           statusPageUrl: 'https://groqstatus.com' },
  { id: 'cohere',     name: 'Cohere',      category: 'llm',     color: '#6366f1', icon: '🔮', apiUrl: 'https://status.cohere.com/api/v2/summary.json',        statusPageUrl: 'https://status.cohere.com' },
  { id: 'vercel',     name: 'Vercel',      category: 'infra',   color: '#e2e8f0', icon: '▲',  apiUrl: 'https://www.vercel-status.com/api/v2/summary.json',    statusPageUrl: 'https://www.vercel-status.com' },
  { id: 'cloudflare', name: 'Cloudflare',  category: 'infra',   color: '#f6821f', icon: '☁️', apiUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json', statusPageUrl: 'https://www.cloudflarestatus.com' },
  { id: 'github',     name: 'GitHub',      category: 'infra',   color: '#e2e8f0', icon: '🐙', apiUrl: 'https://www.githubstatus.com/api/v2/summary.json',     statusPageUrl: 'https://www.githubstatus.com' },
  { id: 'supabase',   name: 'Supabase',    category: 'data',    color: '#3ecf8e', icon: '🗄️', apiUrl: 'https://status.supabase.com/api/v2/summary.json',      statusPageUrl: 'https://status.supabase.com' },
  { id: 'pinecone',   name: 'Pinecone',    category: 'data',    color: '#008080', icon: '🌲', apiUrl: 'https://status.pinecone.io/api/v2/summary.json',       statusPageUrl: 'https://status.pinecone.io' },
  { id: 'stripe',     name: 'Stripe',      category: 'payment', color: '#635bff', icon: '💳', apiUrl: 'https://status.stripe.com/api/v2/summary.json',        statusPageUrl: 'https://status.stripe.com' },
  // Note: Stripe's public summary endpoint may differ per region; fallback handled gracefully
];

const SEVERITY_MAP = { critical: 'critical', major: 'major', minor: 'minor', maintenance: 'maintenance' };

function calcReliabilityScore(uptime30d, incidentCount30d, avgMttr30d) {
  const uptimeScore = uptime30d * 0.6;
  const incidentPenalty = Math.min(30, incidentCount30d * 3);
  const mttrPenalty = avgMttr30d ? Math.min(10, avgMttr30d / 60) : 0;
  return Math.max(0, Math.min(100, uptimeScore + 40 - incidentPenalty - mttrPenalty));
}

async function fetchProvider(p) {
  try {
    const res = await fetch(p.apiUrl, {
      headers: { 'User-Agent': 'ProviderPulse/1.0 (contact@providerpulse.dev)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const indicator = data.status?.indicator ?? 'none';
    const description = data.status?.description ?? 'All Systems Operational';

    // Incidents from last 90 days
    const now = Date.now();
    const cutoff90 = now - 90 * 24 * 60 * 60 * 1000;
    const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;

    const rawIncidents = data.incidents ?? [];
    const incidents = rawIncidents
      .filter(inc => new Date(inc.created_at).getTime() > cutoff90)
      .map(inc => {
        const start = new Date(inc.created_at).getTime();
        const end = inc.resolved_at ? new Date(inc.resolved_at).getTime() : null;
        const duration = end ? Math.round((end - start) / 60000) : null;
        return {
          id: inc.id,
          providerId: p.id,
          title: inc.name,
          severity: SEVERITY_MAP[inc.impact] ?? 'minor',
          startedAt: inc.created_at,
          resolvedAt: inc.resolved_at ?? null,
          durationMinutes: duration,
          url: inc.shortlink ?? p.statusPageUrl,
        };
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    const recent30 = incidents.filter(i => new Date(i.startedAt).getTime() > cutoff30);
    const resolved30 = recent30.filter(i => i.durationMinutes !== null);
    const avgMttr = resolved30.length
      ? Math.round(resolved30.reduce((s, i) => s + i.durationMinutes, 0) / resolved30.length)
      : null;

    // Estimate uptime from incident durations (very rough but useful)
    const totalDownMinutes30 = recent30.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
    const totalMinutes30 = 30 * 24 * 60;
    const uptime30d = Math.min(100, parseFloat(((1 - totalDownMinutes30 / totalMinutes30) * 100).toFixed(2)));

    const totalDownMinutes90 = incidents.reduce((s, i) => s + (i.durationMinutes ?? 0), 0);
    const totalMinutes90 = 90 * 24 * 60;
    const uptime90d = Math.min(100, parseFloat(((1 - totalDownMinutes90 / totalMinutes90) * 100).toFixed(2)));

    const reliabilityScore = calcReliabilityScore(uptime30d, recent30.length, avgMttr);

    return {
      provider: p,
      status: { providerId: p.id, indicator, description, updatedAt: new Date().toISOString() },
      stats: {
        providerId: p.id,
        uptime30d, uptime90d,
        incidentCount30d: recent30.length,
        avgMttr30d: avgMttr,
        lastIncident: incidents[0]?.startedAt ?? null,
        reliabilityScore,
      },
      recentIncidents: incidents.slice(0, 10),
    };
  } catch (err) {
    console.error(`[${p.name}] failed:`, err.message);
    return {
      provider: p,
      status: { providerId: p.id, indicator: 'none', description: 'Status unavailable', updatedAt: new Date().toISOString() },
      stats: { providerId: p.id, uptime30d: null, uptime90d: null, incidentCount30d: 0, avgMttr30d: null, lastIncident: null, reliabilityScore: null },
      recentIncidents: [],
    };
  }
}

async function main() {
  console.log(`Collecting ${PROVIDERS.length} providers...`);
  const results = [];
  for (const p of PROVIDERS) {
    process.stdout.write(`  ${p.name}... `);
    const data = await fetchProvider(p);
    results.push(data);
    console.log(`✓ score=${data.stats.reliabilityScore ?? '?'} uptime=${data.stats.uptime30d ?? '?'}%`);
    await new Promise(r => setTimeout(r, 300)); // throttle
  }

  const output = { providers: results, generatedAt: new Date().toISOString() };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
