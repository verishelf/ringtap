import { proMarketingLucideIcon } from "@/lib/proFeatureIcons";
import { Crown } from "lucide-react";

import { PRO_UPGRADE_FEATURE_ITEMS } from "../../../constants/proUpgradeFeatures";

/** Extra clarity for web visitors — still accurate Pro benefits, some omitted from short app bullets. */
const PRO_WEB_EXTRA_LINES = [
  "Sync saved contacts to your phone address book (Pro)",
  "Custom QR with your logo and colors on your profile",
  "Verified-style badge & ring border on your card",
  "Theme on ringtap.me matches your app — one polished brand everywhere",
] as const;

type Props = {
  variant?: "full" | "compact";
  /** Show the gold positioning line from product strategy */
  showTagline?: boolean;
  className?: string;
};

export function ProValueSection({
  variant = "full",
  showTagline = true,
  className = "",
}: Props) {
  const dense = variant === "compact";

  return (
    <section className={className}>
      {showTagline ? (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 px-5 py-4 mb-8">
          <p className="flex items-start gap-3 text-sm md:text-base text-foreground leading-relaxed">
            <Crown className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" aria-hidden />
            <span>
              <strong className="font-semibold">RingTap Pro</strong> is where a tap turns into a{" "}
              <strong className="font-semibold">tracked relationship</strong>: lead capture on your public page,
              optional webhooks into Zapier or Make, full analytics (including lead submissions), networking map with
              hotspots and events, follow-up reminders and pipeline tags on contacts, and HubSpot sync — not just a
              prettier link page.
            </span>
          </p>
        </div>
      ) : null}

      {!dense ? (
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Crown className="h-6 w-6 text-amber-500" aria-hidden />
          Everything included in Pro
        </h2>
      ) : null}

      <ul className={`grid gap-3 ${dense ? "sm:grid-cols-1" : "sm:grid-cols-2 gap-4"}`}>
        {PRO_UPGRADE_FEATURE_ITEMS.map((item) => {
          const Icon = proMarketingLucideIcon(item.icon);
          return (
            <li
              key={item.text}
              className={`flex gap-3 rounded-xl border border-border-light bg-surface ${dense ? "p-3" : "p-4"}`}
            >
              <div className="shrink-0 rounded-lg bg-accent/15 p-2 text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className={`text-muted-light leading-snug ${dense ? "text-xs" : "text-sm"}`}>
                <span className="text-foreground font-medium block mb-0.5">{item.text}</span>
              </p>
            </li>
          );
        })}
      </ul>

      {!dense ? (
        <>
          <h3 className="text-sm font-semibold text-foreground mt-8 mb-3">Also includes</h3>
          <ul className="space-y-2 text-sm text-muted-light">
            {PRO_WEB_EXTRA_LINES.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-accent font-bold shrink-0">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
