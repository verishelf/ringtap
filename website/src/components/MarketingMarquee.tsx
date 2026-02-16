'use client';

const MARQUEE_ITEMS = [
  'One tap to share',
  'NFC rings • QR codes • Your link',
  'Free to start',
  'ringtap.me/you',
  'Your digital business card',
  'No typing, no paper',
  'Pro: themes & analytics',
  'Works on iPhone & Android',
];

export function MarketingMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-border-light/50 bg-surface/50 py-3 pt-16">
      <div className="inline-flex w-max animate-marquee whitespace-nowrap">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="mx-8 shrink-0 text-sm font-medium text-white font-['Doto']">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
