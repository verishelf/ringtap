import Link from "next/link";

const SAMPLE_PROFILE = {
  name: "Alex Chen",
  title: "Product Designer",
  bio: "Creating digital experiences that connect people. Love NFC, QR, and making networking effortless.",
  username: "demo",
  links: [
    { type: "linkedin", label: "LinkedIn", url: "#" },
    { type: "instagram", label: "Instagram", url: "#" },
    { type: "other", label: "Portfolio", url: "#" },
  ],
};

export function SampleProfilePreview() {
  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-muted-light mb-4">
        See what your profile looks like when someone taps your ring or scans your QR
      </p>
      <div className="relative">
        {/* Phone frame */}
        <div className="rounded-[2rem] border-2 border-border-light bg-background p-2 shadow-xl">
          <div className="rounded-[1.5rem] overflow-hidden bg-surface w-[280px] sm:w-[320px]">
            {/* Profile card mockup */}
            <div className="rounded-2xl border border-border-light bg-surface overflow-hidden">
              <div className="pt-6 pb-4 px-5 text-center">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-surface-elevated border border-border-light text-2xl font-bold text-accent">
                  {SAMPLE_PROFILE.name.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
                  {SAMPLE_PROFILE.name}
                  <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-background" title="Pro">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </h3>
                <p className="text-muted-light text-sm mt-0.5">{SAMPLE_PROFILE.title}</p>
                <p className="text-muted-light text-xs mt-2 line-clamp-2 px-2">
                  {SAMPLE_PROFILE.bio}
                </p>
                <p className="text-muted text-xs mt-2">ringtap.me/{SAMPLE_PROFILE.username}</p>
              </div>
              <div className="border-t border-border-light px-5 py-4 space-y-2">
                {SAMPLE_PROFILE.links.map((link) => (
                  <div
                    key={link.type}
                    className="flex items-center justify-between rounded-xl border border-border-light bg-surface-elevated px-4 py-3 text-sm font-medium text-foreground"
                  >
                    {link.label}
                    <svg className="w-4 h-4 text-muted-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Link
        href="/demo"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:bg-muted-light transition-colors"
      >
        View sample profile
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  );
}
