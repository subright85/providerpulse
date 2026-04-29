// Carbon Ads placeholder. Activate after the site reaches ~100k monthly PV
// (Carbon Ads minimum traffic requirement). Use Carbon, NOT AdSense — Carbon's
// ad pool is dev-targeted (Stripe, Vercel, etc.) which fits ProviderPulse's
// developer audience and avoids the trust hit AdSense would cause here.
//
// To activate:
//   1. Apply at https://www.carbonads.net (provide the live site URL).
//   2. They send a serve code <script src="//cdn.carbonads.com/...">.
//   3. Replace this placeholder block with that script tag.

export default function AdSlot() {
  if (import.meta.env.PROD) return null; // hide in production until activated
  return (
    <div className="bg-white/3 border border-dashed border-white/10 rounded-xl p-3 text-center">
      <p className="text-white/25 text-[10px] uppercase tracking-widest">Ad slot</p>
      <p className="text-white/30 text-[10px] mt-0.5">Carbon Ads — activate after 100k MAU</p>
    </div>
  );
}
