import { useEffect, useRef } from 'react';

type LegalSection = 'terms' | 'privacy' | 'attribution';

interface Props {
  section: LegalSection;
  onClose: () => void;
}

export default function LegalModal({ section, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    attribution: 'Attribution & Trademarks',
  }[section];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 id="legal-modal-title" className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-900 text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-6">Last updated: May 12, 2026</p>

        {section === 'terms' && <TermsContent />}
        {section === 'privacy' && <PrivacyContent />}
        {section === 'attribution' && <AttributionContent />}
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
      <section>
        <h3 className="font-bold text-gray-900 mb-2">Data Provided "As Is"</h3>
        <p>
          IsLLMDown aggregates publicly available status data from third-party providers' official
          StatusPage.io endpoints. We do not guarantee accuracy, completeness, or timeliness of any
          data displayed. Status information may be delayed, incorrect, or out of sync with the
          actual operational state of any provider's service.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Informational Only — Not Authoritative</h3>
        <p>
          IsLLMDown is for informational and research purposes. Do not rely solely on this service
          for production decisions, incident response, or SLA monitoring. Always consult each
          provider's official status page and incident channels for authoritative information.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Limitation of Liability</h3>
        <p>
          IsLLMDown and its operators shall not be liable for any direct, indirect, incidental,
          special, consequential, or punitive damages arising from your use of this service. Total
          liability for any claim is limited to USD $100 or the amount you have paid us in the past
          12 months, whichever is greater.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">No Warranty</h3>
        <p>
          This service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind,
          either express or implied, including but not limited to warranties of merchantability,
          fitness for a particular purpose, or non-infringement.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Governing Law</h3>
        <p>
          These terms are governed by the laws of the State of California, without regard to
          conflict-of-law principles.
        </p>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
      <section>
        <h3 className="font-bold text-gray-900 mb-2">Information We Collect</h3>
        <p>
          IsLLMDown does not require signup or login. We do not collect or store personal
          information. We use Vercel Analytics to count page views and aggregate visitor metrics
          (referrer, country, device type) — no individual user tracking.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Local Storage</h3>
        <p>
          We use browser local storage only for UI preferences (e.g., dismissing the donation
          banner). This data never leaves your browser.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Cookies & Third Parties</h3>
        <p>
          IsLLMDown may display advertisements via Google AdSense. Google and its advertising
          partners may set their own cookies under their respective privacy policies. We do not
          control or share data with these partners beyond standard ad-serving mechanics.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">California Residents (CCPA)</h3>
        <p>
          California residents have the right to know what personal information we collect, to
          request deletion, and to opt out of any sale of personal information. We do not sell
          personal information.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Children Under 13 (COPPA)</h3>
        <p>
          IsLLMDown is not directed at children under 13. We do not knowingly collect personal
          information from children under 13.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Contact</h3>
        <p>
          For privacy questions or data deletion requests, contact us via the project's GitHub
          repository.
        </p>
      </section>
    </div>
  );
}

function AttributionContent() {
  return (
    <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
      <section>
        <h3 className="font-bold text-gray-900 mb-2">Data Sources</h3>
        <p>
          All status data displayed on IsLLMDown is sourced from each provider's official public
          StatusPage.io endpoint (e.g., <code className="bg-gray-100 px-1 rounded">status.openai.com/api/v2/summary.json</code>).
          Data is aggregated at 5-minute intervals via automated cron jobs.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Provider Trademarks</h3>
        <p className="mb-3">
          All provider names, logos, and trademarks are property of their respective owners:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>OpenAI® is a trademark of OpenAI OpCo, LLC</li>
          <li>Anthropic® and Claude® are trademarks of Anthropic, PBC</li>
          <li>Google AI® and Gemini® are trademarks of Google LLC</li>
          <li>Groq® is a trademark of Groq, Inc.</li>
          <li>Cohere® is a trademark of Cohere Inc.</li>
          <li>DeepSeek® is a trademark of DeepSeek AI</li>
          <li>Perplexity® is a trademark of Perplexity AI, Inc.</li>
          <li>AI21® is a trademark of AI21 Labs, Inc.</li>
        </ul>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">No Affiliation</h3>
        <p>
          IsLLMDown is an <strong>independent third-party service</strong>. We are not affiliated
          with, endorsed by, sponsored by, or otherwise officially connected to any of the
          providers listed. Status data is publicly available and presented for informational
          purposes only.
        </p>
      </section>

      <section>
        <h3 className="font-bold text-gray-900 mb-2">Open Source</h3>
        <p>
          IsLLMDown is open source under the MIT License. Source code is available at{' '}
          <a
            href="https://github.com/subright85/IsLLMDown"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            github.com/subright85/IsLLMDown
          </a>
          .
        </p>
      </section>
    </div>
  );
}
