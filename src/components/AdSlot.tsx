// "Tools we use" placeholder per Nami's launch plan. Stays in the layout
// where the eventual Carbon Ads slot will live.

const STACK = [
  { name: 'Vercel',     url: 'https://vercel.com' },
  { name: 'GitHub',     url: 'https://github.com' },
  { name: 'Tailwind',   url: 'https://tailwindcss.com' },
  { name: 'Carbon Ads', url: 'https://www.carbonads.net', tag: 'coming' },
];

const COFFEE_URL = 'https://buymeacoffee.com/subright85';

export default function AdSlot() {
  return (
    <div className="border-2 border-dashed border-white/30 px-4 py-4 flex flex-col gap-3 bg-white/3 font-mono">
      <div className="text-center">
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Built with</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {STACK.map(s => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-[#00ff00] text-xs font-bold uppercase transition-colors"
            >
              {s.name}
              {s.tag && <span className="ml-1 text-[9px] text-white/30">({s.tag})</span>}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-white/20 pt-3 text-center">
        <a
          href={COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[#00ff00] hover:underline text-xs font-bold uppercase"
        >
          ☕ Like LLMDown? Buy me a coffee
        </a>
        <p className="text-white/40 text-[10px] mt-1">Solo project, free forever — coffee keeps the cron jobs running.</p>
      </div>
    </div>
  );
}
