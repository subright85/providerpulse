/**
 * Monitors LLM provider status pages.
 * Sends Telegram notification when new incidents appear or resolve.
 * Run by GitHub Actions every 5 minutes via monitor.yml.
 *
 * Loads providers from public/data/providers.json so it stays in sync with
 * collect.mjs (Statuspage.io providers only — GCP/Azure formats skipped here).
 *
 * Required env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const STATE_FILE = join(ROOT, 'public', 'data', 'monitor-state.json');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!TELEGRAM_CHAT_ID && TELEGRAM_TOKEN) {
  console.error('TELEGRAM_CHAT_ID env var required');
  process.exit(1);
}

function loadMonitored() {
  const dataPath = join(ROOT, 'public', 'data', 'providers.json');
  if (!existsSync(dataPath)) return [];
  try {
    const data = JSON.parse(readFileSync(dataPath, 'utf8'));
    return data.providers
      .map(d => d.provider)
      .filter(p => p.apiUrl?.endsWith('/summary.json'))
      .map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        apiUrl: p.apiUrl,
        statusPageUrl: p.statusPageUrl,
      }));
  } catch (e) {
    console.error('Failed to load monitored providers:', e.message);
    return [];
  }
}
const MONITORED = loadMonitored();

const SEV_EMOJI = { critical: '🔴', major: '🟠', minor: '🟡', maintenance: '🔧' };
const SEV_LABEL = { critical: 'Critical', major: 'Major', minor: 'Minor', maintenance: 'Maintenance' };

function loadState() {
  if (!existsSync(STATE_FILE)) return {};
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}

function saveState(state) {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN) {
    console.log('[DRY RUN] Telegram message:\n' + text);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) console.error('Telegram error:', await res.text());
}

async function fetchStatus(p) {
  const res = await fetch(p.apiUrl, {
    headers: { 'User-Agent': 'IsLLMDown-Monitor/1.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const state = loadState();

  for (const p of MONITORED) {
    let data;
    try {
      data = await fetchStatus(p);
    } catch (e) {
      console.error(`[${p.name}] fetch error: ${e.message}`);
      continue;
    }

    const indicator = data.status?.indicator ?? 'none';
    const activeIncidents = data.incidents ?? [];
    const activeIds = new Set(activeIncidents.map(i => i.id));
    const isFirstRun = state[p.id] === undefined;
    const prev = state[p.id] ?? { seenEver: [], activeIds: [], indicator: 'none' };
    // seenEver: every incident ID we've ever alerted on — never shrinks. Prevents
    // re-alerting when a resolved incident gets reopened (flap spam).
    // Backward-compat: migrate from old `knownIds` field on first read.
    const seenEver = new Set(prev.seenEver ?? prev.knownIds ?? []);
    const prevActiveIds = new Set(prev.activeIds ?? prev.knownIds ?? []);

    if (isFirstRun) {
      console.log(`[${p.name}] baselining (${activeIncidents.length} active recorded, no alerts on first run)`);
      state[p.id] = {
        seenEver: [...activeIds],
        activeIds: [...activeIds],
        indicator,
        lastCheckedAt: new Date().toISOString(),
      };
      continue;
    }

    // New incidents we've never alerted on → Telegram alert
    const newIncs = activeIncidents.filter(i => !seenEver.has(i.id));
    for (const inc of newIncs) {
      const sev = SEV_EMOJI[inc.impact] ?? '🟡';
      const label = SEV_LABEL[inc.impact] ?? inc.impact;
      const msg = [
        `${sev} <b>${p.icon} ${p.name} — Active Incident</b>`,
        `<b>${inc.name}</b>`,
        `Severity: ${label}`,
        `<a href="${inc.shortlink ?? p.statusPageUrl}">View on status page →</a>`,
      ].join('\n');
      console.log(`[${p.name}] NEW incident: ${inc.name}`);
      await sendTelegram(msg);
      seenEver.add(inc.id);
    }

    // Provider recovered: previously had active incidents, now all clear
    const hadActive = prev.indicator !== 'none' && prevActiveIds.size > 0;
    const nowClear = indicator === 'none' && activeIds.size === 0;
    if (hadActive && nowClear) {
      const msg = `✅ <b>${p.icon} ${p.name} is back to operational</b>\nAll systems normal.`;
      console.log(`[${p.name}] RESOLVED — back to operational`);
      await sendTelegram(msg);
    }

    state[p.id] = {
      seenEver: [...seenEver],
      activeIds: [...activeIds],
      indicator,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  saveState(state);
  console.log('Monitor run complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
