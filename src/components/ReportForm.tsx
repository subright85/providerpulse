import { useState } from 'react';
import type { ProviderData } from '../types';
import { supabase, supabaseEnabled } from '../lib/supabase';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const INCIDENT_TYPES = [
  { id: 'outage',     label: 'Full outage' },
  { id: 'degraded',   label: 'Degraded performance' },
  { id: 'auth',       label: 'Auth / login issue' },
  { id: 'rate-limit', label: 'Rate limiting' },
  { id: 'data',       label: 'Data / wrong response' },
  { id: 'other',      label: 'Other' },
];

interface Props {
  providers: ProviderData[];
}

export default function ReportForm({ providers }: Props) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [incidentType, setIncidentType] = useState('outage');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseEnabled || !supabase) {
      setStatus('error');
      setErrorMsg('Reports are not configured yet — coming soon!');
      return;
    }
    if (!providerId || description.trim().length < 10) {
      setStatus('error');
      setErrorMsg('Pick a provider and describe what you saw (at least 10 chars).');
      return;
    }

    setStatus('submitting');
    const { error } = await supabase.from('reports').insert({
      provider_id: providerId,
      incident_type: incidentType,
      description: description.trim(),
      user_email: email.trim() || null,
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Failed to submit. Try again.');
      return;
    }
    setStatus('success');
    setDescription('');
    setEmail('');
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white/4 border border-white/8 rounded-2xl p-4 text-left hover:bg-white/6 transition-all"
      >
        <p className="text-white text-sm font-semibold">🚨 Spotted an outage?</p>
        <p className="text-white/40 text-xs mt-0.5">
          Report what you're seeing. We'll surface community-verified incidents alongside official status.
        </p>
      </button>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-2xl p-5 text-center">
        <p className="text-emerald-300 font-semibold text-sm">✓ Report received</p>
        <p className="text-white/40 text-xs mt-1">A moderator will review it before it goes public.</p>
        <button onClick={() => { setOpen(false); setStatus('idle'); }} className="text-white/40 hover:text-white text-xs mt-3 underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm">🚨 Report an incident</p>
        <button type="button" onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-sm">✕</button>
      </div>

      <select
        value={providerId}
        onChange={e => setProviderId(e.target.value)}
        required
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
      >
        <option value="" className="bg-[#0f1117]">Which provider?</option>
        {providers.map(p => (
          <option key={p.provider.id} value={p.provider.id} className="bg-[#0f1117]">
            {p.provider.name}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-1.5">
        {INCIDENT_TYPES.map(t => (
          <button
            type="button"
            key={t.id}
            onClick={() => setIncidentType(t.id)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              incidentType === t.id
                ? 'bg-orange-500/20 text-orange-200 border border-orange-500/40'
                : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="What are you seeing? (errors, slowness, region, when it started…)"
        maxLength={2000}
        required
        rows={3}
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25 resize-none"
      />

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Your email (optional, for follow-up)"
        autoComplete="email"
        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25"
      />

      {status === 'error' && <p className="text-red-400 text-xs">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-200 rounded-xl py-2 text-sm font-semibold transition-all disabled:opacity-50"
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit report'}
      </button>

      <p className="text-white/25 text-[10px] text-center">Reports are reviewed before going public · Free</p>
    </form>
  );
}
