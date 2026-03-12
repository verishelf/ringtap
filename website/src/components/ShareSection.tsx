"use client";

const SITE_URL = "https://www.ringtap.me";
const SITE_TITLE = "RingTap — Your Digital Business Card. One Tap.";
const SITE_DESC = "Share your profile with NFC and QR. Your link, your theme: ringtap.me/you. Free to start.";

function shareUrl(platform: string, url: string, title: string, text: string): string {
  const encoded = encodeURIComponent;
  switch (platform) {
    // twitter/share removed per request
    // linkedin removed per request
    case "facebook":
      // link directly to CEO's profile as requested
      return "https://www.facebook.com/profile.php?id=61582754347003";
    case "instagram":
      // open official RingTap Instagram page
      return "https://www.instagram.com/ringtap.me";
    default:
      return url;
  }
}

export function ShareSection() {
  const handleShare = (platform: string) => {
    const url = shareUrl(platform, SITE_URL, SITE_TITLE, `${SITE_TITLE} — ${SITE_DESC}`);
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SITE_URL);
    window.alert("Link copied! Share it with friends.");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="text-sm text-muted-light">Share RingTap:</span>
      {/* LinkedIn and X buttons removed per request */}
      <button
        type="button"
        onClick={() => handleShare("facebook")}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-surface text-muted-light hover:border-accent hover:text-accent transition-colors"
        aria-label="Share on Facebook"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => handleShare("instagram")}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-surface text-muted-light hover:border-accent hover:text-accent transition-colors"
        aria-label="Visit our Instagram"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm5.25-.75a1 1 0 110 2 1 1 0 010-2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-full border border-border-light bg-surface px-4 py-2 text-sm text-muted-light hover:border-accent hover:text-accent transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy link
      </button>
    </div>
  );
}
