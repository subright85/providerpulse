// "Tools we use" placeholder per Nami's launch plan. Stays in the layout where
// the eventual Carbon Ads slot will live, but renders honest self-promo +
// support link until traffic clears the Carbon application threshold (~100k MAU).

const STACK = [
  { name: 'Vercel',     url: 'https://vercel.com' },
  { name: 'GitHub',     url: 'https://github.com' },
  { name: 'Tailwind',   url: 'https://tailwindcss.com' },
  { name: 'Carbon Ads', url: 'https://www.carbonads.net', tag: 'coming' },
];

const COFFEE_URL = 'https://buymeacoffee.com/sukim';

export default function AdSlot() {
  return (
    <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl px-4 py-4 flex flex-col gap-3">
      <div className="text-center">
        <p className="text-white/30 text-[10px] uppercase tracking-widest">Built with</p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {STACK.map(s => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/55 hover:text-white text-xs font-medium transition-colors"
            >
              {s.name}
              {s.tag && <span className="ml-1 text-[9px] text-white/25">({s.tag})</span>}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/6 pt-3 text-center">
        <a
          href={COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-amber-300/85 hover:text-amber-200 text-xs font-semibold transition-colors"
        >
          ☕ Like ProviderPulse? Buy me a coffee
        </a>
        <p className="text-white/25 text-[10px] mt-1">Solo project, free forever — coffee keeps the cron jobs running.</p>
      </div>
    </div>
  );
}
