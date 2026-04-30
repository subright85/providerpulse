# I tracked 90 days of LLM API outages. Here's what surprised me.

For a 2026 hobby project I'd been bouncing between OpenAI and Anthropic
for the same workload, and the conversation kept ending at the same
question: which one is actually more reliable?

The honest answer was "I have no idea." Status pages tell you what's
broken right now. They don't tell you "this thing has been down 4 times
in the last 90 days." So I started scraping every major LLM API's status
page, every 30 minutes, for the past three months, and looking at the
shape of the data instead of the headlines.

Here's what I found.

## OpenAI and Anthropic had the same number of incidents — and basically nothing else in common

Both had 15 incidents in 90 days. That's where the similarity ends.

OpenAI's incidents split almost 50/50 between **end-user surfaces**
(ChatGPT app, Voice mode, Sora, Codex Web) and **API services** (Chat
Completions, Embeddings, Audio, Realtime). Their failure modes are about
evenly distributed across the two audiences.

Anthropic's incidents are mostly Claude.ai — the consumer chat interface.
Of 15 incidents, only 2 were pure API issues. If you're running production
traffic against `api.anthropic.com`, your day-to-day reliability picture
is dramatically different from an Anthropic user who's been refreshing
claude.ai during an outage and assuming the whole service was down.

This is the kind of thing that doesn't show up in any status comparison
site I could find. They aggregate to the provider level. "OpenAI: 15
incidents. Anthropic: 15 incidents." Equal numbers, totally different
risk profiles, and you'd never know.

## "api" and "inference" account for ~90% of all LLM incidents

I tagged every incident with categories — auth, billing, database,
rate-limit, performance, availability, api, inference. Across 8 providers
and 90 days, two tags swallow nearly everything.

- `api`: ~27 incidents
- `inference`: ~26 incidents
- everything else combined: ~17 incidents

Auth, billing, and database categories together account for 3 incidents
out of 59. The implication: if you're worried about LLM downtime, you're
really worried about inference downtime. You probably don't need to worry
about anything else.

This is good news for production users. The failure modes are predictable
and concentrated. The bad news is that "inference" is exactly the thing
you can't trivially fail over.

## OpenAI alone publishes 25 separate components

This was the part that changed how I thought about the whole space.

The OpenAI status page rolls up to four top-level categories — ChatGPT,
API, Sora, etc. — but underneath, it publishes **25 separately tracked
components**, each with its own status: Chat Completions, Responses,
Embeddings, Audio, Images, Moderations, Fine-tuning, Batch, Realtime,
File uploads, Codex API, Codex Web, VS Code extension, CLI, Login,
FedRAMP, Voice mode, Sora, Conversations, Connectors/Apps, ChatGPT Atlas,
Agent, App, Compliance API, File uploads.

Most status comparison aggregators stop at the four top-level groups.
That means "ChatGPT is down but the API is fine" — a wildly common state
on OpenAI — disappears entirely from the abstraction. Two completely
different audiences, one rolled-up status, and it tells you nothing about
your actual exposure.

Anthropic only publishes 6, Cohere 24, Groq 20. But the principle holds:
the granularity is *there*, you just have to look.

## The most stable providers had under-reporting tells

Google AI, Perplexity, and AI21 each had 0–1 incidents in the entire
90-day window.

I want to be careful here, because the dataset is each provider's
self-reported status, and these aren't always honest reports. But there's
a pattern I noticed: providers with fewer published components also have
fewer published incidents. Perplexity's status page exposes 0 components.
Google AI exposes 0. AI21 exposes 6.

When the surface area you're tracking is small, your "incident count"
naturally shrinks. It doesn't mean these providers are 30x more reliable
than DeepSeek (which had 13 incidents over the same period from 2
exposed components). It probably means a mix of "genuinely smaller
operation," "less aggressive incident posting policy," and "less fine-
grained status tracking internally."

If you take 0-incident providers as a guarantee, you're going to be
surprised. The right read is: they had no incidents *that they chose to
publish*.

## A note on reliability scores

I compute two scores per provider, 30-day and 90-day. Severity-weighted:
a critical incident takes 8 points, major 4, minor 0.5. Then a small
penalty for slow recovery on major-and-up incidents.

This is empirical, not principled. The 8/4/0.5 weights came from
eyeballing the data and asking "would I personally rate a provider
differently if I knew they had a 4-hour critical outage versus 50
sub-30-minute minor ones?" — yes, by a lot, and not linearly.

I'd be very interested in feedback on the methodology. The current
weights drop "incident *count*" providers like Twilio (50+ small
component-level events) below "incident *severity*" providers, which
seems right. But it also makes Anthropic look slightly worse than its
actual operational impact, because most of their incidents land in the
minor category and get summed up.

## The dashboard

The thing I built is at [URL]. Free, no signup. It's the same data I
collected here, but updated every 30 minutes and broken out per
component for the providers that publish them.

If you're running LLM workloads in production, the most useful view
might be the per-provider component grid: instead of "OpenAI: degraded,"
you can see exactly which surface is degraded and decide whether your
specific code path cares.

If anything is broken, missing, or weighted weirdly, please tell me.
The roadmap is mostly driven by what people actually need rather than
what I think is interesting.

---

*Built solo over the past two weeks. Source on the dashboard's footer.*
