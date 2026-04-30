import { useEffect, useState } from 'react';

const COFFEE_URL = 'https://buymeacoffee.com/subright85';
const TOAST_KEY = 'providerpulse_donate_toast_seen';
const TOAST_DELAY_MS = 8000;

export default function FloatingDonateButton() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(TOAST_KEY)) return;

    const timer = setTimeout(() => {
      setShowToast(true);
      window.localStorage.setItem(TOAST_KEY, '1');
      setTimeout(() => setShowToast(false), 6000);
    }, TOAST_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showToast && (
        <div className="fixed bottom-20 right-4 z-50 max-w-xs animate-fade-in">
          <div className="bg-[#1a1a22] border border-white/10 rounded-2xl shadow-xl px-4 py-3 text-sm text-white/85">
            <button
              onClick={() => setShowToast(false)}
              className="absolute top-1 right-2 text-white/30 hover:text-white/60 text-xs"
              aria-label="Close"
            >
              ✕
            </button>
            <p className="pr-4">If ProviderPulse helps, ☕ buy me a coffee?</p>
          </div>
        </div>
      )}

      <a
        href={COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee"
        className="fixed bottom-4 right-4 z-50 group flex items-center gap-2 bg-[#FFDD00] hover:bg-[#FFE433] text-black font-semibold rounded-full px-4 py-2.5 shadow-lg shadow-yellow-400/20 transition-all hover:shadow-xl hover:scale-105"
      >
        <span className="text-lg leading-none">☕</span>
        <span className="text-sm hidden sm:inline">Buy me a coffee</span>
      </a>
    </>
  );
}
