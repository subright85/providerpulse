import { useState } from 'react';
import type { ProviderData } from '../types';
import { supabase, supabaseEnabled } from '../lib/supabase';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface Props {
  providers: ProviderData[];
}

export default function SubscribeForm({ providers }: Props) {
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseEnabled || !supabase) {
      setStatus('error');
      setErrorMsg('Subscriptions are not configured yet — coming soon!');
      return;
    }
    if (!email.includes('@')) {
      setStatus('error');
      setErrorMsg('Enter a valid email address.');
      return;
    }
    if (selected.size === 0) {
      setStatus('error');
      setErrorMsg('Pick at least one provider to follow.');
      return;
    }

    setStatus('submitting');
    // RLS only allows anon insert (no update). For "already subscribed", treat
    // 23505 unique-constraint as success — we don't expose update to anon to
    // prevent strangers from overwriting someone else's subscription list.
    const { error } = await supabase
      .from('subscribers')
      .insert({ email, providers: [...selected] });

    if (error && error.code !== '23505') {
      setStatus('error');
      setErrorMsg(error.message || 'Something went wrong. Try again.');
      return;
    }
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-2xl p-5 text-center">
        <p className="text-emerald-300 font-semibold text-sm">✓ You're subscribed</p>
        <p className="text-white/40 text-xs mt-1">We'll email you when any of those providers have an incident.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
      <div>
        <p className="text-white font-semibold text-sm">📧 Get free incident alerts</p>
        <p className="text-white/40 text-xs mt-0.5">
          Pick the providers you depend on. We'll email you when they go down.
        </p>
      </div>

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@company.com"
        autoComplete="email"
        required
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25"
      />

      <div className="flex flex-wrap gap-1.5">
        {providers.map(p => {
          const on = selected.has(p.provider.id);
          return (
            <button
              type="button"
              key={p.provider.id}
              onClick={() => toggle(p.provider.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                on
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/80'
              }`}
            >
              <img src={`https://www.google.com/s2/favicons?domain=${p.provider.domain}&sz=32`} alt="" className="w-3.5 h-3.5 rounded" />
              {p.provider.name}
            </button>
          );
        })}
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 rounded-xl py-2 text-sm font-semibold transition-all disabled:opacity-50"
      >
        {status === 'submitting' ? 'Subscribing…' : `Notify me${selected.size > 0 ? ` (${selected.size})` : ''}`}
      </button>

      <p className="text-white/25 text-[10px] text-center">Free · Unsubscribe anytime · No spam</p>
    </form>
  );
}
