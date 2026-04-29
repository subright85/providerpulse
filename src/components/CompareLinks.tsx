import { Link } from 'react-router-dom';

const FEATURED_COMPARISONS: Array<{ slug: string; label: string; tag: string }> = [
  { slug: 'openai-vs-anthropic',  label: 'OpenAI vs Anthropic',     tag: 'LLM' },
  { slug: 'groq-vs-openai',       label: 'Groq vs OpenAI',          tag: 'LLM' },
  { slug: 'cohere-vs-anthropic',  label: 'Cohere vs Anthropic',     tag: 'LLM' },
  { slug: 'vercel-vs-netlify',    label: 'Vercel vs Netlify',       tag: 'Hosting' },
  { slug: 'supabase-vs-mongodb',  label: 'Supabase vs MongoDB',     tag: 'Data' },
  { slug: 'twilio-vs-sendgrid',   label: 'Twilio vs SendGrid',      tag: 'Comms' },
];

export default function CompareLinks() {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
      <p className="text-white font-semibold text-sm">⚖️ Compare two providers head-to-head</p>
      <p className="text-white/40 text-xs mt-0.5">
        Side-by-side reliability scores, uptime, and incident counts.
      </p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {FEATURED_COMPARISONS.map(c => (
          <Link
            key={c.slug}
            to={`/compare/${c.slug}`}
            className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-3 py-2 transition-all"
          >
            <p className="text-white/85 text-xs font-semibold leading-tight">{c.label}</p>
            <p className="text-white/30 text-[10px] mt-0.5">{c.tag}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
