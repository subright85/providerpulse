import { useState } from 'react';
import LegalModal from './LegalModal';

type LegalSection = 'terms' | 'privacy' | 'attribution';

export default function LegalFooter() {
  const [openSection, setOpenSection] = useState<LegalSection | null>(null);

  return (
    <>
      <footer className="mt-12 border-t border-gray-200 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="text-center sm:text-left">
            <p>
              <strong>IsLLMDown</strong> — Independent third-party LLM status dashboard.
              Not affiliated with any provider listed.
            </p>
            <p className="mt-1">
              Data sourced from public StatusPage.io APIs. Informational use only — not authoritative.
            </p>
          </div>

          <nav aria-label="Legal links" className="flex gap-4 flex-shrink-0">
            <button
              onClick={() => setOpenSection('terms')}
              className="hover:text-gray-900 hover:underline"
            >
              Terms
            </button>
            <button
              onClick={() => setOpenSection('privacy')}
              className="hover:text-gray-900 hover:underline"
            >
              Privacy
            </button>
            <button
              onClick={() => setOpenSection('attribution')}
              className="hover:text-gray-900 hover:underline"
            >
              Attribution
            </button>
            <a
              href="https://github.com/subright85/IsLLMDown"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 hover:underline"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>

      {openSection && (
        <LegalModal section={openSection} onClose={() => setOpenSection(null)} />
      )}
    </>
  );
}
