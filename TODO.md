# TODO — Pending fixes

Found in code review 2026-05-06.

## 🔴 CRITICAL (data integrity / user-visible)

- [x] **collect.mjs `nullStats` overwrite** — fixed 2026-05-06. Prior `providers.json` is read at start; any provider that returns `nullStats` this run falls back to the prior good entry instead of overwriting with "Status unavailable".

- [x] **monitor.mjs flap re-alerts** — fixed 2026-05-06. `state[p.id]` now tracks `seenEver` (never shrinks) separately from `activeIds`; alerts fire only on IDs not in `seenEver`. Backward-compat with old `knownIds` field on first read.

- [x] **App.tsx sticky error flag** — fixed 2026-05-06. `.then` calls `setError(false)`, `.catch` calls `setError(true)` (no `prev || true` guard).

## 🟠 IMPORTANT

- [x] **Google AI silently excluded from monitoring** — fixed 2026-05-06. Added `fetchStatusGCP` branch + included `type === 'gcp'` in `loadMonitored` filter; GCP incidents normalized to Statuspage shape so downstream alert logic stays uniform.

- [x] **monitor.mjs Telegram fetch missing timeout** — fixed 2026-05-06. `sendTelegram` wraps fetch in try/catch with `AbortSignal.timeout(8000)`.

- [x] **collect.mjs sequential fetching** — fixed 2026-05-06. `PROVIDERS.map(p => fetchProvider(p))` then `Promise.all` for both data and news. Removed 400/300ms inter-provider sleeps.

- [x] **README ↔ cron drift** — fixed 2026-05-06. Diagram + tech stack now correctly say "Cloudflare Worker (15-min collect, 5-min monitor) → workflow_dispatch".

- [x] **Stale data indicator** — fixed 2026-05-06. Header now shows "Updated X ago" relative format; if `generatedAt` > 30 min ago a "⚠ Data may be stale" badge appears.

## 🌩️ Infra

- [x] Cloudflare Worker cron — replace GH Actions schedule (in progress 2026-05-06)
