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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'alerts@providerpulse.dev';
const subscriptionsEnabled = SUPABASE_URL && SUPABASE_SERVICE_KEY && RESEND_API_KEY;

// Loaded from public/data/providers.json so monitor stays in sync with collect.mjs.
// Statuspage.io providers only — Azure (RSS) and Google AI (custom format) are
// skipped here because the new-incident dedupe logic relies on Statuspage's
// /api/v2/summary.json shape.
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

// Fetch subscribers who follow at least one of the given provider IDs.
async function fetchSubscribersFor(providerIds) {
  if (!subscriptionsEnabled) return [];
  try {
    const url = `${SUPABASE_URL}/rest/v1/subscribers?providers=ov.{${providerIds.join(',')}}&select=email,providers,unsubscribe_token`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`Supabase subscribers fetch failed: HTTP ${res.status}`);
      return [];
    }
    return res.json();
  } catch (e) {
    console.error('Supabase fetch error:', e.message);
    return [];
  }
}

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM_EMAIL, to, subject, html }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`Resend send failed for ${to}: HTTP ${res.status}`, await res.text());
    }
  } catch (e) {
    console.error(`Resend error for ${to}:`, e.message);
  }
}

function buildIncidentEmail(provider, incident) {
  const sev = SEV_LABEL[incident.impact] ?? 'Issue';
  const link = incident.shortlink ?? provider.statusPageUrl;
  return {
    subject: `${provider.name}: ${sev} — ${incident.name}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 540px; padding: 20px; color: #1a1a1a;">
        <h2 style="margin: 0 0 12px 0;">${provider.icon} ${provider.name} — ${sev}</h2>
        <p style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px;">${incident.name}</p>
        <p style="margin: 0 0 16px 0; color: #555;">A new incident was just posted on ${provider.name}'s status page.</p>
        <a href="${link}" style="display: inline-block; padding: 10px 16px; background: #0a0a0f; color: #fff; text-decoration: none; border-radius: 8px;">View on status page</a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; margin: 0;">You're receiving this because you subscribed to alerts on ProviderPulse. <a href="https://subright85.github.io/providerpulse/">Manage subscription</a></p>
      </div>
    `,
  };
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
    const isFirstRun = state[p.id] === undefined;
    const prev = state[p.id] ?? { knownIds: [], indicator: 'none' };
    const prevIds = new Set(prev.knownIds ?? []);

    if (isFirstRun) {
      console.log(`[${p.name}] baselining (${activeIncidents.length} active recorded, no alerts on first run)`);
      state[p.id] = { knownIds: [...activeIds], indicator, lastCheckedAt: new Date().toISOString() };
      continue;
    }

    // New incidents not seen before → alert (Telegram for admin + email for subscribers)
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

      const subs = await fetchSubscribersFor([p.id]);
      if (subs.length > 0) {
        const { subject, html } = buildIncidentEmail(p, inc);
        console.log(`[${p.name}] notifying ${subs.length} subscriber(s) by email`);
        for (const sub of subs) {
          await sendEmail(sub.email, subject, html);
        }
      }
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
