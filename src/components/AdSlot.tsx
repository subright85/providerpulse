// "Tools we use" placeholder per Nami's launch plan. Stays in the layout where
// the eventual Carbon Ads slot will live, but renders honest self-promo until
// traffic clears the Carbon application threshold (~100k MAU).

const STACK = [
  { name: 'Vercel',     url: 'https://vercel.com' },
  { name: 'GitHub',     url: 'https://github.com' },
  { name: 'Resend',     url: 'https://resend.com' },
  { name: 'Tailwind',   url: 'https://tailwindcss.com' },
  { name: 'Carbon Ads', url: 'https://www.carbonads.net', tag: 'coming' },
];

export default function AdSlot() {
  return (
    <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl px-4 py-3 text-center">
      <p className="text-white/30 text-[10px] uppercase tracking-widest">Built with</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
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
  );
}
