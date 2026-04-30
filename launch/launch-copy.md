# Launch Copy — ProviderPulse

All copy in dev/founder voice. Plain, factual, slightly understated.
Tone reference: HN top comments and "Show HN" posts that stuck — they
describe what the thing does and what it doesn't, and stop there.

What to avoid:
- "Excited to announce" / "thrilled to share"
- "Game-changer" / "revolutionary" / "cutting-edge"
- "I tracked X, here's what surprised me!" framing
- Em-dash heavy bullet lists
- More than 1–2 emojis per post

What works:
- Specific numbers ("8 providers, 25 components, 30-day window")
- Stating what the tool *doesn't* do alongside what it does
- "Open to feedback" / "happy to take questions"

---

## Show HN

### Title

```
Show HN: ProviderPulse – Component-level uptime tracking for LLM APIs
```

Backup, slightly more story:
```
Show HN: A reliability dashboard for OpenAI, Anthropic, and 6 other LLM APIs
```

### Body (HN submission text)

Leave empty. HN convention is title-only for Show HN. Substance goes
in the first comment.

### First comment (post within 30 seconds of submission)

```
Author here.

ProviderPulse pulls each provider's status API every 30 minutes,
breaks each one out per component, and shows 30-day and 90-day
reliability scores. Eight LLM API providers right now: OpenAI,
Anthropic, Google AI, Groq, Cohere, DeepSeek, Perplexity, AI21.

The thing I most wanted from this was component-level granularity.
OpenAI's status API publishes 25 separate components (Chat Completions,
Embeddings, Audio, Sora, Codex, Realtime, …), but most aggregators
roll those up to 4 top-level groups, which is where the "ChatGPT is
down but the API is fine" distinction disappears. The dashboard groups
components into three audiences — end-user, API services, and
developer infra — so you can tell at a glance which side of a provider
is broken.

Limitations I want to be upfront about:
- The source is each provider's self-reported status. They underreport.
- 90-day window is intentional; incident data gets noisy past that.
- Private or regional outages we can't observe externally aren't here.
- Azure and AWS aren't in here — they don't expose component status the
  same way.

Free, no signup, no email collection. Static site, source-available.
Top of the roadmap is per-component email alerts and a few more
providers. Open to feedback on what's missing and on the scoring
methodology.

[ProviderPulse URL]
```

Word count target: 200–250. Currently ~220.

---

## Reddit

### r/LocalLLaMA

**Title**:
```
Component-level uptime tracking for OpenAI, Anthropic, and 6 other LLM APIs (free dashboard)
```

**Body**:
```
Built a dashboard that pulls each provider's status API every 30 min
and breaks the data out per component, with 30-day and 90-day
reliability scores. Eight providers: OpenAI, Anthropic, Google AI,
Groq, Cohere, DeepSeek, Perplexity, AI21.

The differentiator vs StatusGator/IncidentHub is that components don't
get rolled up. OpenAI alone publishes 25 (Chat Completions, Embeddings,
Audio, Realtime, etc.); the dashboard groups them by audience —
end-user surfaces, API services, developer infra — so you can tell
when ChatGPT is the problem versus when the API itself is.

Source is each provider's self-reported status, so it inherits their
underreporting. 90-day window is intentional. Free, no signup.

[URL]

Open to feedback on missing providers and the scoring weights.
```

### r/MachineLearning

Use `[P]` tag.

**Title**:
```
[P] ProviderPulse: Component-level reliability tracking for 8 LLM APIs (90 days of incident data)
```

**Body**:
```
Methodology
- Pulls each provider's StatusPage.io API every 30 min (Google AI uses
  a different incidents.json format)
- Component-level granularity: 8 providers, ~90 components total
- Reliability score = severity-weighted; 30-day and 90-day windows,
  with 90-day penalties scaled to compensate for the larger window

Limits
- Self-reported source data
- 90-day window only
- Azure / AWS not covered (different status formats)

Free dashboard: [URL]

Open to feedback on the severity weighting (currently 8 / 4 / 0.5
for critical / major / minor — empirically tuned, not principled).
GitHub Discussions enabled for methodology questions.
```

### r/SideProject (post a few days after HN)

**Title**:
```
ProviderPulse — built a reliability dashboard for LLM APIs over 2 weeks
```

