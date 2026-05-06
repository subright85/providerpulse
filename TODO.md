# TODO — Pending fixes

Found in code review 2026-05-06.

## 🔴 CRITICAL (data integrity / user-visible)

- [x] **collect.mjs `nullStats` overwrite** — fixed 2026-05-06. Prior `providers.json` is read at start; any provider that returns `nullStats` this run falls back to the prior good entry instead of overwriting with "Status unavailable".

- [x] **monitor.mjs flap re-alerts** — fixed 2026-05-06. `state[p.id]` now tracks `seenEver` (never shrinks) separately from `activeIds`; alerts fire only on IDs not in `seenEver`. Backward-compat with old `knownIds` field on first read.

- [x] **App.tsx sticky error flag** — fixed 2026-05-06. `.then` calls `setError(false)`, `.catch` calls `setError(true)` (no `prev || true` guard).

## 🟠 IMPORTANT

- [ ] **Google AI silently excluded from monitoring** — `monitor.mjs:34-36`
  Filter `endsWith('/summary.json')` skips GCP format. Google AI outage → no Telegram alert.

- [ ] **monitor.mjs Telegram fetch missing timeout** — `monitor.mjs:67-72`
  Bare `fetch` without `AbortSignal.timeout`. Telegram API hang blocks entire run, state lost.

- [ ] **collect.mjs sequential fetching** — `scripts/collect.mjs:427-433`
  8 providers fetched serially. Switch to `Promise.allSettled()` for ~10x speedup.

- [ ] **README ↔ cron drift** — `README.md` says "30 min collect, 5 min monitor", actual cron is `*/10` and `*/5`. Update README to match reality.

- [ ] **No "browser-fetched at" indicator** — `src/App.tsx:51-53`
  `data.generatedAt` shows collect time. Users can't see if their browser is fetching fresh data vs cached.

## 🌩️ Infra

- [x] Cloudflare Worker cron — replace GH Actions schedule (in progress 2026-05-06)
