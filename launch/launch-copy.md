# Launch Copy — ProviderPulse

All copy in dev/founder voice. No hype words, no emoji floods, no marketing speak.
Tone reference: Hacker News top comments (dry, evidence-based, slightly understated).

---

## Show HN

### Title
```
Show HN: I tracked 90 days of LLM API outages — here's the dashboard
```

Backup (less story, more data):
```
Show HN: Component-level uptime tracking for OpenAI, Anthropic, and 6 more LLM APIs
```

### Body (HN submission text)

Leave empty. HN convention is title-only for Show HN. The first comment carries the substance.

### First comment (post within 30 seconds of submission)

```
Hi HN — author here.

I started this because I was picking between OpenAI and Anthropic for a
production app and there was no easy way to compare reliability over time.
Status pages tell you "is it down right now?" not "how reliable has this
been over the past 90 days?" — which is what actually matters when you're
betting your product on someone's API.

ProviderPulse pulls each provider's status page API every 30 minutes,
breaks it down to component level (Chat Completions, Embeddings, Audio,
etc.), and computes a 30-day and 90-day reliability score.

Currently 8 providers: OpenAI, Anthropic, Google AI, Groq, Cohere,
DeepSeek, Perplexity, AI21.

Some things from the last 90 days that surprised me:

- OpenAI and Anthropic both had 15 incidents. Same count, different shape:
  OpenAI's roughly 50/50 between ChatGPT (consumer) and API (developer);
  Anthropic's were mostly Claude.ai web app, with only a couple of pure
  API incidents.
- "api" and "inference" tags account for 90% of incidents across all
  providers. Other categories (auth, billing, database) are basically
  noise.
- Google AI, Perplexity, and AI21 had 0–1 incidents in 90 days. Either
  they're more stable or they post less aggressively. Probably some of
  both.

Limitations I want to be upfront about:
- Source is each provider's self-reported status. They may underreport.
- 90-day window is intentional — incident data gets noisy beyond that.
- Private/regional outages we can't see externally aren't here.

Free, no signup, no email collection. Built solo over the past two weeks.

Roadmap is open — alerts and more providers are top of the list. Happy
to take feedback on the methodology, what's broken, providers I should
add.

[ProviderPulse URL]
```

Word count target: 250–280. Currently ~270.

---

## Reddit

### r/LocalLLaMA

**Title**:
```
Tracking LLM API reliability across 8 providers — 90 days of component-level uptime [free dashboard]
```

**Body**:
```
Built a tool to track LLM API reliability over 90 days, because status
pages only tell you "down right now," not "how reliable has this been."

Currently tracks 8 LLM APIs at component level — OpenAI alone has 25
components (Chat Completions, Embeddings, Audio, Batch, Fine-tuning,
each with its own status).

Some patterns from the data:
- OpenAI and Anthropic both had ~15 incidents in 90 days, but with very
  different shapes — OpenAI splits ~50/50 between ChatGPT and API,
  Anthropic is mostly Claude.ai web app.
- "api" and "inference" tags account for 90% of incidents across all
  providers. Auth/billing/database categories are basically noise.
- DeepSeek had 13 incidents in the last 90 days; Cohere had 4. Same
  vertical, 3x reliability gap.

Free, no signup. Open to feedback on what's missing — alerts and more
providers are top of roadmap.

[URL]
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
- Pulls every 30 min from each provider's StatusPage.io API (or
  equivalent — Google AI uses a different format)
- Component-level granularity: 8 providers, ~80 components total
- Reliability score = severity-weighted, with separate 30-day and 90-day
  windows
- 90-day penalties scaled to compensate for the larger window so the
  longer view doesn't always look worse

Free dashboard: [URL]
Source: GitHub Discussions enabled — happy to take questions on
weighting and methodology there.

Particularly interested in feedback on the severity weighting (currently
critical: 8pt, major: 4pt, minor: 0.5pt — empirically tuned, not
principled).
```

### r/SideProject (post a few days after HN)

**Title**:
```
I built a real-time uptime tracker for LLM APIs — solo, 2 weeks
```

**Body**:
```
The "why": I was choosing between OpenAI and Anthropic for a production
app and there was no easy way to compare reliability over time. Status
pages give you "right now," nothing historical.

What I learned:
- StatusPage.io is more standardized than I expected (most providers use
  the same format)
- A few don't — Google AI uses a custom incidents.json, Azure has only
  RSS, AWS has its own thing
- Providers underreport routinely — components stay "operational" while
  users report errors
- Component-level data is rare in this space (StatusGator/IncidentHub
  stop at provider level)

Tech: Vite + React + Vercel (free)
Time: ~2 weeks part-time
Free dashboard: [URL]

Roadmap and feedback welcome.
```

---

## Twitter / X thread (HN +1 day)

7 tweets. First one needs a GIF (dashboard scroll, ~5 sec).