**Body**:
```
Picked OpenAI vs Anthropic for a production app and there wasn't an
easy way to compare reliability over time, so I built one.

ProviderPulse pulls each provider's status API every 30 min and breaks
the data out per component. Eight LLM providers covered. Free, no
signup, static site.

Tech: Vite + React + Vercel
Time: ~2 weeks part-time
URL: [link]

Roadmap and feedback welcome.
```

---

## Twitter / X thread (HN +1 day)

5 tweets. Tweet 1 needs an OG image or hero GIF.

```
1/ Built ProviderPulse — a free dashboard for tracking LLM API
   reliability. 8 providers, component-level, 30-day and 90-day
   scores.

   [Image: hero shot]

2/ Most status aggregators stop at the provider level (OpenAI: down)
   but providers themselves publish much finer-grained data. OpenAI
   alone has 25 components. The dashboard exposes all of them.

3/ Components are grouped by audience: end-user surfaces (ChatGPT,
   claude.ai), API services (Chat Completions, Embeddings, Maestro),
   and developer infra (auth, console, CLI). Lets you see which side
   of a provider is broken.

   [Image: OpenAI card 3-tier zoom]

4/ Source is each provider's self-reported status. They underreport.
   90-day window only. Azure/AWS not covered — they don't expose
   component status the same way.

5/ Free, no signup. Top of the roadmap is per-component email alerts.
   Open to feedback on missing providers.

   [URL]
```

Hashtags (last tweet only): `#LLM #DevTools`.

---

## ProductHunt (HN +7-14 days, Tuesday 12:01am PST)

### Tagline (60 char)
```
Component-level reliability for 8 LLM APIs. 90 days of history.
```

### Description (260 char)
```
Tracks 8 LLM APIs at component level. OpenAI publishes 25 components
(Chat Completions, Sora, Embeddings, Audio, …); the dashboard exposes
all of them. 90-day reliability from each provider's official status
page. Free, no signup.
```

### First comment (founder)

```
Author here.

ProviderPulse is the dashboard I wanted when picking between LLM
providers for production. Status pages tell you what's down right now;
this tells you what's been down repeatedly over the past 90 days, and
which specific components were affected.

8 providers covered. Free, no signup. Open to feedback on missing
providers and on the weighting.
```

---

## Newsletter pitch (1-2 sentences)

For TLDR, Console, BetterDev, Pragmatic Engineer:

```
ProviderPulse — a free dashboard tracking 90 days of incident history
for 8 LLM API providers (OpenAI, Anthropic, Google AI, Groq, Cohere,
DeepSeek, Perplexity, AI21), with component-level granularity so you
can see "ChatGPT down but API fine" instead of just "OpenAI down."

URL: [link]
```

---

## OG image (auto-generated)

`public/og.png` — 1200×630 PNG. Generated by `launch/capture.mjs` from
the live site. Re-run the script to refresh it.

---

## Screenshots / GIFs

`launch/capture.mjs` produces these PNGs in `launch/screenshots/`:

- `1-hero-desktop.png` — hero shot (8 cards + Live Issues banner)
- `2-fullpage-desktop.png` — full scroll
- `3-openai-card.png` — single card zoom
- `4-openai-detail-modal.png` — detail modal
- `5-mobile-hero.png` — mobile single column
- `6-mobile-fullpage.png` — mobile scroll

For animated GIFs (Twitter thread tweet 1, HN comment hero), record
manually — auto-capture won't catch hover/interaction gracefully:

1. Dashboard scroll (5 sec) — top → all 8 cards → footer
2. Component tooltip (3 sec) — hover dot → tooltip with status
3. Detail modal open (3 sec) — click card → modal opens

Tools: ScreenStudio (macOS, paid), Loom (free), Cleanshot X (stills).
Each GIF: 2–5 MB max.

---

## Launch day checklist (Tuesday)

```
4:55am PST — open HN submit page
5:00am PST — submit (title only)
5:00:30 PST — post first comment with [URL] filled in
5:00–6:00 — refresh, respond to first comments within 5 min
6:00–9:00 — keep responding, every 30 min minimum
9:00 — submit to TLDR / Console / BetterDev if HN is on first page
9:00 — schedule the Twitter thread for the next day
```

Day +1: Twitter thread, then r/LocalLLaMA.
Day +2-3: r/MachineLearning, r/SideProject.
Day +5-7: blog post on dev.to / Medium (cross-post launch/blog-post.md).
Day +7-14: ProductHunt.
