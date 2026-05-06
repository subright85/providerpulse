# isllmdown-cron — Cloudflare Worker

Scheduled trigger for the `collect.yml` and `monitor.yml` GitHub Actions workflows. Replaces the unreliable native `schedule:` cron in those workflows (GH Actions throttles scheduled runs heavily on free tier).

## Schedule

| Workflow | Cron | Purpose |
|---|---|---|
| `collect.yml` | `*/15 * * * *` | Refresh `public/data/providers.json` from each StatusPage.io API |
| `monitor.yml` | `*/5 * * * *` | Detect new incidents, send Telegram alert |

## First-time setup

```sh
cd cloudflare-worker
npm install -g wrangler   # or use npx
wrangler login            # browser auth (one time)
```

Create a GitHub Personal Access Token:
- https://github.com/settings/tokens → Fine-grained
- Resource: only `subright85/providerpulse`
- Permissions: **Actions: Read and write**
- Copy the token

Store the PAT as a Worker secret:
```sh
wrangler secret put GITHUB_TOKEN
# paste the token when prompted
```

Deploy:
```sh
wrangler deploy
```

After deploy, the Worker fires on the cron schedule. Check logs in the Cloudflare dashboard → Workers & Pages → `isllmdown-cron` → Logs.

## Manual trigger (debugging)

The Worker exposes a `/trigger` endpoint for manual dispatch:

```sh
curl -X POST "https://isllmdown-cron.<your-subdomain>.workers.dev/trigger?wf=collect.yml"
curl -X POST "https://isllmdown-cron.<your-subdomain>.workers.dev/trigger?wf=monitor.yml"
```

## After this Worker is live: disable the GitHub Actions schedule

Edit `.github/workflows/collect.yml` and `.github/workflows/monitor.yml`:

```yaml
on:
  # Schedule disabled — Cloudflare Worker triggers via workflow_dispatch
  # schedule:
  #   - cron: '*/10 * * * *'
  workflow_dispatch:
```

Keeping `workflow_dispatch:` is required so the Worker can trigger them.
