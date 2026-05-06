export interface Env {
  GITHUB_TOKEN: string;
}

const OWNER = "subright85";
const REPO = "IsLLMDown";

async function dispatch(workflow: string, token: string): Promise<void> {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${workflow}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "isllmdown-cron",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main" }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`dispatch ${workflow} failed: ${res.status} ${body}`);
  }
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = controller.cron;
    const targets =
      cron === "*/5 * * * *"
        ? ["monitor.yml"]
        : cron === "*/15 * * * *"
          ? ["collect.yml"]
          : [];

    if (targets.length === 0) {
      console.warn(`unknown cron: ${cron}`);
      return;
    }

    ctx.waitUntil(
      Promise.allSettled(targets.map((wf) => dispatch(wf, env.GITHUB_TOKEN))).then((results) => {
        for (const r of results) {
          if (r.status === "rejected") console.error(r.reason);
        }
      }),
    );
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/trigger") {
      const wf = url.searchParams.get("wf");
      if (wf !== "collect.yml" && wf !== "monitor.yml") {
        return new Response("wf must be collect.yml or monitor.yml", { status: 400 });
      }
      try {
        await dispatch(wf, env.GITHUB_TOKEN);
        return new Response(`dispatched ${wf}`, { status: 200 });
      } catch (e) {
        return new Response(String(e), { status: 500 });
      }
    }
    return new Response("isllmdown-cron worker. POST /trigger?wf=collect.yml|monitor.yml", { status: 200 });
  },
};
