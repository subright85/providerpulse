/**
 * Monitors OpenAI and Anthropic status pages.
 * Sends Telegram notification when new incidents appear or resolve.
 * Run by GitHub Actions every 5 minutes via monitor.yml.
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

const MONITORED = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    apiUrl: 'https://status.openai.com/api/v2/summary.json',
    statusPageUrl: 'https://status.openai.com',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🧠',
    apiUrl: 'https://status.anthropic.com/api/v2/summary.json',
    statusPageUrl: 'https://status.anthropic.com',
  },
];

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
    headers: { 'User-Agent': 'ProviderPulse-Monitor/1.0' },
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
    const prev = state[p.id] ?? { knownIds: [], indicator: 'none' };
    const prevIds = new Set(prev.knownIds ?? []);

    // New incidents not seen before → alert
    const newIncs = activeIncidents.filter(i => !prevIds.has(i.id));
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
    }

    // Provider recovered: previously had active incidents, now all clear
    const hadActive = prev.indicator !== 'none' && prevIds.size > 0;
    const nowClear = indicator === 'none' && activeIds.size === 0;
    if (hadActive && nowClear) {
      const msg = `✅ <b>${p.icon} ${p.name} is back to operational</b>\nAll systems normal.`;
      console.log(`[${p.name}] RESOLVED — back to operational`);
      await sendTelegram(msg);
    }

    state[p.id] = {
      knownIds: [...activeIds],
      indicator,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  saveState(state);
  console.log('Monitor run complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
