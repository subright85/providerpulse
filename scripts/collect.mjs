/**
 * Fetches status + incident history for all providers.
 * Statuspage.io providers: /incidents.json for history (summary.json = active only).
 * Google AI: status.cloud.google.com/incidents.json (custom format).
 * Writes output to public/data/providers.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT = join(ROOT, 'public', 'data', 'providers.json');

const HEADERS = { 'User-Agent': 'ProviderPulse/1.0 (contact@providerpulse.dev)' };

const PROVIDERS = [
  // LLM
  { id: 'openai',     name: 'OpenAI',        category: 'llm',     icon: '🤖', apiUrl: 'https://status.openai.com/api/v2/summary.json',        statusPageUrl: 'https://status.openai.com' },
  { id: 'anthropic',  name: 'Anthropic',     category: 'llm',     icon: '🧠', apiUrl: 'https://status.anthropic.com/api/v2/summary.json',     statusPageUrl: 'https://status.anthropic.com' },
  { id: 'google-ai',  name: 'Google AI',     category: 'llm',     icon: '✨', apiUrl: 'https://status.cloud.google.com/incidents.json',       statusPageUrl: 'https://status.cloud.google.com', type: 'gcp' },
  { id: 'groq',       name: 'Groq',          category: 'llm',     icon: '⚡', apiUrl: 'https://groqstatus.com/api/v2/summary.json',           statusPageUrl: 'https://groqstatus.com' },
  { id: 'cohere',     name: 'Cohere',        category: 'llm',     icon: '🔮', apiUrl: 'https://status.cohere.com/api/v2/summary.json',        statusPageUrl: 'https://status.cohere.com' },
  { id: 'deepseek',   name: 'DeepSeek',      category: 'llm',     icon: '🐋', apiUrl: 'https://status.deepseek.com/api/v2/summary.json',      statusPageUrl: 'https://status.deepseek.com' },
  // Infrastructure
  { id: 'vercel',     name: 'Vercel',        category: 'infra',   icon: '▲',  apiUrl: 'https://www.vercel-status.com/api/v2/summary.json',    statusPageUrl: 'https://www.vercel-status.com' },
  { id: 'cloudflare', name: 'Cloudflare',    category: 'infra',   icon: '☁️', apiUrl: 'https://www.cloudflarestatus.com/api/v2/summary.json', statusPageUrl: 'https://www.cloudflarestatus.com' },
  { id: 'github',     name: 'GitHub',        category: 'infra',   icon: '🐙', apiUrl: 'https://www.githubstatus.com/api/v2/summary.json',     statusPageUrl: 'https://www.githubstatus.com' },
  { id: 'azure',      name: 'Azure',         category: 'infra',   icon: '🔷', apiUrl: 'https://azurestatuscdn.azureedge.net/en-us/status/feed/', statusPageUrl: 'https://azure.status.microsoft/en-us/status/', type: 'azure-rss' },
  { id: 'netlify',    name: 'Netlify',       category: 'infra',   icon: '🌐', apiUrl: 'https://www.netlifystatus.com/api/v2/summary.json',    statusPageUrl: 'https://www.netlifystatus.com' },
  { id: 'render',     name: 'Render',        category: 'infra',   icon: '🎨', apiUrl: 'https://status.render.com/api/v2/summary.json',        statusPageUrl: 'https://status.render.com' },
  // Data & Storage
  { id: 'supabase',   name: 'Supabase',      category: 'data',    icon: '🗄️', apiUrl: 'https://status.supabase.com/api/v2/summary.json',      statusPageUrl: 'https://status.supabase.com' },
  { id: 'pinecone',   name: 'Pinecone',      category: 'data',    icon: '🌲', apiUrl: 'https://status.pinecone.io/api/v2/summary.json',       statusPageUrl: 'https://status.pinecone.io' },
  { id: 'mongodb',    name: 'MongoDB Atlas', category: 'data',    icon: '🍃', apiUrl: 'https://status.mongodb.com/api/v2/summary.json',       statusPageUrl: 'https://status.mongodb.com' },
  { id: 'upstash',    name: 'Upstash',       category: 'data',    icon: '🔴', apiUrl: 'https://status.upstash.com/api/v2/summary.json',       statusPageUrl: 'https://status.upstash.com' },
  // Payments & Communication
  { id: 'twilio',     name: 'Twilio',        category: 'payment', icon: '📡', apiUrl: 'https://status.twilio.com/api/v2/summary.json',        statusPageUrl: 'https://status.twilio.com' },
  { id: 'sendgrid',   name: 'SendGrid',      category: 'payment', icon: '📧', apiUrl: 'https://status.sendgrid.com/api/v2/summary.json',      statusPageUrl: 'https://status.sendgrid.com' },
  { id: 'plaid',      name: 'Plaid',         category: 'payment', icon: '🏦', apiUrl: 'https://status.plaid.com/api/v2/summary.json',         statusPageUrl: 'https://status.plaid.com' },
];

const SEVERITY_WEIGHT = { critical: 1.0, major: 0.7, minor: 0.2, maintenance: 0.0 };

const TAG_PATTERNS = [
  { tag: 'inference',   re: /inference|completion|generat|embedding|model\s+perf|llm\b|claude|gpt|gemini|chat\s*api/i },
  { tag: 'rate-limit',  re: /rate.?limit|429|throttl|quota|capacity/i },
  { tag: 'auth',        re: /\bauth|login|oauth|api.?key|credential|token\b|unauthorized|403\b/i },
  { tag: 'billing',     re: /billing|payment|invoice|charge|subscription/i },
  { tag: 'database',    re: /database|postgres|mysql|redis\b|storage\s+error|db\b/i },
  { tag: 'webhook',     re: /webhook|event\s+deliver|notification/i },
  { tag: 'deployment',  re: /deploy|rollout|update\s+error|migration/i },
  { tag: 'performance', re: /latency|slow\b|degraded\s+perf|timeout|delay|response\s+time/i },
  { tag: 'network',     re: /network|dns\b|routing|cdn\b|edge\b|connectivity|packet\s+loss/i },
  { tag: 'api',         re: /\bapi\b|endpoint|http\s*[45]\d\d|elevated error|error rate|request fail/i },
  { tag: 'availability',re: /unavailable|outage|down\b|unreachable|disruption|cannot\s+be\s+reached/i },
];

function tagIncident(title) {
  const tags = TAG_PATTERNS.filter(({ re }) => re.test(title)).map(({ tag }) => tag);
  return tags.length > 0 ? tags : ['other'];
}

function calcReliabilityScore(uptime30d, incidents30d) {
  if (uptime30d === null) return null;
  let incPenalty = 0;
  for (const inc of incidents30d) {
    if (inc.severity === 'critical') incPenalty += 8;
    else if (inc.severity === 'major') incPenalty += 4;
    else if (inc.severity === 'minor') incPenalty += 0.5;
  }
  incPenalty = Math.min(35, incPenalty);
  const majorResolved = incidents30d.filter(i =>
    (i.severity === 'critical' || i.severity === 'major') && i.durationMinutes !== null
  );
  const avgMttrMajor = majorResolved.length > 0
    ? majorResolved.reduce((s, i) => s + i.durationMinutes, 0) / majorResolved.length : 0;
  const mttrPenalty = Math.min(5, avgMttrMajor / 120);
  return Math.max(0, Math.min(100, Math.round(uptime30d * 0.6 + 40 - incPenalty - mttrPenalty)));
}

function buildMonthlyTrend(incidents) {
  const now = new Date();
  return [2, 1, 0].map(i => {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = i === 0 ? now : new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const totalMins = Math.round((end - start) / 60000);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    let weightedDownMins = 0, count = 0;
    for (const inc of incidents) {
      if (inc.severity === 'maintenance') continue;
      const t = new Date(inc.startedAt).getTime();
      if (t >= start.getTime() && t < end.getTime()) {
        count++;
        weightedDownMins += Math.round((inc.durationMinutes ?? 0) * (SEVERITY_WEIGHT[inc.severity] ?? 1.0));
      }
    }
    const uptime = parseFloat(((1 - Math.min(weightedDownMins, totalMins) / totalMins) * 100).toFixed(2));
    return { month: key, label, incidentCount: count, uptime };
  });
}

function buildTagSummary(incidents, cutoff30) {
  const map = {};
  for (const inc of incidents) {
    for (const tag of inc.tags) {
      if (!map[tag]) map[tag] = { count30d: 0, count90d: 0 };
      map[tag].count90d++;
      if (new Date(inc.startedAt).getTime() > cutoff30) map[tag].count30d++;
    }
  }
  return Object.entries(map)
    .map(([tag, c]) => ({ tag, count30d: c.count30d, count90d: c.count90d }))
    .sort((a, b) => b.count90d - a.count90d);
}

function buildStats(p, incidents, cutoff30) {
  const recent30 = incidents.filter(i =>
    i.severity !== 'maintenance' && new Date(i.startedAt).getTime() > cutoff30
  );
  const weightedDown30 = recent30.reduce((s, i) =>
    s + Math.round((i.durationMinutes ?? 0) * (SEVERITY_WEIGHT[i.severity] ?? 1.0)), 0);
  const uptime30d = parseFloat(((1 - Math.min(weightedDown30, 30 * 24 * 60) / (30 * 24 * 60)) * 100).toFixed(2));

  const nonMaint90 = incidents.filter(i => i.severity !== 'maintenance');
  const weightedDown90 = nonMaint90.reduce((s, i) =>
    s + Math.round((i.durationMinutes ?? 0) * (SEVERITY_WEIGHT[i.severity] ?? 1.0)), 0);
  const uptime90d = parseFloat(((1 - Math.min(weightedDown90, 90 * 24 * 60) / (90 * 24 * 60)) * 100).toFixed(2));

  const resolved30 = recent30.filter(i => i.durationMinutes !== null);
  const avgMttr = resolved30.length
    ? Math.round(resolved30.reduce((s, i) => s + i.durationMinutes, 0) / resolved30.length) : null;

  return {
    providerId: p.id,
    uptime30d,
    uptime90d,
    incidentCount30d: recent30.length,
    avgMttr30d: avgMttr,
    lastIncident: incidents[0]?.startedAt ?? null,
    reliabilityScore: calcReliabilityScore(uptime30d, recent30),
    monthlyTrend: buildMonthlyTrend(incidents),
    tagSummary: buildTagSummary(incidents, cutoff30),
  };
}

async function safeFetch(url) {
  try {
    return await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
  } catch (e) {
    return { ok: false, status: 0, _err: e.message };
  }
}

async function fetchProviderNews(providerName) {
  try {
    const query = encodeURIComponent(`${providerName} outage`);
    const since = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
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

function nullStats(p) {
  return {
    provider: p,
    status: { providerId: p.id, indicator: 'none', description: 'Status unavailable', updatedAt: new Date().toISOString() },
    stats: { providerId: p.id, uptime30d: null, uptime90d: null, incidentCount30d: 0, avgMttr30d: null, lastIncident: null, reliabilityScore: null, monthlyTrend: [], tagSummary: [] },
    recentIncidents: [],
  };
}

// Standard Statuspage.io provider
async function fetchStatuspageProvider(p) {
  try {
    const baseUrl = p.apiUrl.replace('/summary.json', '');
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
      rawIncidents = summary.incidents ?? [];
      console.warn(`  ⚠ ${p.name}: incidents endpoint ${incidentsRes.status}, fallback to summary`);
    }

    const now = Date.now();
    const cutoff90 = now - 90 * 24 * 60 * 60 * 1000;
    const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;

    const incidents = rawIncidents
      .filter(inc => new Date(inc.created_at).getTime() > cutoff90)
      .map(inc => {
        const start = new Date(inc.created_at).getTime();
        const end = inc.resolved_at ? new Date(inc.resolved_at).getTime() : null;
        const severity =
          inc.impact === 'critical' ? 'critical' :
          inc.impact === 'major'    ? 'major' :
          inc.impact === 'minor'    ? 'minor' :
          inc.impact === 'maintenance' ? 'maintenance' : 'minor';
        return {
          id: inc.id,
          providerId: p.id,
          title: inc.name,
          severity,
          tags: tagIncident(inc.name),
          startedAt: inc.created_at,
          resolvedAt: inc.resolved_at ?? null,
          durationMinutes: end ? Math.round((end - start) / 60000) : null,
          url: inc.shortlink ?? p.statusPageUrl,
        };
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    return {
      provider: p,
      status: { providerId: p.id, indicator, description, updatedAt: new Date().toISOString() },
      stats: buildStats(p, incidents, cutoff30),
      recentIncidents: incidents.slice(0, 15),
    };
  } catch (err) {
    console.error(`  ✗ [${p.name}] failed: ${err.message}`);
    return nullStats(p);
  }
}

// Azure: RSS feed — active incidents only, no historical data
async function fetchAzureProvider(p) {
  try {
    const res = await safeFetch(p.apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();

    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    const incidents = itemMatches.map((m, idx) => {
      const item = m[1];
      const title = (item.match(/<title><!\[CDATA\[([^\]]*)\]\]><\/title>/) || item.match(/<title>([^<]*)<\/title>/) || [])[1]?.trim() ?? 'Azure Incident';
      const link  = (item.match(/<link>([^<]*)<\/link>/) || [])[1]?.trim() ?? p.statusPageUrl;
      const pubDate = (item.match(/<pubDate>([^<]*)<\/pubDate>/) || [])[1]?.trim() ?? null;
      return {
        id: `azure-${idx}-${pubDate ?? Date.now()}`,
        providerId: p.id,
        title,
        severity: 'major',
        tags: tagIncident(title),
        startedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        resolvedAt: null,
        durationMinutes: null,
        url: link || p.statusPageUrl,
      };
    });

    const indicator = incidents.length > 0 ? 'major' : 'none';
    return {
      provider: p,
      status: { providerId: p.id, indicator, description: indicator === 'none' ? 'All Systems Operational' : 'Active Incident', updatedAt: new Date().toISOString() },
      stats: {
        providerId: p.id,
        uptime30d: null, uptime90d: null,
        incidentCount30d: incidents.length,
        avgMttr30d: null,
        lastIncident: incidents[0]?.startedAt ?? null,
        reliabilityScore: null,
        monthlyTrend: [], tagSummary: [],
      },
      recentIncidents: incidents,
    };
  } catch (err) {
    console.error(`  ✗ [${p.name}] Azure RSS failed: ${err.message}`);
    return nullStats(p);
  }
}

// Google Cloud status.cloud.google.com/incidents.json (custom format)
async function fetchGCPProvider(p) {
  try {
    const res = await safeFetch(p.apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const allIncidents = await res.json();

    const now = Date.now();
    const cutoff90 = now - 90 * 24 * 60 * 60 * 1000;
    const cutoff30 = now - 30 * 24 * 60 * 60 * 1000;

    const incidents = allIncidents
      .filter(inc => new Date(inc.begin || inc.created).getTime() > cutoff90)
      .map(inc => {
        const startDate = new Date(inc.begin || inc.created);
        const endDate = inc.end ? new Date(inc.end) : null;
        const title = inc.external_desc || 'Service Incident';
        const lower = title.toLowerCase();
        const severity = (lower.includes('outage') || lower.includes('unavailable') || lower.includes('disruption'))
          ? 'major' : 'minor';
        return {
          id: inc.id,
          providerId: p.id,
          title,
          severity,
          tags: tagIncident(title),
          startedAt: startDate.toISOString(),
          resolvedAt: endDate ? endDate.toISOString() : null,
          durationMinutes: endDate ? Math.round((endDate - startDate) / 60000) : null,
          url: `https://status.cloud.google.com/incidents/${inc.id}`,
        };
      })
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    const active = incidents.filter(i => !i.resolvedAt);
    const indicator = active.length === 0 ? 'none'
      : active.some(i => i.severity === 'major') ? 'major' : 'minor';

    return {
      provider: p,
      status: { providerId: p.id, indicator, description: indicator === 'none' ? 'All Systems Operational' : 'Service Disruption', updatedAt: new Date().toISOString() },
      stats: buildStats(p, incidents, cutoff30),
      recentIncidents: incidents.slice(0, 15),
    };
  } catch (err) {
    console.error(`  ✗ [${p.name}] GCP fetch failed: ${err.message}`);
    return nullStats(p);
  }
}

async function fetchProvider(p) {
  if (p.type === 'gcp') return fetchGCPProvider(p);
  if (p.type === 'azure-rss') return fetchAzureProvider(p);
  return fetchStatuspageProvider(p);
}

function buildCategoryTagTrends(results) {
  const catMap = {};
  for (const r of results) {
    const cat = r.provider.category;
    if (!catMap[cat]) catMap[cat] = {};
    for (const { tag, count30d, count90d } of (r.stats.tagSummary ?? [])) {
      if (!catMap[cat][tag]) catMap[cat][tag] = { count30d: 0, count90d: 0, providers: new Set() };
      catMap[cat][tag].count30d += count30d;
      catMap[cat][tag].count90d += count90d;
      if (count90d > 0) catMap[cat][tag].providers.add(r.provider.id);
    }
  }
  return Object.entries(catMap).map(([category, tags]) => ({
    category,
    tags: Object.entries(tags)
      .map(([tag, d]) => ({
        tag,
        count30d: d.count30d,
        count90d: d.count90d,
        trend: d.count30d / Math.max(d.count90d, 1) > 0.45 ? 'up'
             : d.count30d / Math.max(d.count90d, 1) < 0.20 ? 'down' : 'stable',
        providers: [...d.providers],
      }))
      .sort((a, b) => b.count90d - a.count90d)
      .slice(0, 8),
  }));
}

async function main() {
  console.log(`Collecting ${PROVIDERS.length} providers...`);
  const results = [];
  for (const p of PROVIDERS) {
    process.stdout.write(`  ${p.name}... `);
    const data = await fetchProvider(p);
    results.push(data);
    console.log(`score=${data.stats.reliabilityScore ?? '?'} uptime30d=${data.stats.uptime30d ?? '?'}% inc30d=${data.stats.incidentCount30d}`);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\nFetching news...');
  for (const entry of results) {
    process.stdout.write(`  ${entry.provider.name} news... `);
    entry.news = await fetchProviderNews(entry.provider.name);
    console.log(`${entry.news.length} items`);
    await new Promise(r => setTimeout(r, 300));
  }

  const categoryTagTrends = buildCategoryTagTrends(results);
  const output = { providers: results, categoryTagTrends, generatedAt: new Date().toISOString() };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