```
1/ I tracked 90 days of LLM API outages across 8 providers.
   Some things surprised me. 🧵

   [GIF: dashboard scroll]

2/ OpenAI had 15 incidents. So did Anthropic.
   Same count, very different shape:
   - OpenAI: ~50/50 between ChatGPT (consumer) and API (developer)
   - Anthropic: mostly Claude.ai web app, only 2 pure API incidents

3/ "api" and "inference" tags account for 90% of incidents across
   all providers. Auth, billing, database categories are basically
   noise.

   If you're worried about LLM downtime, you're really worried
   about inference downtime.

4/ DeepSeek: 13 incidents in 90 days.
   Cohere: 4 in 90 days.
   Same vertical (LLM API), 3x reliability gap.

5/ Most stable in the dataset: Google AI, Perplexity, AI21 — 0–1
   incidents each in 90 days. Either they're genuinely more reliable
   or they post less aggressively. Probably some of both.

6/ Built ProviderPulse to make all this comparable.
   Free, real-time, component-level.
   8 LLM APIs covered. 90-day history. No signup.

   [URL]

7/ Built solo over 2 weeks. If this is useful to you, share helps.
   Open to feedback on what's missing.
```

Hashtags (last tweet only): `#LLM #DevTools` (avoid `#AI #BuildInPublic` —
overused, dilutes).

---

## ProductHunt (HN +7-14 days, Tuesday 12:01am PST)

### Tagline (60 char)
```
Component-level reliability for 8 LLM APIs. Free, 90 days of history.
```

### Description (260 char)
```
ProviderPulse tracks 8 LLM APIs at component level — OpenAI Chat
Completions vs Embeddings vs Audio, separately. 90-day reliability
scores from each provider's official status page. Free, no signup.
```

### First comment (founder)

```
Hi PH — author here.

Started this because picking an LLM provider for production was
impossible to do based on reliability — status pages only show "right
now," and the comparison sites stop at provider level (which doesn't
help when ChatGPT is down but the API is fine).

ProviderPulse pulls each provider's status API every 30 min, breaks it
down per component, and shows 90 days of history.

Free forever for the dashboard. Open to feedback on what's missing.
Suggestions for providers to add are very welcome.
```

---

## Newsletter pitch (1-2 sentences for tip submissions)

For TLDR, Console, BetterDev, Pragmatic Engineer:

```
ProviderPulse — a free dashboard that tracks 90 days of incident
history for 8 LLM API providers (OpenAI, Anthropic, Google AI, Groq,
Cohere, DeepSeek, Perplexity, AI21). Component-level granularity, so
you can see "ChatGPT down but API fine" instead of just "OpenAI down."

URL: [link]
```

---

## Screenshots / GIFs (you'll need to record these)

Tools: ScreenStudio (macOS, paid) or Loom (free). Cleanshot X for stills.

### Hero shot (HN first comment, Twitter tweet 1, PH gallery)
- Dashboard at top, scroll to show all 8 cards
- One card with active incident (or stage a yellow component dot if all
  green when you record)
- Show the 30D + 90D rings clearly

### GIF 1 — Dashboard scroll (5 sec)
- Top of page → all cards visible → bottom
- Demonstrates 8 providers + bento layout

### GIF 2 — Component dot tooltip (3 sec)
- Click an OpenAI card to open detail
- Hover one of the 25 component dots → tooltip with status

### GIF 3 — 30D vs 90D scores (3 sec)
- Just the dual rings updating across cards
- Shows the historical-vs-recent dimension

### GIF 4 — Active incident banner (5 sec)
- Top banner with "Live Issues" pill
- Click → opens detail modal with active incident

Each GIF: 2–5 MB max. Resize in HandBrake or ezgif.com if too big.

---

## Launch day checklist (5/5 Tuesday)

```
4:55am PST — open HN submit page, paste title (no body)
5:00am PST — submit
5:00:30 PST — post first comment with [URL] filled in
5:00–6:00 — refresh, respond to first comments within 5 min
6:00–9:00 — keep responding, every 30 min minimum
9:00 — submit to TLDR / Console / BetterDev (HN already on first page)
        if it's at top
9:00 — start writing/scheduling the Twitter thread for tomorrow
```

Day +1: Twitter thread, then r/LocalLLaMA.
Day +2-3: r/MachineLearning, r/SideProject.
Day +7-14: ProductHunt.
```

---

## Things to NOT say

Avoid these phrases — they read as AI-generated marketing, not founder:

- "Excited to announce"
- "Thrilled to share"
- "Game-changer"
- "Revolutionary"
- "Cutting-edge"
- "I'm proud to introduce"
- "Beyond just X, this is Y"
- Em-dash heavy bullet lists
- More than 1–2 emojis per post

What works on HN/Reddit/Twitter (dev voice):
- Specific numbers ("90 days," "8 providers," "15 incidents")
- Concrete observations ("Anthropic's mostly Claude.ai, OpenAI's split")
- Honest limitations stated up front
- Self-deprecation in moderation ("noisy beyond that," "probably some of both")
- "Open to feedback" / "happy to take questions" — not "looking forward to your insights"
