import { useEffect, useState } from 'react';
import { supabase, supabaseEnabled } from '../lib/supabase';

type Action = 'verify' | 'unsub' | null;

// Detects ?verify=<token> or ?unsub=<token> in the URL on mount, calls the
// matching Supabase RPC, and renders a banner with the result. Removes the
// query param from the URL afterward so refresh doesn't re-trigger.
export default function VerifyHandler() {
  const [action, setAction] = useState<Action>(null);
  const [result, setResult] = useState<{ ok: boolean; email?: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify');
    const unsubToken = params.get('unsub');

    if (!verifyToken && !unsubToken) return;
    if (!supabaseEnabled || !supabase) return;
    const sb = supabase;

    const run = async () => {
      if (verifyToken) {
        setAction('verify');
        const { data, error } = await sb.rpc('verify_subscriber', { token: verifyToken });
        setResult({ ok: !error && !!data, email: data ?? undefined });
      } else if (unsubToken) {
        setAction('unsub');
        const { data, error } = await sb.rpc('unsubscribe', { token: unsubToken });
        setResult({ ok: !error && !!data, email: data ?? undefined });
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    };
    run();
  }, []);

  if (!action || !result) return null;

  if (action === 'verify') {
    return result.ok ? (
      <Banner tone="success">
        ✓ Email confirmed{result.email ? ` for ${result.email}` : ''}. You'll get alerts when picked providers have incidents.
      </Banner>
    ) : (
      <Banner tone="error">
        Verification link is invalid or expired. Try subscribing again.
      </Banner>
    );
  }

  return result.ok ? (
    <Banner tone="success">
      ✓ Unsubscribed{result.email ? ` ${result.email}` : ''}. Sorry to see you go.
    </Banner>
  ) : (
    <Banner tone="error">
      Unsubscribe link is invalid or already used.
    </Banner>
  );
}

function Banner({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  const cls = tone === 'success'
    ? 'bg-emerald-500/8 border-emerald-500/30 text-emerald-200'
    : 'bg-red-500/8 border-red-500/30 text-red-200';
  return (
    <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}
