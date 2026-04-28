/**
 * Fetches status + incident history from Statuspage.io APIs for all providers.
 * Uses /incidents.json endpoint for historical data (not summary.json which only has active incidents).
 * Writes output to public/data/providers.json (read by the React frontend).
 * Run: node scripts/collect.mjs
 * GitHub Actions: runs every 30 minutes, commits the result.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'data', 'providers.json');

const HEADERS = { 'User-Agent': 'ProviderPulse/1.0 (contact@providerpulse.dev)' };

const PROVIDERS = [
  { id: 'openai',     name: 'OpenAI',      category: 'llm',     color: '#10a37f', icon: '🤖', apiUrl: 'https://status.openai.com/api/v2/summary.json',        statusPageUrl: 'https://status.openai.com' },
  { id: 'anthropic',  name: 'Anthropic',   category: 'llm',     color: '#d97706', icon: '🧠', apiUrl: 'https://status.anthropic.com/api/v2/summary.json',     statusPageUrl: 'https://status.anthropic.com' },
  { id: 'groq',       name: 'Groq',        category: 'llm',     color: '#f97316', icon: '⚡', apiUrl: 'https://groqstatus.com/api/v2/summary.json',           statusPageUrl: 'https://groqstatus.com' },
  { id: 'cohere',     name: 'Cohere',      category: 'llm',     color: '#6366f1', icon: '🔮', apiUrl: 'https://status.cohere.com/api/v2/summary.json',        statusPageUrl: 'https://status.cohere.com' },
  { id: 'vercel',     name: 'Vercel',      category: 'infra',   color: '#e2e8f0', icon: '▲',  apiUrl: 'https://www.vercel-status.com/api/v2/summary.json',    statusPageUrl: 'https://www.vercel-status.com' },
  { id: 'cloudflare', name: 'Cloudflare',  category: 'infra',   color: '#f6821f', icon: '☁️', apiUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json', statusPageUrl: 'https://www.cloudflarestatus.com' },
  { id: 'github',     name: 'GitHub',      category: 'infra',   color: '#e2e8f0', icon: '🐙', apiUrl: 'https://www.githubstatus.com/api/v2/summary.json',     statusPageUrl: 'https://www.githubstatus.com' },
  { id: 'supabase',   name: 'Supabase',    category: 'data',    color: '#3ecf8e', icon: '🗄️', apiUrl: 'https://status.supabase.com/api/v2/summary.json',          statusPageUrl: 'https://status.supabase.com' },
  { id: 'pinecone',   name: 'Pinecone',    category: 'data',    color: '#008080', icon: '🌲', apiUrl: 'https://status.pinecone.io/api/v2/summary.json',           statusPageUrl: 'https://status.pinecone.io' },
  { id: 'twilio',     name: 'Twilio',      category: 'infra',   color: '#f22f46', icon: '📡', apiUrl: 'https://status.twilio.com/api/v2/summary.json',            statusPageUrl: 'https://status.twilio.com' },
  { id: 'plaid',      name: 'Plaid',       category: 'payment', color: '#00c98b', icon: '🏦', apiUrl: 'https://status.plaid.com/api/v2/summary.json',             statusPageUrl: 'https://status.plaid.com' },
  // Note: Stripe's Statuspage.io instance is private — using Plaid as payment/fintech representative
];

const SEVERITY_MAP = { critical: 'critical', major: 'major', minor: 'minor', maintenance: 'maintenance' };
// Severity weight for weighted downtime calculation (maintenance doesn't count as downtime)
const SEVERITY_WEIGHT = { critical: 1.0, major: 0.7, minor: 0.2, maintenance: 0.0 };

function calcReliabilityScore(uptime30d, incidentCount30d, avgMttr30d) {
  if (uptime30d === null) return null;
  const uptimeScore = uptime30d * 0.6;
  const incidentPenalty = Math.min(30, incidentCount30d * 3);
  const mttrPenalty = avgMttr30d ? Math.min(10, avgMttr30d / 60) : 0;
  return Math.max(0, Math.min(100, Math.round(uptimeScore + 40 - incidentPenalty - mttrPenalty)));
}

function buildMonthlyTrend(incidents) {
  const now = new Date();
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const totalMins = Math.round((end - start) / 60000);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    let weightedDownMins = 0;
    let count = 0;
    for (const inc of incidents) {
      if (inc.severity === 'maintenance') continue;
      const incTime = new Date(inc.startedAt).getTime();
      if (incTime >= start.getTime() && incTime < end.getTime()) {
        count++;
        const weight = SEVERITY_WEIGHT[inc.severity] ?? 1.0;
        weightedDownMins += Math.round((inc.durationMinutes ?? 0) * weight);
      }
    }

    const uptime = parseFloat(((1 - Math.min(weightedDownMins, totalMins) / totalMins) * 100).toFixed(2));
    months.push({ month: key, label, incidentCount: count, uptime });
  }
  return months;
}

async function safeFetch(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    return res;
  } catch (e) {
    return { ok: false, status: 0, _err: e.message };
  }
}

async function fetchProviderNews(providerName) {
  try {
    const query = encodeURIComponent(`${providerName} outage`);
    const since = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60; // 90 days
    const numericFilters = encodeURIComponent(`created_at_i>${since}`);
    const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&numericFilters=${numericFilters}&hitsPerPage=5`;
    const res = await safeFetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits ?? []).map(h => ({
      id: h.objectID,
      title: h.title,
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: 'hackernews',
      publishedAt: h.created_at,
      points: h.points ?? 0,
      commentCount: h.num_comments ?? 0,
    }));
  } catch {
    return [];
  }
}

async function fetchProvider(p) {
  try {
    const baseUrl = p.apiUrl.replace('/summary.json', '');
    // Fetch current status + historical incidents in parallel
    // incidents.json has the full 90-day+ history; summary.json only has currently-active incidents
    const [summaryRes, incidentsRes] = await Promise.all([
      safeFetch(p.apiUrl),
      safeFetch(`${baseUrl}/incidents.json?limit=100`),
    ]);

    if (!summaryRes.ok) throw new Error(`summary HTTP ${summaryRes.status}`);
    const summary = await summaryRes.json();

    const indicator = summary.status?.indicator ?? 'none';
    const description = summary.status?.description ?? 'All Systems Operational';

    let rawIncidents = [];
    if (incidentsRes.ok) {
      const incData = await incidentsRes.json();
      rawIncidents = incData.incidents ?? [];
    } else {
      // Fallback: summary.json incidents (usually empty when no active incidents)
      rawIncidents = summary.incidents ?? [];
      console.warn(`  ⚠ ${p.name}: incidents endpoint ${incidentsRes.status}, fell back to summary`);
    }

    const now = Date.now();
    const cutoff90 = now - 90 * 24 * 60 * 60 * 1000;
    const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;

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

    const recent30 = incidents.filter(i => i.severity !== 'maintenance' && new Date(i.startedAt).getTime() > cutoff30);
    const resolved30 = recent30.filter(i => i.durationMinutes !== null);
    const avgMttr = resolved30.length
      ? Math.round(resolved30.reduce((s, i) => s + i.durationMinutes, 0) / resolved30.length)
      : null;

    // Severity-weighted downtime for uptime calculation
    const weightedDown30 = recent30.reduce((s, i) => {
      return s + Math.round((i.durationMinutes ?? 0) * (SEVERITY_WEIGHT[i.severity] ?? 1.0));
    }, 0);
    const uptime30d = parseFloat(((1 - Math.min(weightedDown30, 30 * 24 * 60) / (30 * 24 * 60)) * 100).toFixed(2));

    const nonMaint90 = incidents.filter(i => i.severity !== 'maintenance');
    const weightedDown90 = nonMaint90.reduce((s, i) => {
      return s + Math.round((i.durationMinutes ?? 0) * (SEVERITY_WEIGHT[i.severity] ?? 1.0));
    }, 0);
    const uptime90d = parseFloat(((1 - Math.min(weightedDown90, 90 * 24 * 60) / (90 * 24 * 60)) * 100).toFixed(2));

    const reliabilityScore = calcReliabilityScore(uptime30d, recent30.length, avgMttr);
    const monthlyTrend = buildMonthlyTrend(incidents);

    return {
      provider: p,
      status: { providerId: p.id, indicator, description, updatedAt: new Date().toISOString() },
      stats: {
        providerId: p.id,
        uptime30d,
        uptime90d,
        incidentCount30d: recent30.length,
        avgMttr30d: avgMttr,
        lastIncident: incidents[0]?.startedAt ?? null,
        reliabilityScore,
        monthlyTrend,
      },
      recentIncidents: incidents.slice(0, 15),
    };
  } catch (err) {
    console.error(`  ✗ [${p.name}] failed: ${err.message}`);
    return {
      provider: p,
      status: { providerId: p.id, indicator: 'none', description: 'Status unavailable', updatedAt: new Date().toISOString() },
      stats: {
        providerId: p.id,
        uptime30d: null,
        uptime90d: null,
        incidentCount30d: 0,
        avgMttr30d: null,
        lastIncident: null,
        reliabilityScore: null,
        monthlyTrend: [],
      },
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
    console.log(`score=${data.stats.reliabilityScore ?? '?'} uptime30d=${data.stats.uptime30d ?? '?'}% inc30d=${data.stats.incidentCount30d}`);
    await new Promise(r => setTimeout(r, 400)); // throttle between providers
  }

  // Fetch HN news for all providers (separate pass)
  console.log('\nFetching news...');
  for (const entry of results) {
    process.stdout.write(`  ${entry.provider.name} news... `);
    entry.news = await fetchProviderNews(entry.provider.name);
    console.log(`${entry.news.length} items`);
    await new Promise(r => setTimeout(r, 300));
  }

  const output = { providers: results, generatedAt: new Date().toISOString() };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
