# LLMDown — Component-level uptime tracking for LLM APIs

I built LLMDown because I kept picking LLM providers without a
clear way to compare reliability. Status pages tell you what's down
*right now*. They don't tell you what's been down repeatedly over the
past 90 days, and they roll up to top-level categories that hide
useful detail.

LLMDown pulls each provider's status API every 30 minutes and
breaks the data down per component, with 30-day and 90-day reliability
scores.

## What it tracks

Eight LLM API providers:

- OpenAI
- Anthropic
- Google AI
- Groq
- Cohere
- DeepSeek
- Perplexity
- AI21

For each provider, the dashboard shows:

- **Component status grouped into three tiers** — end-user surfaces
  (e.g., ChatGPT app, claude.ai), API services (e.g., Chat Completions,
  Embeddings, Maestro), and developer infra (auth, console, CLI). This
  is the differentiator: most aggregators stop at the provider level,
  which loses the "ChatGPT down but the API is fine" distinction.
- **30-day and 90-day reliability scores** — severity-weighted.
- **A 3-month incident sparkline** for trend at a glance.
- **Live banner** at the top of the page when any provider has an
  active incident.

OpenAI alone publishes 25 separate components on their status API,
which the dashboard exposes individually.

## How the data is collected

A scheduled job pulls each provider's `summary.json` (or equivalent —
Google AI uses `incidents.json`) every 30 minutes. Incidents are
written to a static JSON file the dashboard reads on load. No backend,
no DB, no auth. The whole thing is a static site on Vercel.

The reliability score is severity-weighted: critical incidents take
8 points off the base, major take 4, minor take 0.5. There's a small
extra penalty for slow recovery on major-or-critical incidents. The
30-day window emphasizes recent reliability; the 90-day window
provides longer context, with penalties scaled so the wider window
doesn't always look worse.

## What it doesn't do

- It doesn't store user data. There's no signup.
- It doesn't try to detect outages providers haven't reported. The
  source is each provider's self-reported status. They underreport,
  and the dashboard reflects that — it's not an independent monitor.
- It doesn't cover Azure or AWS in a meaningful way. Azure publishes
  active incidents only via RSS, with no historical data. AWS uses a
  custom format that doesn't expose component status the same way.

## Roadmap

- Per-component email alerts (subscribe to specific surfaces, not
  whole providers)
- More providers when they expose a usable status API
- Public API for procurement teams who want to query the data directly

## The dashboard

[URL]

Free, no signup, no email collection. Source-available. If anything
is broken or weighted in a way that doesn't match your experience,
let me know — feedback drives the roadmap more than I do.
