# IsLLMDown

**The LLM API health dashboard.**
Real-time, component-level uptime tracking for 8 LLM providers — with 90 days of incident history.

🌐 **Live demo**: [isllmdown.vercel.app](https://isllmdown.vercel.app/)

---

## Why this exists

Status pages tell you _"is it down right now?"_
IsLLMDown tells you _"how reliable has this been over the past 90 days?"_ — which is what you actually need when picking an LLM API for production.

Most existing trackers (StatusGator, IncidentHub) operate at the provider level. IsLLMDown goes deeper: **component-level health** for every provider — because OpenAI alone has 25 components (Chat Completions, Embeddings, Audio, Batch, Files, Moderations, Vision...), each with its own status.

---

## Features

- **🔍 Component-level health** — Per-provider component dots with live status (operational / degraded / partial outage / major outage)
- **📊 Dual reliability scores** — 30-day (recent) + 90-day (trend) so you see both immediate and historical signals
- **🤖 8 LLM providers** — OpenAI, Anthropic, Google AI, Groq, Cohere, DeepSeek, Perplexity, AI21
- **📈 3-month sparkline** — Visual trend per provider
- **🚨 Active incidents banner** — Real-time alerts on the homepage
- **🏷 B2B / B2C audience tagging** — Each incident auto-classified by impact (API/SDK vs end-user app)
- **📱 Responsive grid** — 1/2/3 column layout, optimized mobile + desktop
- **🆓 Free, no signup** — Forever

---

## How it works

```
┌─────────────────────────┐
│  StatusPage.io APIs     │   Each provider's official endpoint
│  (8 providers)          │   (e.g. status.openai.com/api/v2/summary.json)
└────────────┬────────────┘
             │
             │  Cloudflare Worker cron → GitHub Actions
             │  workflow_dispatch (15-min collect / 5-min monitor)
             ▼
┌─────────────────────────┐
│  scripts/collect.mjs    │   Aggregates all summaries (15 min)
│  scripts/monitor.mjs    │   Detects new incidents (5 min)
└────────────┬────────────┘
             │
             │  Static JSON snapshot
             ▼
┌─────────────────────────┐
│  public/data/*.json     │   Committed to repo
└────────────┬────────────┘
             │
             │  Vite static build
             ▼
┌─────────────────────────┐
│  React dashboard        │   Vercel-hosted
└─────────────────────────┘
```

No backend. No paid infra. The dashboard is a static site that reads JSON snapshots refreshed every 15 minutes by a Cloudflare Worker that triggers GitHub Actions via `workflow_dispatch` (free-tier GH `schedule:` cron is throttled too heavily on its own).

---

## Tech stack

- **Frontend**: React 19 · TypeScript · Vite · Tailwind CSS 4
- **Data collection**: Node.js scripts (`collect.mjs`, `monitor.mjs`)
- **Scheduling**: Cloudflare Worker cron (15-min collect, 5-min monitor) → GitHub Actions `workflow_dispatch`
- **Hosting**: Vercel (static)
- **Data sources**: Each provider's StatusPage.io public API

---

## Tracked providers

| Provider | Status page | Components |
|---|---|---|
| OpenAI | [status.openai.com](https://status.openai.com) | 25 |
| Anthropic | [status.anthropic.com](https://status.anthropic.com) | 6+ |
| Google AI | [status.cloud.google.com](https://status.cloud.google.com) | varies |
| Groq | [groqstatus.com](https://groqstatus.com) | varies |
| Cohere | [status.cohere.com](https://status.cohere.com) | varies |
| DeepSeek | [status.deepseek.com](https://status.deepseek.com) | varies |
| Perplexity | [status.perplexity.com](https://status.perplexity.com) | varies |
| AI21 | [status.ai21.com](https://status.ai21.com) | varies |

Component count grows as providers expand their status reporting.

---

## Running locally

```bash
git clone https://github.com/subright85/IsLLMDown.git
cd IsLLMDown
npm install
npm run dev
```

Open `http://localhost:5173`.

To refresh data manually:

```bash
node scripts/collect.mjs   # Pull latest summaries from all providers
node scripts/monitor.mjs   # Detect new incidents since last run
```

---

## Roadmap

- [ ] Component-level email alerts (most-requested)
- [ ] More providers — suggestions welcome (Together AI, Replicate, Mistral, Modal, Anyscale candidates)
- [ ] Public API for procurement teams ($99–$299/mo, currently waitlist)
- [ ] Custom watchlist ("My stack" — pick exact components to monitor)
- [ ] CSV export of incident history

Issues + feature requests: [github.com/subright85/IsLLMDown/issues](https://github.com/subright85/IsLLMDown/issues)

---

## Data caveats

- **Source**: Each provider's self-reported status. They may underreport.
- **Window**: 90-day rolling. Older incidents drop off (data quality degrades).
- **Visibility**: Private outages, regional outages, and silent degradations are not observable externally.
- **Methodology**: Reliability score weights incidents by severity (Critical –8pt, Major –4pt, Minor –0.5pt) × duration. Open to feedback on weighting.

---

## Support

If IsLLMDown is useful:

- ⭐ **Star this repo** — helps other devs find it
- ☕ [Buy me a coffee](#) — keeps the project free
- 🐛 [Report issues](https://github.com/subright85/IsLLMDown/issues)
- 💡 Suggest providers or features

---

## License

MIT — see [LICENSE](LICENSE).

---

Built solo by [@subright85](https://github.com/subright85).
Built because choosing between OpenAI and Anthropic for production shouldn't require a spreadsheet.
