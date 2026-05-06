# TODO — Pending fixes

Found in code review 2026-05-06.

## 🔴 CRITICAL (data integrity / user-visible)

- [ ] **collect.mjs `nullStats` overwrite** — `scripts/collect.mjs:282-285, 444-446`
  Network hiccup makes good data get replaced with "Status unavailable" and committed. Fix: read existing `providers.json`, merge — keep prior entry for any provider that returned `nullStats` this run.

- [ ] **monitor.mjs flap re-alerts** — `scripts/monitor.mjs:98, 133-137`
  `knownIds` only holds currently-active incidents, so resolve-then-reopen fires a duplicate Telegram alert. Fix: separate `seenEver: Set<string>` that only grows.

- [ ] **App.tsx sticky error flag** — `src/App.tsx:22`
  `setError(prev => prev || true)` never resets. One transient 404 leaves the error UI stuck for the session. Fix: `setError(false)` in `.then`, `setError(true)` in `.catch` (no guard).

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
